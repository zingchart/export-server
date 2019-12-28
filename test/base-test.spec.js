const utils = require('./test.utils').utils;
const axios = require('axios');
const fs = require('fs');

describe(`Server Route Test's`, function() {
  
  // before(function(done) {
  //   // Waits for quickbooks to initialize
  //   done();
  // });

  // test the response status's
  // ---------------------------------
  describe('Get Base Routes', function() {
    it(' Post / Url is OK', async function() {
      try {
        let response = await axios.post('http://localhost:8080/');
        expect(response.statusText).to.equal('OK');
        expect(response.status).to.equal(200);
      } catch(e) {
        if (process.env.DEBUG) console.error(e);
      }
    });
 
    it('Post /json Url is OK', async function() {
      try {
        let response = await axios.post('http://localhost:8080/json');
        expect(response.statusText).to.equal('OK');
        expect(response.status).to.equal(200);
      } catch(e) {
        if (process.env.DEBUG) console.error(e);
      }
    });
  });

  // test the output for PNG creation
  // ---------------------------------
  describe('PNG Creation', function() {


    // test to make sure the image matches
    it('Post /json PNG output is exact match', async function() {
      try {
        let chartConfig = require('./configs/plain-chart.js');

        let response = await axios({
          method: 'post',
          url: 'http://localhost:8080/json',
          responseType: 'stream',
          data: {
            chartConfig,
            t: 'png',
            height: '500px',
            width: '500px'
          }
        });
        // pipe results into dist folder
        response.data.pipe(await fs.createWriteStream(`${__dirname}/dist/test1.png`));
        // check results again reference image and pipe to dist/diff 
        let blinkDiffResults = await utils.compareScreenshotsBlinkDiff(
          `${__dirname}/dist/test1.png`, // file 1
          `${__dirname}/references/test1-500x500.png`, // file 2
          `${__dirname}/dist/diff/test1.png`, // output image path
        );
        // verify pass's threshold and the the differences are zero (COULD Loosen this restriction)
        expect(blinkDiffResults.pass).to.equal(true);
        expect(blinkDiffResults.differences).to.equal(0);
      } catch(e) {
        if (process.env.DEBUG) console.error(e);
      }
    });
  });
});
