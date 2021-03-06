/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Verifies the page title.
 * @function verifyTitle
 * @param {String} pattern - Assertion text or pattern.
 * @param {String=} message - Message to generate in case of verification failure.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.verifyTitle('Website Title','The Title does not match the expected text');//Verifies the page title.
 */
const chai = require('chai');
const assert = chai.assert;

module.exports = function(pattern, message) {
    this.helpers._assertArgumentNonEmptyString(pattern, 'pattern');
    var title = this.driver.getTitle();
    if (pattern.indexOf('regex:') == 0) {
        var regex = new RegExp(pattern.substring('regex:'.length));
        assert.match(title, regex, message);
    } else {
        assert.equal(title, pattern, message);
    }
};
