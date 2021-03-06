/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Clear the value of an input field.
 * @function clear
 * @param {String} locator - An element locator.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.type("id=Password", "Password");//Types a password to a field.
 * web.clear("id=Password");//Clears the characters from the field of an element.
 
 */
module.exports = function(locator) {
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForVisible(locator);
    }
    this.driver.setValue(wdloc, '');
};
