/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Pauses test execution for given amount of milliseconds.
 * @function pause
 * @param {Number} ms - milliseconds to pause the execution.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.pause(5000);//Waits amount of miliseconds till performs the next command.
 */
module.exports = function(ms) {
    this.helpers._assertArgumentNumber(ms, 'ms');
    return this.driver.pause(ms);
};
