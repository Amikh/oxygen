/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Determines if an element is selected.
 * @function isSelected
 * @param {String|WebElement} locator - Element locator.
 * @return {Boolean} - true if element is selected. false otherwise.
 * @for android
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.isExist("id=Selection");//Determines if element is selected.
 */
module.exports = function(locator) {
    this.helpers._assertArgument(locator, 'locator');

    if (typeof locator === 'object' && locator.getAttribute) {
        return locator.getAttribute('selected') == 'true';
    }
    
    locator = this.helpers.getWdioLocator(locator);
    return this.driver.getAttribute(locator, 'selected') == 'true';
};
