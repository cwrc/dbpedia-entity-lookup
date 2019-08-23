'use strict';

let dbpedia = require('../src/index.js');

const fetchMock = require('fetch-mock');

const queryString = 'smith';
const queryStringWithNoResults = 'ldfjk';
const queryStringForTimeout = "chartrand";
const queryStringForError = "cuff";
const queryStringForMissingDescriptionInResult = 'blash';
const expectedResultLength = 5;
const emptyResultFixture = JSON.stringify(require('./httpResponseMocks/noResults.json'));
const resultsFixture = JSON.stringify(require('./httpResponseMocks/results.json'));
const noDescResultsFixture = JSON.stringify(require('./httpResponseMocks/resultsWitoutDescription.json'));

jest.useFakeTimers();

// setup server mocks for each type of call
[
    { uriBuilderFn: 'getPersonLookupURI', testFixture: resultsFixture },
    { uriBuilderFn: 'getPlaceLookupURI', testFixture: resultsFixture },
    { uriBuilderFn: 'getOrganizationLookupURI', testFixture: resultsFixture },
    { uriBuilderFn: 'getTitleLookupURI', testFixture: resultsFixture },
    { uriBuilderFn: 'getRSLookupURI', testFixture: resultsFixture }
].forEach(entityLookup => {

    let uriBuilderFn = dbpedia[entityLookup.uriBuilderFn];

    fetchMock.get(uriBuilderFn(queryString), entityLookup.testFixture);
    fetchMock.get(uriBuilderFn(queryStringWithNoResults), emptyResultFixture);
    fetchMock.get(uriBuilderFn(queryStringForTimeout), (url, opts) => {
        setTimeout(Promise.resolve, 8100);
    });
    fetchMock.get(uriBuilderFn(queryStringForError), 500);
    fetchMock.get(uriBuilderFn(queryStringForMissingDescriptionInResult), noDescResultsFixture)
})

// from https://stackoverflow.com/a/35047888
function doObjectsHaveSameKeys(...objects) {
    const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
    const union = new Set(allKeys);
    return objects.every(object => union.size === Object.keys(object).length);
}

test('lookup builders', () => {
    expect.assertions(5);
    ['getPersonLookupURI', 'getPlaceLookupURI', 'getOrganizationLookupURI', 'getTitleLookupURI', 'getRSLookupURI'].forEach(uriBuilderMethod => {
        expect(dbpedia[uriBuilderMethod](queryString).includes(queryString)).toBe(true);
    });
});

['findPerson', 'findPlace', 'findOrganization', 'findTitle', 'findRS'].forEach((nameOfLookupFn) => {
    test(nameOfLookupFn, async () => {
        expect.assertions(21);
        let lookupFn = dbpedia[nameOfLookupFn];
        expect(typeof lookupFn).toBe('function');
        let results = await lookupFn(queryString);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(expectedResultLength);
        results.forEach(singleResult => {
            expect(doObjectsHaveSameKeys(singleResult, {
                nameType: '',
                id: '',
                uri: '',
                uriForDisplay: '',
                name: '',
                repository: '',
                originalQueryString: '',
                description: ''
            })).toBe(true);
            expect(singleResult.originalQueryString).toBe(queryString);
        })

        // with a result from dbpedia with no Description
        results = await lookupFn(queryStringForMissingDescriptionInResult);
        expect(Array.isArray(results)).toBe(true);
        expect(doObjectsHaveSameKeys(results[0], {
            nameType: '',
            id: '',
            uri: '',
            uriForDisplay: '',
            name: '',
            repository: '',
            originalQueryString: '',
            description: ''
        })).toBe(true);
        expect(results[0].description).toBe('No description available');

        // with no results
        results = await lookupFn(queryStringWithNoResults);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);

        // with a server error
        let shouldBeNullResult = false;
        shouldBeNullResult = await lookupFn(queryStringForError).catch(error => {
            // an http error should reject the promise
            expect(true).toBe(true);
            return false;
        })
        // a falsey result should be returned
        expect(shouldBeNullResult).toBeFalsy();

        // when query times out
        try {
            await lookupFn(queryStringForTimeout);
        } catch (err) {
            // the promise should be rejected
            expect(true).toBe(true);
        }
    })
})




