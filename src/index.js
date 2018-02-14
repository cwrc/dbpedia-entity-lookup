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
            setTimeout(() => reject(new Error('Call to geonames timed out')), timeout);
            fetch(url, config).then(resolve, reject);
        }).then(
            response=>{
                // check for ok status
                if (response.ok) {
                    return response.json()
                }
                // if status not ok, through an error
                throw new Error(`Something wrong with the call to geonames, possibly a problem with the network or the server. HTTP error: ${response.status}`);
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
function getPlaceLookupURI(queryString) {
   // http://api.geonames.org/searchJSON?q=london&maxRows=10&username=demo
    return `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(queryString)}&maxRows=10`
}

function callGeonamesURL(url, queryString) {

    return fetchWithTimeout(url).then((parsedJSON)=>{
        return parsedJSON.geonames.map(
            ({
                 toponymName,
                 adminName1: state = '',
                 countryName = '',
                 geonameId,
                 fcodeName: description = 'No description available'
             }) => {
                let name = `${toponymName} ${state} ${countryName}`;
                let uri = `http://geonames.org/${geonameId}`
                return {
                    nameType: 'place',
                    id: uri,
                    uri,
                    uriForDisplay: `https://secure.geonames.org/${geonameId}`,
                    name,
                    repository: 'geonames',
                    originalQueryString: queryString,
                    description
                }
            })
    })
}



function findPlace(queryString) {
    return callGeonamesURL(getPlaceLookupURI(queryString), queryString)
}


module.exports = {
    findPlace: findPlace,
    getPlaceLookupURI: getPlaceLookupURI
}