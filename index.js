var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var QueryGenerator = require('./query-generator');
var config = require('./config.json');

app.use(bodyParser.json());

Object.keys(config).forEach(function(key) {
  var generator = new QueryGenerator(config[key]);

  app.post('/' + key, function(req, res) {
    res.json(generator.generate(req.body));
  });
});

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('OLAP query generator listening at http://%s:%s', host, port);
});
