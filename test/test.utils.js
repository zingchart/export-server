// Dependencies
const BlinkDiff = require('blink-diff');

// SETUP & INITIALIZE
// ---------------------------------
// Global rootRequire
global.rootRequire = function(name) {
  return require('../server' + name.slice(1));
};
global.Logger = console;

// Chai
global.expect = require('chai').expect;

// Start server
global.server = require('../server.js').app;


// CONSTS & HELPER FUNCTIONS
// ---------------------------------
let utils = {
  // Global variables

  // Helper Functions
  /**
   * @description To generate a comparison file and return the diff results
   * docs: http://yahoo.github.io/blink-diff/docs/classes/BlinkDiff.html
   * @param {String} fileName1 - path to first image
   * @param {String} fileName2 - path to second image
   * @param {String} diffImage - output path of comparison image
   */
  compareScreenshotsBlinkDiff: async function(fileName1, fileName2, diffImage) {
    return new Promise(async function(resolve, reject) {
      // generate diff image
      const blinkDiff = new BlinkDiff({
        imageAPath: fileName1, // Use already loaded image for first image
        imageBPath: fileName2, // Use file-path to select image
        imageOutputPath: diffImage,

        delta: 50, // Make comparison more tolerant

        // define color of differences in output image
        outputMaskRed: 255,
        outputMaskBlue: 82, 
        outputMaskGreen: 82,
        
        hideShift: true, // Hide anti-aliasing differences - will still determine but not showing it

        hShift: 5, // default is 2
        vShift: 5, // default is 2

        threshold: 0.05, // default threshold is 500px or percent
        thresholdType: BlinkDiff.THRESHOLD_PERCENT, // optional BlinkDiff.THRESHOLD_PERCENT
      });

      // get comparison results
      blinkDiff.runWithPromise()
        .then(function (result) {
          //console.log('---blink results ---')
          const blinkResults = {
            pass: blinkDiff.hasPassed(result.code), // returns 1 if passed
            aboveThreshold: blinkDiff.isAboveThreshold(result.differences), // returns 1 if true
            differences: result.differences,
            width: result.width,
            height: result.height
          };
          resolve(blinkResults)
        }).catch(err => {
          console.error('\n--- error in blink results ---\n')
          resolve(err)
        });
    })
  }
};

// default export
module.exports = {
  utils,
};
