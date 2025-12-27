/**
 * Artillery processor functions for load testing
 * Provides custom functions for generating dynamic test data
 */

const { faker } = require('@faker-js/faker');

/**
 * Generate random test data for each virtual user
 */
function generateRandomData(userContext, events, done) {
  // Generate random user data
  userContext.vars.randomEmail = faker.internet.email();
  userContext.vars.randomId = faker.string.uuid();
  userContext.vars.randomPhone = faker.phone.number();
  userContext.vars.randomName = faker.person.fullName();

  return done();
}

/**
 * Log response details for debugging
 */
function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log('Error response:', {
      url: requestParams.url,
      status: response.statusCode,
      body: response.body
    });
  }
  return next();
}

/**
 * Custom metrics tracking
 */
function trackCustomMetrics(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    ee.emit('counter', 'api.success', 1);
  } else if (response.statusCode >= 400 && response.statusCode < 500) {
    ee.emit('counter', 'api.client_error', 1);
  } else if (response.statusCode >= 500) {
    ee.emit('counter', 'api.server_error', 1);
  }

  return next();
}

module.exports = {
  generateRandomData,
  logResponse,
  trackCustomMetrics
};
