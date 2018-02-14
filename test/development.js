'use strict';

// file on which to run browserify when manually testing (in a browser)
// or working on the module (to see the effect of changes in the browser).

let lookup = require('../src/index.js');


// DON'T FORGET TO RUN THE BROWSERIFY COMMAND (FROM PACKAGE.JSON) BEFORE LOADING IN A BROWSER

console.log('the place lookup uri: ')
console.log(lookup.getPlaceLookupURI('paris'))


lookup.findPlace('paris').then((result)=>{
    console.log('a lookup of paris in place: ')
    console.log(result)
})
