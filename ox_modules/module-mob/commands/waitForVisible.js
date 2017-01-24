/**
 * @summary Wait for an element for the provided amount of milliseconds to be present within the DOM.
 * @function waitForElement
 * @param {String} locator - Element locator. "id=" to search by ID or "//" to search by XPath.
 * @param {Integer} wait - Time in milliseconds to wait for the element.
 * @return {}
 */
module.exports = function(locator, wait) {
	wait = wait || this.DEFAULT_WAIT_TIMEOUT;
	
	if (!locator) 
		throw new Error('locator is empty or not specified');
	// when locator is an element object
	if (typeof locator === 'object' && locator.waitForVisible) {
		return locator.waitForVisible(wait);
	}
	// when locator is string
	locator = this._helpers.getWdioLocator(locator);
	return this._driver.waitForVisible(locator, wait);
};
