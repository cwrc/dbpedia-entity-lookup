'use strict';

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

const fetchWithTimeout = async (url, config = { headers: {'Accept': 'application/json'}}, timeout = 30000) => {

    /*
        the reject on the promise in the timeout callback won't have any effect, *unless*
        the timeout is triggered before the fetch resolves, in which case the setTimeout rejects
        the whole outer Promise, and the promise from the fetch is dropped entirely.
    */
   
    setTimeout(() => {
        throw new Error('Call to DBPedia timed out');
    },timeout);

    const response = await fetch(url, config)
        .catch( error => {
            throw new Error(`Something wrong with the call to DBPedia, possibly a problem with the network or the server. Error: ${error}`);
        });
    
    if (response.ok) return response.json()
    
    // if status not ok, through an error
    throw new Error(`Something wrong with the call to DBPedia, possibly a problem with the network or the server. HTTP error: ${response.status}`);

    // return new Promise((resolve, reject) => {
    //     // the reject on the promise in the timeout callback won't have any effect, *unless*
    //     // the timeout is triggered before the fetch resolves, in which case the setTimeout rejects
    //     // the whole outer Promise, and the promise from the fetch is dropped entirely.
    //     setTimeout(() => reject(new Error('Call to DBPedia timed out')), timeout);
    //     fetch(url, config).then(resolve, reject);
    // }).then(
    //     response => {
    //         // check for ok status
    //         if (response.ok) {
    //             return response.json()
    //         }
    //         // if status not ok, through an error
    //         throw new Error(`Something wrong with the call to DBPedia, possibly a problem with the network or the server. HTTP error: ${response.status}`);
    //     }
    //     /*,
    //             // instead of handling and rethrowing the error here, we just let it bubble through
    //             error => {
    //             // we could instead handle a reject from either of the fetch or setTimeout promises,
    //             // whichever first rejects, do some loggingor something, and then throw a new rejection.
    //                 console.log(error)
    //                 return Promise.reject(new Error(`some error jjk: ${error}`))
    //             }*/
    // )
}

// note that this method is exposed on the npm module to simplify testing,
// i.e., to allow intercepting the HTTP call during testing.
const getEntitySourceURI = (queryString, queryClass) => {
    // Calls a cwrc proxy (https://lookup.services.cwrc.ca/dbpedia), so that we can make https calls from the browser.
    // The proxy in turn then calls http://lookup.dbpedia.org
    // The dbpedia lookup doesn't seem to have an https endpoint
    return `https://lookup.services.cwrc.ca/dbpedia/api/search/KeywordSearch?QueryClass=${queryClass}&MaxHits=5&QueryString=${encodeURIComponent(queryString)}`
}

const getPersonLookupURI = (queryString) => getEntitySourceURI(queryString, 'person');

const getPlaceLookupURI = (queryString) => getEntitySourceURI(queryString, 'place');

const getOrganizationLookupURI = (queryString) => getEntitySourceURI(queryString, 'organisation');

const getTitleLookupURI = (queryString) => getEntitySourceURI(queryString, 'work');

const getRSLookupURI = (queryString) => getEntitySourceURI(queryString, 'thing');

const callDBPedia = async (url, queryString, queryClass) => {

    const response = await fetchWithTimeout(url);

    const mapResponse = response.results.map(
        ({
            uri,
            label: name,
            description: description = 'No description available'
        }) => {
            return {
                nameType: queryClass,
                id: uri,
                uri,
                uriForDisplay: uri.replace('http://dbpedia.org', 'https://dbpedia.lookup.services.cwrc.ca'),
                name,
                repository: 'dbpedia',
                originalQueryString: queryString,
                description
            }
        })

    return mapResponse;

    // return fetchWithTimeout(url).then((parsedJSON)=>{
    //     return parsedJSON.results.map(
    //         ({
    //              uri,
    //              label: name,
    //              description: description = 'No description available'
    //          }) => {
    //             return {
    //                 nameType: queryClass,
    //                 id: uri,
    //                 uri,
    //                 uriForDisplay: uri.replace('http://dbpedia.org', 'https://dbpedia.lookup.services.cwrc.ca'),
    //                 name,
    //                 repository: 'dbpedia',
    //                 originalQueryString: queryString,
    //                 description
    //             }
    //         })
    // })
}

const findPerson = (queryString) => callDBPedia(getPersonLookupURI(queryString), queryString, 'person');

const findPlace = (queryString) => callDBPedia(getPlaceLookupURI(queryString), queryString, 'place');

const findOrganization = (queryString) => callDBPedia(getOrganizationLookupURI(queryString), queryString, 'organisation');

const findTitle = (queryString) => callDBPedia(getTitleLookupURI(queryString), queryString, 'work');

const findRS = (queryString) => callDBPedia(getRSLookupURI(queryString), queryString, 'thing');

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
    getRSLookupURI
}