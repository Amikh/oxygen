/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the value of a CSS property of an element.
 * @function getCssValue
 * @param {String} locator - An element locator.
 * @param {String} propertyName - CSS property name.
 * @return {String} CSS property value.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.getCssValue("id=UserName","color");//Gets a CSS value from an element.
 */
module.exports = function(locator, propertyName) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentNonEmptyString(propertyName, 'propertyName');
    if (this.autoWait) {
        this.waitForExist(locator);
    }
    return this.driver.getCssProperty(wdloc, propertyName).value.trim().replace(/\s+/g, ' ');
};
