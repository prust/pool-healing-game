var http = require('http');
var fs = require('fs');
var static = require('node-static');

var fileServer = new static.Server('.', {'cache': false})

var validFileName = /^[a-z0-9_ -]+$/i;
var port = 8080;
var server = http.createServer(function(req, res) {
  var url = req.url.slice(1).replace(/%20/g, ' ');
  if (req.method == 'POST') {
    if (!validFileName.test(url))
      return console.log('invalid filename: "' + url + '"')

    console.log('"' + url + '"')
    var body = '';
    req.on('data', function(data) {
      body += data;
      if (body.length > 1e6)
        req.connection.destroy();
    });
    req.on('end', function() {
      fs.writeFile('levels/' + url + '.json', body, 'utf8', function() {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('File successfully saved');
      })
    });
  }
  else {
    console.log('get request: ' + url);
    fileServer.serve(req, res);
  }
}).listen(port)
console.log('serving on port ' + port)
