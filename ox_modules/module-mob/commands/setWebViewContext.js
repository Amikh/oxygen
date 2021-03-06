/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Sets context to the first available WEBVIEW or CHROMIUM (Crosswalk WebView) view.
 * @function setWebViewContext
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.setWebViewContext();//Sets context to the first available WEBVIEW or CHROMIUM (Crosswalk WebView) view.
 */
module.exports = function() {
    var response = this.driver.contexts();
    var contexts = response.value;
    this.sessionId = response.sessionId;
    // select first available WEBVIEW context
    for (var i=0; i < contexts.length; i++) {
        var context = contexts[i];
        if (context && (context.indexOf('WEBVIEW') > -1 || context.indexOf('CHROMIUM') > -1)) {
            this.logger.debug('Setting context: ' + context);
            this.driver.context(context);
            this.appContext = context;
            return context;
        }
    }
};
