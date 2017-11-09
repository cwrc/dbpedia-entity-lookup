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


function fetchWithTimeout(url, config = {headers: {'Accept': 'application/json'}}, timeout = 8000) {

        return new Promise((resolve, reject) => {
            // the reject on the promise in the timeout callback won't have any effect, *unless*
            // the timeout is triggered before the fetch resolves, in which case the setTimeout rejects
            // the whole outer Promise, and the promise from the fetch is dropped entirely.
            setTimeout(() => reject(new Error('Call to DBPedia timed out')), timeout);
            fetch(url, config).then(resolve, reject);
        }).then(
            response=>{
                // check for ok status
                if (response.ok) {
                    return response.json()
                }
                // if status not ok, through an error
                throw new Error(`Something wrong with the call to DBPedia, possibly a problem with the network or the server. HTTP error: ${response.status}`);
            }/*,
            // instead of handling and rethrowing the error here, we just let it bubble through
            error => {
            // we could instead handle a reject from either of the fetch or setTimeout promises,
            // whichever first rejects, do some loggingor something, and then throw a new rejection.
                console.log(error)
                return Promise.reject(new Error(`some error jjk: ${error}`))
            }*/
        )
}

// note that this method is exposed on the npm module to simplify testing,
// i.e., to allow intercepting the HTTP call during testing, using sinon or similar.
function getEntitySourceURI(queryString, queryClass) {

        return `http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=${queryClass}&MaxHits=5&QueryString=${encodeURIComponent(queryString)}`

}

function getPersonLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'person')
}

function getPlaceLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'place')
}

function getOrganizationLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'organisation')
}

function getTitleLookupURI(queryString) {
    return getEntitySourceURI(queryString, 'work')
}

function callDBPedia(url, queryString, queryClass) {

    return fetchWithTimeout(url).then((parsedJSON)=>{
        return parsedJSON.results.map(
            ({
                 uri,
                 label: name,
                 description: description = 'No description available'
             }) => {
                return {nameType: queryClass, id: uri, uri, name, repository: 'dbpedia', originalQueryString: queryString, description}
            })
    })
}

function findPerson(queryString) {
    return callDBPedia(getPersonLookupURI(queryString), queryString, 'person')
}

function findPlace(queryString) {
    return callDBPedia(getPlaceLookupURI(queryString), queryString, 'place')
}

function findOrganization(queryString) {
    return callDBPedia(getOrganizationLookupURI(queryString), queryString, 'organisation')
}

function findTitle(queryString) {
    return callDBPedia(getTitleLookupURI(queryString), queryString, 'work')
}

module.exports = {
    findPerson: findPerson,
    findPlace: findPlace,
    findOrganization: findOrganization,
    findTitle: findTitle,
    getPersonLookupURI: getPersonLookupURI,
    getPlaceLookupURI: getPlaceLookupURI,
    getOrganizationLookupURI: getOrganizationLookupURI,
    getTitleLookupURI: getTitleLookupURI,
}