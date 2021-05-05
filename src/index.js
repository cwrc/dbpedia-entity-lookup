const findPerson = (queryString) => {
  const url = getPersonLookupURI(queryString);
  return callDBPedia(url, queryString, 'person');
};

const findPlace = (queryString) => {
  const url = getPlaceLookupURI(queryString);
  return callDBPedia(url, queryString, 'place');
};

const findOrganization = (queryString) => {
  const url = getOrganizationLookupURI(queryString);
  return callDBPedia(url, queryString, 'organisation');
};

const findTitle = (queryString) => {
  const url = getTitleLookupURI(queryString);
  return callDBPedia(url, queryString, 'work');
};

const findRS = (queryString) => {
  const url = getRSLookupURI(queryString);
  return callDBPedia(url, queryString, 'thing');
};

const getPersonLookupURI = (queryString) => getEntitySourceURI(queryString, 'person');
const getPlaceLookupURI = (queryString) => getEntitySourceURI(queryString, 'place');
const getOrganizationLookupURI = (queryString) => getEntitySourceURI(queryString, 'organisation');
const getTitleLookupURI = (queryString) => getEntitySourceURI(queryString, 'work');
const getRSLookupURI = (queryString) => getEntitySourceURI(queryString, 'thing');

// note that this method is exposed on the npm module to simplify testing,
// i.e., to allow intercepting the HTTP call during testing.
const getEntitySourceURI = (queryString, queryClass) => {
  const baseUrl = 'https://lookup.dbpedia.org/api/search/KeywordSearch';
  const maxHits = 5;
  const encodeQueryString = encodeURIComponent(queryString);
  const format = 'json';

  return `${baseUrl}?QueryClass=${queryClass}&MaxHits=${maxHits}&QueryString=${encodeQueryString}&format=${format}`;
};

const callDBPedia = async (url, queryString, queryClass) => {
  const response = await fetchWithTimeout(url).catch((error) => {
    return error;
  });

  if (!response.ok) {
    throw new Error(
      `Something wrong with the call to DBPedia, possibly a problem with the network or the server. HTTP error: ${response.status}`
    );
  }

  const responseJson = await response.json();

  const mapResponse = responseJson.docs.map(
    ({ comment = 'No description available', label, resource }) => {
      const name = label[0]?.replace(/(<([^>]+)>)/gi, '');
      const uri = resource[0];
      const description = comment[0];
      const uriForDisplay = uri.replace(
        'http://dbpedia.org',
        'https://dbpedia.lookup.services.cwrc.ca'
      );

      return {
        nameType: queryClass,
        id: uri,
        uri,
        uriForDisplay,
        name,
        repository: 'dbpedia',
        originalQueryString: queryString,
        description,
      };
    }
  );

  return mapResponse;
};

const fetchWithTimeout = (url, time = 30000) => {
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
  return Promise.race([fetch(url), timeout]);
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
