/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Scrolls the element into the visible area of the browser window.
 * @function scrollIntoView
 * @param {String} locator - Element locator.
 * @param {Boolean=} alignToTop - Indicates whether to align the element to the top. Element is centered otherwise.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.scrollIntoElement('id=bottomPanel',true);//Scrolls the element into the visible area of the browser window.
*/
module.exports = function(locator, alignToTop) {
    this.helpers._assertArgument(locator);
    alignToTop = typeof alignToTop === 'boolean' ? alignToTop : true;

    if (this.autoWait) {
        this.waitForExist(locator);
    }

    locator = this.helpers.getWdioLocator(locator);

    this.driver.selectorExecute(
        locator,
        function(elms, alignToTop) {
            var elm = elms && elms.length > 0 ? elms[0] : null;
            if (!elm) {
                return;
            }
            elm.scrollIntoView(alignToTop);
        },
        alignToTop
    );
};
