var events = require('events');
var extend = require('xtend');
var processLogs = require('./lib/processLogs');
var inherits = require('inherits');
var Readable = require('readable-stream').Readable;

var fallback = function fallback(err, data) {
  if (err) this.emit('error', err);
  this.emit('data', data);
};

var Logger = function Logger(auth, opts, callback) {
  if (!(this instanceof Logger))
    return new Logger(auth, opts, callback);

  Readable.call(this);

  if (typeof opts === 'function')
    callback = opts;

  if (!callback)
    callback = fallback.bind(this);

  if (auth instanceof events.EventEmitter) {
    auth.once('success', function(creds) {
      processLogs(extend(opts, creds), callback);
    }).on('error', function(err) {
      callback(err);
    });
  } else {
    opts = auth;
    processLogs(opts, callback);
  }
};

inherits(Logger, Readable);

Logger.prototype._read = function(n) {
  this.on('data', function(data) {
    this.push(JSON.stringify(data));
  });
};

module.exports = Logger;
