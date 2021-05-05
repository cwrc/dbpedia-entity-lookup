import fetchMock from 'fetch-mock';
import dbpedia from '../src/index.js';

const emptyResultFixture = JSON.stringify(require('./httpResponseMocks/noResults.json'));
const resultsFixture = JSON.stringify(require('./httpResponseMocks/results.json'));

const queryString = 'Paris';
const queryStringWithNoResults = 'ldfjk';
const queryStringForTimeout = 'testing';
const queryStringForError = 'cuff';
const expectedResultLength = 5;

jest.useFakeTimers();

// setup server mocks for each type of call
[
  ['getPersonLookupURI', resultsFixture],
  ['getPlaceLookupURI', resultsFixture],
  ['getOrganizationLookupURI', resultsFixture],
  ['getTitleLookupURI', resultsFixture],
  ['getRSLookupURI', resultsFixture],
].forEach(([uriBuilderType,testFixture]) => {
  const uriBuilderFn = dbpedia[uriBuilderType];

  fetchMock.get(uriBuilderFn(queryString), testFixture);
  fetchMock.get(uriBuilderFn(queryStringWithNoResults), emptyResultFixture);
  fetchMock.get(uriBuilderFn(queryStringForTimeout), () => {
    setTimeout(Promise.resolve, 8100);
  });
  fetchMock.get(uriBuilderFn(queryStringForError), 500);
});

// from https://stackoverflow.com/a/35047888
const doObjectsHaveSameKeys = (...objects) => {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every((object) => union.size === Object.keys(object).length);
};

test('lookup builders', () => {
  expect.assertions(5);
  [
    'getPersonLookupURI',
    'getPlaceLookupURI',
    'getOrganizationLookupURI',
    'getTitleLookupURI',
    'getRSLookupURI',
  ].forEach((uriBuilderMethod) => {
    expect(dbpedia[uriBuilderMethod](queryString).includes(queryString)).toBe(true);
  });
});

['findPerson', 'findPlace', 'findOrganization', 'findTitle', 'findRS'].forEach((nameOfLookupFn) => {
  test(`${nameOfLookupFn}`, async () => {
    expect.assertions(12);

    const results = await dbpedia[nameOfLookupFn](queryString);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(expectedResultLength);
    results.forEach((singleResult) => {
      expect(
        doObjectsHaveSameKeys(singleResult, {
          nameType: '',
          id: '',
          uri: '',
          uriForDisplay: '',
          name: '',
          repository: '',
          originalQueryString: '',
          description: '',
        })
      ).toBe(true);
      expect(singleResult.originalQueryString).toBe(queryString);
    });
  });

  test(`${nameOfLookupFn} - no results`, async () => {
    // with no results
    expect.assertions(2);

    const results = await dbpedia[nameOfLookupFn](queryStringWithNoResults);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  test(`${nameOfLookupFn} - server error`, async () => {
    // with a server error
    expect.assertions(2);

    let shouldBeNullResult = false;
    shouldBeNullResult = await dbpedia[nameOfLookupFn](queryStringForError).catch(() => {
      // an http error should reject the promise
      expect(true).toBe(true);
      return false;
    });
    // a falsey result should be returned
    expect(shouldBeNullResult).toBeFalsy();
  });

  test(`${nameOfLookupFn} - times out`, async () => {
    // when query times out
    expect.assertions(1);
    await dbpedia[nameOfLookupFn](queryStringForTimeout).catch(() => {
      expect(true).toBe(true);
    });
  });
});
