/**
 * @summary Pauses test execution for given amount of milliseconds.
 * @function pause
 * @param {Integer} ms - milliseconds to pause the execution.
 */
module.exports = function(ms) {
	return this._driver.pause(ms);
};