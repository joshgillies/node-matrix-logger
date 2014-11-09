var url = require('url');
var rand = require('crypto-rand').rand;
var hyperquest = require('hyperquest');
var trumpet = require('trumpet');
var ent = require('ent');
var concat = require('concat-stream');
var through = require('through');
var matrixUrl = require('node-matrix-url');
var minify = require('html-minifier').minify;
var stripTags = require('js-striphtml').stripTags;

var stripHtml = function stripHtml(string) {
  return stripTags(minify(string, {
    removeEmptyElements: true
  }));
};

var parseInfo = function parseInfo(string) {
  var lines = stripHtml(string).split('\n');
  return lines.map(function(line, index){
    return ent.decode(line.trim());
  }).join(' ');
};

var concatString = function concatString(callback) {
  return concat({ encoding: 'string' }, callback);
};

var Logger = function Logger(opts, callback) {
  if (typeof opts === 'function') callback = opts;

  var tr = trumpet();
  var htmlStream = through().pause();
  var objStream = through().pause();

  var req = hyperquest(matrixUrl(opts.admin.href, {
    screen: 'log',
    level: opts.level,
    lines: opts.lines,
    rand: rand()
  }));
  req.setHeader('Cookie', opts.cookie);
  req.pipe(concatString(function(data) {
    htmlStream.queue(minify(data)).end();
  }));

  htmlStream.pipe(tr);
  htmlStream.resume();

  // info and time stamp
  tr.selectAll('tr td:first-child', function(node) {
    node.createReadStream()
      .pipe(concatString(function(data) {
        objStream.queue(parseInfo(stripHtml(data)));
      }));
  });

  // message
  tr.selectAll('tr td:first-child + td', function(node) {
    node.createReadStream()
      .pipe(concatString(function(data) {
        objStream.queue(stripTags(ent.decode(data)));
      }));
  });

  tr.on('end', function(){
    objStream.end();
  });

  objStream.pipe(through(function(data){
    callback(null, data);
  }));
  objStream.resume();
};

module.exports = Logger;
