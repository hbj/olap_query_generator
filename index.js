var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var generator = require('./query-generator');

app.use(bodyParser.json());

app.post('/', function(req, res) {
  res.json(generator.generate(req.body));
});

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('OLAP query generator listening at http://%s:%s', host, port);
});
