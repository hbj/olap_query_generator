'use strict';

exports.generate = generate;

function generate(definitions) {
  if (definitions) {
    if (!Array.isArray(definitions))
      definitions = [definitions];

    var requests = [];

    definitions.forEach(function(definition) {
      var request = getRequest(definition);

      if (request)
        requests.push(request);
    });
  }

  return {
    'query_request': requests
  };
}

function getRequest(definition) {
  var measure = [];

  if (definition) {
    if (definition.metric) {
      var metrics = Array.isArray(definition.metric) ? definition.metric : [definition.metric];

      metrics.forEach(function(metric) {
        if (metric)
          measure.push(getMetric(metric));
      });
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
