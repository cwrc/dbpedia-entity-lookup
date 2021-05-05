# dbpedia-entity-lookup

![Picture](http://cwrc.ca/logos/CWRC_logos_2016_versions/CWRCLogo-Horz-FullColour.png)

[![Travis](https://img.shields.io/travis/cwrc/dbpedia-entity-lookup.svg)](https://travis-ci.org/cwrc/dbpedia-entity-lookup)
[![Codecov](https://img.shields.io/codecov/c/github/cwrc/dbpedia-entity-lookup.svg)](https://codecov.io/gh/cwrc/dbpedia-entity-lookup)
[![version](https://img.shields.io/npm/v/dbpedia-entity-lookup.svg)](http://npm.im/dbpedia-entity-lookup)
[![downloads](https://img.shields.io/npm/dm/dbpedia-entity-lookup.svg)](http://npm-stat.com/charts.html?package=dbpedia-entity-lookup&from=2015-08-01)
[![GPL-3.0](https://img.shields.io/npm/l/dbpedia-entity-lookup.svg)](http://opensource.org/licenses/GPL-3.0)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

1. [Overview](#overview)
1. [Installation](#installation)
1. [Use](#use)
1. [API](#api)
1. [Development](#development)

## Overview

Finds entities (people, places, organizations and titles) in dbpedia. Meant to be used with [cwrc-public-entity-dialogs](https://github.com/cwrc-public-entity-dialogs) where it runs in the browser.

Although it will not work in node.js as-is, it does use the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for http requests, and so could likely therefore use a browser/node.js compatible fetch implementation like: [isomorphic-fetch](https://www.npmjs.com/package/isomorphic-fetch).

### SPARQL

dbpedia supports sparql, but SPARQL has limited support for full text search. The expectation with SPARQL mostly seems to be that you know exactly what you are matching on. So, a query that exactly details the label works fine:

```sql
SELECT DISTINCT ?s WHERE {
  ?s ?label "The Rolling Stones"@en .
  ?s ?p ?o
}
```

We'd like, however, to match with full text search, so we can match on partial strings, variant spellings, etc. Just in the simple case above, for example, someone searching for The Rolling Stones would have to fully specify 'The Rolling Stones' and not just 'Rolling Stones'. If they left out 'The' then their query won't return the result.

There is a SPARQL CONTAINS operator that can be used within a FILTER, and that matches substrings, which is better, and CONTAINS does work with dbpedia, but the (admittedly limited) testing we did found it very slow.

There is at least one alternative to CONTAINS - REGEX - but as described here: [https://www.cray.com/blog/dont-use-hammer-screw-nail-alternatives-regex-sparql/](https://www.cray.com/blog/dont-use-hammer-screw-nail-alternatives-regex-sparql/) REGEX has even worse performance than CONTAINS.

Dbpedia does, however, provide a search service: `https://github.com/dbpedia/lookup` a hosted version of which can be accessed at: `https://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=place&MaxResults=5&QueryString=berlin&format=json`

### Installation

`npm i dbpedia-entity-lookup`

## Use

`import dbpediaLookup from 'dbpedia-entity-lookup';`

## API

### findPerson(query)

### findPlace(query)

### findOrganization(query)

### findTitle(query)

where the 'query' argument is an object:  

```js
{
    entity:  "The name of the thing the user wants to find.",
    options: "TBD"
}
```

and all find* methods return promises that resolve to an object like the following:

```json
{
   "queryClass": "place",
   "originalQueryString": "paris",
   "repository": "dbpedia",
   "id": "http://dbpedia.org/resource/Paris",
   "uri": "http://dbpedia.org/resource/Paris",
   "uriForDisplay": "https://dbpedia.lookup.services.cwrc.ca/resource/Paris",
   name: "Paris",
   "description": "Paris is the capital and largest city of France. It is situated on the river Seine, in northern France, at the heart of the Île-de-Franc…",
}
```

There are a further four methods that are mainly made available to facilitate testing (to make it easier to mock calls to the dbpedia service):

### getPersonLookupURI(query)

### getPlaceLookupURI(query)

### getOrganizationLookupURI(query)

### getTitleLookupURI(query)

where the 'query' argument is the entity name to find and the methods return the dbpedia URL that in turn returns results for the query.

## Development

[CWRC-Writer-Dev-Docs](https://github.com/cwrc/CWRC-Writer-Dev-Docs) describes general development practices for CWRC-Writer GitHub repositories, including this one.

### Continuous Integration

We use [Travis](https://travis-ci.org).

#### Release

We follow [SemVer](http://semver.org), which [Semantic Release](https://github.com/semantic-release/semantic-release) makes easy. Semantic Release also writes our commit messages, sets the version number, publishes to NPM, and finally generates a changelog and a release (including a git tag) on GitHub.
