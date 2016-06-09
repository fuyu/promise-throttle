/* exported PromiseThrottle */

'use strict';

/**
 * @constructor
 * @param {Object} options A set op options to pass to the throttle function
 *        @param {number} concurrency The number of simultaneously active requests
 */
function PromiseThrottle(options) {
  this.promiseImplementation = options.promiseImplementation || Promise;
  this.queued = [];
  this.concurrency = options.concurrency || 1;
  this.numberOfConcurrentlyExecuting = 0;
}

/**
 * Adds a promise
 * @param {Promise} promise The promise to be added
 * @return {Promise} A promise
 */
PromiseThrottle.prototype.add = function (promise) {
  var self = this;
  return new self.promiseImplementation(function(resolve, reject) {
    self.queued.push({
      resolve: resolve,
      reject: reject,
      promise: promise
    });

    self.dequeue();
  });
};

/**
 * Adds all the promises passed as parameters
 * @param {array} promises An array of promises
 * @return {void}
 */
PromiseThrottle.prototype.addAll = function (promises) {
  promises.forEach(function(promise) {
    this.add(promise);
  }.bind(this));
};

/**
 * Dequeues a promise
 * @return {void}
 */
PromiseThrottle.prototype.dequeue = function () {
  if (this.queued.length === 0) {
    return;
  }

  if (this.numberOfConcurrentlyExecuting >= this.concurrency) {
    return;
  }

  var candidate = this.queued.shift();
  this.numberOfConcurrentlyExecuting += 1;
  const self = this;

  candidate.promise()
    .then(result => {
      //console.log("\n-----PROMISE COMPLETE");
      candidate.resolve(result);
      self.numberOfConcurrentlyExecuting -= 1;
      //console.log("numberOfConcurrentlyExecuting: ", self.numberOfConcurrentlyExecuting);
      self.dequeue();

    })
    .catch(error => {
      //console.log("\n-----PROMISE REJECTED");
      candidate.reject(error);
    });
};


module.exports = PromiseThrottle;

