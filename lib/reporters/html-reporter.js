/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen HTML Reporter
 */
var path = require('path');
var fs = require('fs');
var EasyXml = require('easyxml');
var libxslt = require('libxslt');

var ReporterFileBase = require('../reporter-file-base');
var util = require('util');
util.inherits(HtmlReporter, ReporterFileBase);

function HtmlReporter(results, options) {
    HtmlReporter.super_.call(this, results, options);
}

HtmlReporter.prototype.generate = function() {
    var resultFilePath = this.createFolderStructureAndFilePath('.xml');
    var resultFolderPath = path.dirname(resultFilePath);

    var serializer = new EasyXml({
        singularize: true,
        rootElement: 'test-results',
        rootArray: 'test-results',
        dateFormat: 'ISO',
        manifest: true,
        unwrapArrays: true,
        filterNulls: true
    });
    this.replaceScreenshotsWithFiles(resultFolderPath);

    var xmlStr = serializer.render(this.results);

    resultFilePath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');
    runXslTransform(xmlStr, resultFilePath);

    return resultFilePath;
};

function runXslTransform(xmlStr, htmlFile) {
    var libxmljs = libxslt.libxmljs;
     
    var transPath = path.join(__dirname, 'html', 'template.xsl');
    var stylesheetStr = fs.readFileSync(transPath);

    var stylesheetObj = libxmljs.parseXml(stylesheetStr, { nocdata: true });
    var stylesheet = libxslt.parse(stylesheetObj);
     
    var xmlObj = libxmljs.parseXml(xmlStr);
    var htmlStr = stylesheet.apply(xmlObj);

    fs.writeFileSync(htmlFile, htmlStr);
}

module.exports = HtmlReporter;
