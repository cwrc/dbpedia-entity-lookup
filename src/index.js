// used for testing
export const getPersonLookupURI = (queryString) => getEntitySourceURI(queryString, 'person');
export const getPlaceLookupURI = (queryString) => getEntitySourceURI(queryString, 'place');
export const getOrgLookupURI = (queryString) => getEntitySourceURI(queryString, 'organisation');
export const getTitleLookupURI = (queryString) => getEntitySourceURI(queryString, 'work');
export const getRSLookupURI = (queryString) => getEntitySourceURI(queryString, 'thing');

const findPerson = (queryString) => callDBPedia(queryString, 'person');
const findPlace = (queryString) => callDBPedia(queryString, 'place');
const findOrganization = (queryString) => callDBPedia(queryString, 'organisation');
const findTitle = (queryString) => callDBPedia(queryString, 'work');
const findRS = (queryString) => callDBPedia(queryString, 'thing');

const getEntitySourceURI = (queryString, queryClass) => {
  const baseUrl = 'https://lookup.dbpedia.org/api/search/KeywordSearch';
  const maxHits = 5;
  const encodeQueryString = encodeURIComponent(queryString);
  const format = 'json';

  return `${baseUrl}?QueryClass=${queryClass}&MaxHits=${maxHits}&QueryString=${encodeQueryString}&format=${format}`;
};

const callDBPedia = async (queryString, queryClass) => {
  const url = getEntitySourceURI(queryString, queryClass);
  const response = await fetchWithTimeout(url).catch((error) => {
    return error;
  });

  if (!response.ok) {
    throw new Error(
      `Something wrong with the call to DBPedia, possibly a problem with the network or the server.
      HTTP error: ${response.status}`
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
        originalQueryString: queryString,
        repository: 'dbpedia',
        id: uri,
        uri,
        uriForDisplay,
        name,
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
};
