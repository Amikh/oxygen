/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

var _ = require('lodash');
var defer = require('when').defer;
var async = require('async');

function Launcher(testsuite, startupOpt) {
    var module = {};
    var _finished = defer();
    var _results = [];
    var _ts = testsuite;
    var _queue = null;

    /**
     * run sequence
     * @return  {Promise} that only gets resolves with either an exitCode or an error
     */
    module.run = function (capabilities) {
        _queue = async.queue(launchTest, _ts.parallel || 1);
        _queue.drain = endRun;
        _queue.error = endRun;

        // if no capabilities are specified, run single instance with default arguments
        if (!capabilities) {
            _queue.push(null);
        }
        else {
            _.each(capabilities, function(caps) {
                _queue.push(caps);
            });
        }

        return _finished.promise;
    };

    /*********************************
     * Private methods
     *********************************/
    function launchTest(caps, callback) {
        var oxRunner = new require('./oxygen').Runner();
        // adjust startup options to include information from capabilities
        addCapabilitiesToStartupOptions(startupOpt, caps);
        // initialize oxygen
        oxRunner.init(startupOpt)
        .then(function() {
            return oxRunner.run(_ts, null, caps);
        })
        .then(function(tr) {
            _results.push(tr);
            oxRunner.dispose().then(function() {
                // first dispose the oxygen object then call to finish callback
                callback();
            }).catch(function(err) {
                callback(err);
            });
        })
        .catch(function(e) {
            // dispose oxygen first
            oxRunner.dispose().then(function() {
                // stop processing the queue
                _queue.kill();
                // if this is custom error message
                if (e.error) {
                    var errMsg = '';
                    var err = e.error;
                    if (err.type)
                        errMsg += err.type + ' - ';
                    if (err.message)
                        errMsg += err.message;
                    else
                        errMsg = err.toString();
                    callback(new Error(errMsg));
                }
                else
                    callback(e);    // call back with the original exception
            }).catch(function(err) {
                // stop processing the queue
                _queue.kill();
                // report error
                callback(err);
            });
        });
    }

    function endRun(fatalError) {
        if (fatalError) {
            _finished.reject(fatalError);
        }
        else {
            _finished.resolve(_results);
        }

    }
    /*
     * Adds capabilities to startup option, overriding the options
     */
    function addCapabilitiesToStartupOptions(options, caps) {
        if (!caps)
            return;
        if (caps.browserName)
            options.browserName = caps.browserName;
        if (caps.platformName)
            options.platformName = caps.platformName;
        if (caps.platformVersion)
            options.platformVersion = caps.platformVersion;
        if (caps.deviceName)
            options.deviceName = caps.deviceName;
        if (caps.applicationName)
            options.applicationName = caps.applicationName;
    }

    return module;
}

module.exports = Launcher;
