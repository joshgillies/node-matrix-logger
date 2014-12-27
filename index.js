var through = require('through');
var processLogs = require('./lib/processLogs');

var Logger = function Logger(auth, opts, callback) {
  if (typeof opts === 'function')
    callback = opts;

  opts.auth = auth;

  var logs;
  var rs = through();
  var onError = function onError(err) {
    rs.emit('error', err);
  };
  var onSuccess = function onSuccess() {
    logs = processLogs(opts);
    logs.on('error', onError);
    logs.on('data', function(data) {
      rs.queue(data);
    });
    logs.on('end', function() {
      rs.end();
    });
  };

  if (!auth._ready) {
    auth.on('success', onSuccess);
    auth.on('error', onError);
  } else {
    onSuccess();
  }

  if (callback) {
    rs.on('error', callback);
    rs.on('data', function(data) { callback(null, data); });
  }

  return rs;
};

module.exports = Logger;
