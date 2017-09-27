/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen PDF Reporter
 */
var path = require('path');
var fs = require('fs');
var EasyXml = require('easyxml');
var exec = require('child_process').execFileSync;
var libxslt = require('libxslt');

var ReporterFileBase = require('../reporter-file-base');
var util = require('util');
util.inherits(PdfReporter, ReporterFileBase);

function PdfReporter(results, options) {
    PdfReporter.super_.call(this, results, options);
}

PdfReporter.prototype.generate = function() {
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
    var htmlPath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');
    runXslTransform(xmlStr, htmlPath);

    return convertToPdf(htmlPath);
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

function convertToPdf(htmlFile) {
    var binPath;

    if (process.platform === 'win32') {
        binPath = path.join(__dirname, 'pdf', 'wkhtmltopdf.exe');
    } else if (process.platform === 'linux') {
        binPath = path.join(__dirname, 'pdf', 'wkhtmltopdf-lin');
    } else {
        throw 'PDF reporter is not yet supported on OS X.';
        //binPath = path.join(__dirname, 'pdf', 'wkhtmltopdf-osx');
    }

    var pdfPath = htmlFile.replace(new RegExp('.htm', 'g'), '.pdf');

    exec(binPath, ['-q', '--viewport-size', '1600x900', '-O', 'Landscape', '-L', '10mm', '-R', '10mm', '-T', '10mm', '-B', '10mm', htmlFile, pdfPath], {stdio:[0,1,2]});

    fs.unlinkSync(htmlFile);

    return pdfPath;
}

module.exports = PdfReporter;
