'use strict';

// file on which to run browserify when manually testing (in a browser)
// or working on the module (to see the effect of changes in the browser).

let lookup = require('../src/index.js');


// DON'T FORGET TO RUN THE BROWSERIFY COMMAND (FROM PACKAGE.JSON) BEFORE LOADING IN A BROWSER
console.log('the person lookup uri: ')
console.log(lookup.getPersonLookupURI('smith'))

console.log('the place lookup uri: ')
console.log(lookup.getPlaceLookupURI('paris'))

console.log('the org lookup uri: ')
console.log(lookup.getOrganizationLookupURI('jones'))

console.log('the title lookup uri: ')
console.log(lookup.getTitleLookupURI('smith'))

lookup.findPerson('smith').then((result)=>{
    console.log('a lookup of smith in people: ')
    console.log(result)
})

lookup.findPlace('paris').then((result)=>{
    console.log('a lookup of paris in place: ')
    console.log(result)
})

lookup.findOrganization('jones').then((result)=>{
    console.log('a lookup of jones in organizations: ')
    console.log(result)
})

lookup.findTitle('smith').then((result)=>{
    console.log('a lookup of smith in titles: ')
    console.log(result)
})