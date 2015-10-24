'use strict';

exports.generate = generate;

function generate(definition) {
  var requests = [];

  requests.push(getRequest(definition));

  return {
    'query_request': requests
  };
}

function getRequest(definition) {
  var measure = [];

  if (definition) {
    if (definition.metric) {
      measure.push(getMetric(definition.metric));
    }
  }

  var request = {
    'return_row_numbers': true
  };

  if (measure.length)
    request.measure = measure;

  return request;
}

function getMetric(name) {
  return {
    kind: "METRIC",
    metric: {name: name}
  }
}
