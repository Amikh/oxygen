/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Perform a swipe on the screen or an element.
 * @function swipe
 * @param {String=} locator - Locator of the element to swipe on.
 * @param {Number} xoffset - Horizontal offset.
 * @param {Number} yoffset - Vertical offset. Negative value indicates swipe down and positive indicates swipe up direction.
 * @param {Number=} xstart - Absolute X coordinate to start the swipe from.
 * @param {Number=} ystart - Absolute Y coordinate to start the swipe from.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * // swipe 500 pixels down using an element as a starting point
 * mob.swipe('id=com.package.app:id/element_id', 0, -500);
 * // swipe 500 pixels down using absolute coordinates (50x300) as a starting point
 * mob.swipe(0, -500, 10, 300);
 */
module.exports = function(locator, xoffset, yoffset, xstart, ystart) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentNumber(xoffset, 'xoffset');
    this.helpers._assertArgumentNumber(yoffset, 'yoffset');

    if (typeof locator === 'number') {
        // swipe using absolute coordinates as a starting point
        this.helpers._assertArgumentNumber(arguments[2] /*xstart*/, 'xstart');
        this.helpers._assertArgumentNumber(arguments[3] /*ystart*/, 'ystart');
        this.driver.touchAction(
            [
                { action: 'press', x: arguments[2] /*xstart*/, y: arguments[3] /*ystart*/ },
                { action: 'moveTo', x: arguments[0] /*xoffset*/, y: arguments[1] /*yoffset*/ },
                'release'
            ]
        );
    } else {
        // swipe using an element as a starting point
        if (typeof locator === 'object' && locator.touchAction) {
            locator.touchAction(
                [
                    'press',
                    { action: 'moveTo', x: xoffset, y: yoffset },
                    'release'
                ]
            );
            return;
        }

        if (this.autoWait) {
            this.waitForExist(locator);
        }
        this.driver.touchAction(
            this.helpers.getWdioLocator(locator),
            [
                'press',
                { action: 'moveTo', x: xoffset, y: yoffset },
                'release'
            ]
        );
    }
};
