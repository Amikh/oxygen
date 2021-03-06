/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verifies element's inner text.
 * @function verifyText
 * @param {String|WebElement} locator - Element locator.
 * @param {String} pattern - Assertion text or pattern.
 * @param {String=} message - Message to generate in case of verification failure.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.verifyText('id=header', 'hello world','The element does not match the text');//Verifies element's inner text.
 */
const chai = require('chai');
const assert = chai.assert;

module.exports = function(locator, pattern, message) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentNonEmptyString(pattern, 'pattern');

    var elm = null;
    // when locator is an element object
    if (typeof locator === 'object' && locator.getText) {
        elm = locator;
    } else {
        if (this.autoWait) {
            this.waitForExist(locator);
        }
        elm = this.findElement(locator);
    }
    
    if (!elm) {
        throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
    }
    var actualValue = elm.getText();

    if (pattern.indexOf('regex:') == 0) {
        var regex = new RegExp(pattern.substring('regex:'.length));
        assert.match(actualValue, regex, message);
    } else {
        assert.equal(actualValue, pattern, message);
    }
};
