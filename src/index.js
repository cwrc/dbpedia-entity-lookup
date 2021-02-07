const findPerson = (queryString) => callDBPedia(getPersonLookupURI(queryString), queryString, 'person');
const findPlace = (queryString) => callDBPedia(getPlaceLookupURI(queryString), queryString, 'place');
const findOrganization = (queryString) => {
  return callDBPedia(getOrganizationLookupURI(queryString), queryString, 'organisation');
};
const findTitle = (queryString) => callDBPedia(getTitleLookupURI(queryString), queryString, 'work');
const findRS = (queryString) => callDBPedia(getRSLookupURI(queryString), queryString, 'thing');

const getPersonLookupURI = (queryString) => getEntitySourceURI(queryString, 'person');
const getPlaceLookupURI = (queryString) => getEntitySourceURI(queryString, 'place');
const getOrganizationLookupURI = (queryString) => getEntitySourceURI(queryString, 'organisation');
const getTitleLookupURI = (queryString) => getEntitySourceURI(queryString, 'work');
const getRSLookupURI = (queryString) => getEntitySourceURI(queryString, 'thing');

// note that this method is exposed on the npm module to simplify testing,
// i.e., to allow intercepting the HTTP call during testing.
const getEntitySourceURI = (queryString, queryClass) => {
  // Calls a cwrc proxy (https://lookup.services.cwrc.ca/dbpedia), so that we can make https calls from the browser.
  // The proxy in turn then calls http://lookup.dbpedia.org
  // The dbpedia lookup doesn't seem to have an https endpoint
  const encodeURI = encodeURIComponent(queryString);
  return `https://lookup.services.cwrc.ca/dbpedia/api/search/KeywordSearch?QueryClass=${queryClass}&MaxHits=5&QueryString=${encodeURI}`;
};

const callDBPedia = async (url, queryString, queryClass) => {
  const response = await fetchWithTimeout(url).catch((error) => {
    return error;
  });

  //if status not ok, through an error
  if (!response.ok) {
    throw new Error(
      `Something wrong with the call to DBPedia, possibly a problem with the network or the server. HTTP error: ${response.status}`
    );
  }

  const responseJson = await response.json();

  const mapResponse = responseJson.results.map(
    ({ uri, label: name, description: description = 'No description available' }) => {
      return {
        nameType: queryClass,
        id: uri,
        uri,
        uriForDisplay: uri.replace('http://dbpedia.org', 'https://dbpedia.lookup.services.cwrc.ca'),
        name,
        repository: 'dbpedia',
        originalQueryString: queryString,
        description,
      };
    }
  );

  return mapResponse;
};

/*
     config is passed through to fetch, so could include things like:
     {
         method: 'get',
         credentials: 'same-origin'
    }
    Note that the default config includes the accept header.  If an over-riding config
    is passed in, don't forget to set the accept header so we get json back from dbpedia
    and not XML.
*/

const fetchWithTimeout = (url, config = { headers: { Accept: 'application/json' } }, time = 30000) => {
  /*
	the reject on the promise in the timeout callback won't have any effect, *unless*
	the timeout is triggered before the fetch resolves, in which case the setTimeout rejects
	the whole outer Promise, and the promise from the fetch is dropped entirely.
	*/

  // Create a promise that rejects in <time> milliseconds
  const timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('Call to DBPedia timed out');
    }, time);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([fetch(url, config), timeout]);
};

export default {
  findPerson,
  findPlace,
  findOrganization,
  findTitle,
  findRS,
  getPersonLookupURI,
  getPlaceLookupURI,
  getOrganizationLookupURI,
  getTitleLookupURI,
  getRSLookupURI,
};
