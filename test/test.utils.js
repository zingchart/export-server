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
  // Test accounts
  user_read: 'auth0|5df277efbdca220dcd187f0a',

  // Helper Functions
};

module.exports = {
  utils,
};
