var through = require('through');
var processLogs = require('./lib/processLogs');

var logger = function logger(auth, opts, callback) {
  if (typeof opts === 'function')
    callback = opts;

  opts.auth = auth;

  var rs = through();
  var onError = function onError(err) {
    rs.emit('error', err);
  };
  var onSuccess = function onSuccess() {
    var logs = processLogs(opts);
    logs.on('error', onError);
    logs.on('data', function(data) {
      rs.queue(data);
    });
    logs.on('end', function() {
      rs.end();
    });
  };

  if (auth._ready) {
    onSuccess();
  } else {
    auth.once('success', onSuccess);
    auth.on('error', onError);
  }

  if (callback) {
    rs.on('error', callback);
    rs.on('data', function(data) { callback(null, data); });
  }

  return rs;
};

module.exports = logger;
