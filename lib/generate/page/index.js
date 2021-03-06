var util = require("util");
var path = require("path");
var Q = require("q");
var swig = require('swig');

var fs = require("../fs");
var parse = require("../../parse");
var BaseGenerator = require("../generator");


/*
 *  This generator will generate a simple index.html which can be converted as a PDF
 */
var Generator = function() {
    BaseGenerator.apply(this, arguments);

    // Load base template
    this.template = swig.compileFile(path.resolve(this.options.theme, 'templates/page.html'));

    // List of pages content
    this.pages = [];
};
util.inherits(Generator, BaseGenerator);

Generator.prototype.transferFile = function(input) {
    // ignore
};

Generator.prototype.convertFile = function(content, input) {
    var that = this;
    var json = {
        path: input,
        progress: parse.progress(this.options.navigation, input)
    };

    return Q()
    .then(function() {
        return parse.page(content, {
            repo: that.options.githubId,
            dir: path.dirname(input) || '/'
        });
    })
    .then(function(sections) {
        json.content = sections;
    })
    .then(function() {
        that.pages.push(json);
    });
};

Generator.prototype.finish = function() {
    var that = this;
    var basePath = ".";
    var output = path.join(this.options.output, "index.html");

    return Q()
    .then(function() {
        return that.template({
            title: that.options.title,
            description: that.options.description,

            githubAuthor: that.options.github.split("/")[0],
            githubId: that.options.github,
            githubHost: that.options.githubHost,

            summary: that.options.summary,
            allNavigation: that.options.navigation,
            
            pages: that.pages,

            basePath: basePath,
            staticBase: path.join(basePath, "gitbook"),
        });
    })
    .then(function(html) {
        return fs.writeFile(
            output,
            html
        );
    });
};

module.exports = Generator;