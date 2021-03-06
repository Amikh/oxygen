/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function takeScreenshot
 * @summary Take a screenshot of the current page or screen and return it as base64 encoded string.
 * @return {String} Screenshot image encoded as a base64 string.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.takeScreenshot();//Take a screenshot of the current page or screen and return it as base64 encoded string.
 */
module.exports = function() {
    var response = this.driver.screenshot();
    return response.value || null;
};
