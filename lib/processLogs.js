var url = require('url');
var rand = require('crypto-rand').rand;
var hyperquest = require('hyperquest');
var trumpet = require('trumpet');
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
    return line.trim();
  }).join(' ');
};

var concatToString = function concatToString(callback) {
  return concat({ encoding: 'string' }, callback);
};

var processLogs = function processLogs(opts, callback) {
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
  req.pipe(concatToString(function(data) {
    // minify here makes the process really slow when handling large ~10,000 row documents
    htmlStream.queue(minify(data)).end();
    // the alternative
    // htmlStream.queue(data).end();
    // is faster to start but prone to errors
  }));

  htmlStream.pipe(tr);
  htmlStream.resume();

  tr.selectAll('table tr', function(row) {
    var log = [];
    var td = trumpet();
    row.createReadStream()
      .pipe(td);

    td.selectAll('td', function(item) {
      item.createReadStream()
        .pipe(concatToString(function(data) {
          log.push(stripTags(data));
        }));
    });
    td.on('end', function() {
      if (log.length !== 2) return callback(new Error('Unable to process row!' + log));
      objStream.write({
        info: parseInfo(log[0]),
        message: log[1]
      });
    });
  });

  tr.on('end', function(){
    objStream.end();
  });

  objStream.pipe(through(function(data){
    callback(null, data);
  }));
  objStream.resume();
};

module.exports = processLogs;
