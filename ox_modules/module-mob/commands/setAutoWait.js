/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Specifies whether commands should automatically wait till element appear before executing.
 * @description By default automatic waiting is enabled. This setting affects all commands which 
 *              expect to perform some action on elements, except `wait*`, `assert*`, `is*` and 
 *              other commands which receive optional timeout parameter.
 * @function setAutoWait
 * @param {Boolean} enable - true to enable automatic waiting, false to disable.
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.setAutoWait(true);//Specifies whether commands should automatically wait till element appear before executing.
 */
module.exports = function(enable) {
    this.helpers._assertArgumentBool(enable, 'enable');
    this.autoWait = enable;
};
