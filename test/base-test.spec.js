const utils = require('./test.utils').utils;
const axios = require('axios');


describe(`Server Route Test's`, function() {
  // before(function(done) {
  //   // Waits for quickbooks to initialize
  //   done();
  // });

  // getSubscriptions
  // ---------------------------------
  describe('Get Base Routes', function() {
    it(' Post / Url is OK', function(done) {
      axios.post('http://localhost:8080/')
        .then(function (response) {
          // console.log(response);
          expect(response.statusText).to.equal('OK');
          expect(response.status).to.equal(200);
          done();
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    it('Post /json Url is OK', function(done) {
      axios.post('http://localhost:8080/json')
        .then(function (response) {
          // console.log(response);
          expect(response.statusText).to.equal('OK');
          expect(response.status).to.equal(200);
          done();
        })
        .catch(function (error) {
          console.log(error);
        });
    });
  });

});
