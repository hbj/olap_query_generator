'use strict';

var _ = require('lodash');

exports.generate = generate;

// configuration might go in a file or db
var defaultLevels = {
  product: 'unit',
  location: 'store',
  calendar: 'week'
};

var aggregationPrimitives = {
  total: 'TOTAL',
  min: 'MIN',
  max: 'MAX',
  count: 'COUNT'
};

var aggregations = Object.keys(aggregationPrimitives);

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
    var levels = _.defaults(definition.levels || {}, defaultLevels);

    if (definition.measure) {
      var measureDefinition = Array.isArray(definition.measure) ? definition.measure : [definition.measure];

      measureDefinition.forEach(function(definition) {
        var m = getMeasure(definition, levels);

        if (m)
          measure.push(m);
      });
    }
  }

  var request = {
    return_row_numbers: true
  };

  if (measure.length)
    request.measure = measure;

  return request;
}

function getMeasure(definition, levels) {
  if (typeof definition === 'string')
    return getMetric(definition);

  var aggregation = null;

  aggregations.some(function(key) {
    if (definition[key]) {
      aggregation = key;

      return true;
    }
  });

  if (aggregation) {
    return getAggregation(
      aggregationPrimitives[aggregation],
      getMeasure(definition[aggregation], levels),
      getGrouping(definition.group, levels)
    );
  }
}

function getMetric(name) {
  return {
    kind: 'METRIC',
    metric: {
      name: name
    }
  }
}

function getAggregation(primitive, expr, grouping) {
  if (!expr)
    throw new Error('Aggregation missing expr');

  var aggregation = {
    method: {
      primitive: primitive
    },
    expr: expr
  };

  if (grouping)
    aggregation.grouping = grouping;

  return {
    kind: 'AGGREGATION',
    aggregation: aggregation
  };
}

function getGrouping(definition, levels) {
  if (!definition)
    return null;

  if (!Array.isArray(definition))
    definition = [definition];

  var grouping = [];

  definition.forEach(function(dimension) {
    if (levels[dimension]) {
      grouping.push({
        kind: 'MAP',
        dimension: dimension,
        level: levels[dimension]
      });
    }
  });

  return grouping.length ? grouping : null;
}
