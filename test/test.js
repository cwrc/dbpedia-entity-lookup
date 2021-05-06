import fetchMock from 'fetch-mock';
import dbpedia, {
  getPersonLookupURI,
  getPlaceLookupURI,
  getOrgLookupURI,
  getTitleLookupURI,
  getRSLookupURI,
} from '../src/index.js';

const emptyResultFixture = JSON.stringify(require('./httpResponseMocks/noResults.json'));
const resultsFixture = JSON.stringify(require('./httpResponseMocks/results.json'));

const queryString = 'Paris';
const queryStringWithNoResults = 'ldfjk';
const queryStringForTimeout = 'testing';
const queryStringForError = 'cuff';
const expectedResultLength = 5;

jest.useFakeTimers();

// setup server mocks for each type of call
const lookupTypes = [
  {
    name: 'person',
    lookupFn: dbpedia.findPerson,
    uriBuilderFn: getPersonLookupURI,
    testFixture: resultsFixture,
  },
  {
    name: 'place',
    lookupFn: dbpedia.findPlace,
    uriBuilderFn: getPlaceLookupURI,
    testFixture: resultsFixture,
  },
  {
    name: 'organisation',
    lookupFn: dbpedia.findOrganization,
    uriBuilderFn: getOrgLookupURI,
    testFixture: resultsFixture,
  },
  {
    name: 'title',
    lookupFn: dbpedia.findTitle,
    uriBuilderFn: getTitleLookupURI,
    testFixture: resultsFixture,
  },
  {
    name: 'rs',
    lookupFn: dbpedia.findRS,
    uriBuilderFn: getRSLookupURI,
    testFixture: resultsFixture,
  },
];

lookupTypes.forEach(({ uriBuilderFn, testFixture }) => {
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
  lookupTypes.forEach(({ uriBuilderFn }) => {
    expect(uriBuilderFn(queryString).includes(queryString)).toBe(true);
  });
});

lookupTypes.forEach(({ name, lookupFn }) => {
  test(`find ${name}`, async () => {
    expect.assertions(12);

    const results = await lookupFn(queryString);

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

  test(`find ${name} - no results`, async () => {
    // with no results
    expect.assertions(2);

    const results = await lookupFn(queryStringWithNoResults);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  test(`find ${name} - server error`, async () => {
    // with a server error
    expect.assertions(2);

    let shouldBeNullResult = false;
    shouldBeNullResult = await lookupFn(queryStringForError).catch(() => {
      // an http error should reject the promise
      expect(true).toBe(true);
      return false;
    });
    // a falsey result should be returned
    expect(shouldBeNullResult).toBeFalsy();
  });

  test(`find ${name} - times out`, async () => {
    // when query times out
    expect.assertions(1);
    await lookupFn(queryStringForTimeout).catch(() => {
      expect(true).toBe(true);
    });
  });
});
