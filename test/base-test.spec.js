const utils = require('./test.utils').utils;
const axios = require('axios');


describe('Base Server Test', function() {
  // Waits for database to connect
  this.timeout(5000);

  let subscriptionDefaults = {
    req: function({sub}) {
      return {
        user: {
          sub,
        },
      };
    },
  };

  before(function(done) {
    // Waits for quickbooks to initialize
    // Quickbooks.init()
    //   .then(function() {
    //     done();
    //   });
    done();
  });

  // getSubscriptions
  // ---------------------------------
  describe('Get Base Routes', function() {
    it('/ Post Url is OK', function(done) {
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

    it('/json Post Url is OK', function(done) {
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
  });

});
