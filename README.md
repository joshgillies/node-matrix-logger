# node-matrix-logger

Capture and process Squiz Matrix logs from Node.js

# Example

```js
var matrixAuth = require('node-matrix-auth');
var logger = require('node-matrix-logger');

var auth = matrixAuth({
  auth: 'user:pass',
  admin: 'http://mysource.matrix/_admin',
  wsdl: 'http://mysource.matrix/_web_services/soap?wsdl'
});

var opts = {
  level: 'error'
};

logger(auth, opts, function(err, data) {
  if (err)
    return console.error(err);
  console.log(data);
});
```

# License

MIT

