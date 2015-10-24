'use strict';

var _ = require('lodash');

exports.generate = generate;

// configuration of dimensions and their default levels
// might come from a config file or db
var DIM_LEVEL = {
  product: 'unit',
  location: 'store',
  calendar: 'week'
};

var AGG_PRIM = {
  total: 'TOTAL',
  min: 'MIN',
  max: 'MAX',
  count: 'COUNT'
};

var OP_KIND = {
  add: 'ADD',
  subtract: 'SUBTRACT',
  multiply: 'MULTIPLY',
  divide: 'DIVIDE'
};

var DIM = Object.keys(DIM_LEVEL);
var AGG = Object.keys(AGG_PRIM);
var OP = Object.keys(OP_KIND);

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
    query_request: requests
  };
}

function getRequest(definition) {
  var key = [];
  var measure = [];

  if (definition) {
    var levels = _.defaults(definition.levels || {}, DIM_LEVEL);

    if (definition.key) {
      var keyDefinition = Array.isArray(definition.key) ? definition.key : [definition.key];

      keyDefinition.forEach(function(definition) {
        var k = getKey(definition, levels);

        if (k)
          key.push(k);
      });
    }

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

  if (key.length)
    request.key = key;

  if (measure.length)
    request.measure = measure;

  return request;
}

function getKey(definition, levels) {
  var dimension = null;

  DIM.some(function(key) {
    if (definition[key]) {
      dimension = key;

      return true;
    }
  });

  if (dimension) {
    return {
      qualified_level: {
        dimension: dimension,
        level: levels[dimension]
      },
      attribute: definition[dimension]
    }
  }
}

function getMeasure(definition, levels) {
  if (typeof definition === 'string')
    return getMetric(definition);

  var aggregation = null;

  AGG.some(function(key) {
    if (definition[key]) {
      aggregation = key;

      return true;
    }
  });

  if (aggregation) {
    return getAggregation(
      AGG_PRIM[aggregation],
      getMeasure(definition[aggregation], levels),
      getGrouping(definition.group, levels)
    );
  }

  var operation = null;

  OP.some(function(key) {
    if (definition[key]) {
      operation = key;

      return true;
    }
  });

  if (operation) {
    return getOperation(
      OP_KIND[operation],
      definition[operation],
      levels
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

  definition.forEach(function(defintion) {
    var dimension, level;

    if (typeof defintion === 'string') {
      dimension = defintion;
      level = levels[dimension];
    }
    else {
      var keys = Object.keys(defintion);

      if (keys.length) {
        dimension = keys[0];
        level = defintion[dimension];
      }
    }

    if (dimension && level) {
      grouping.push({
        kind: 'MAP',
        dimension: dimension,
        level: level
      });
    }
  });

  if (grouping.length)
    return grouping;
}

function getOperation(kind, expr, levels) {
  if (expr && !Array.isArray(expr))
    expr = [expr];

  if (!expr || !expr.length)
    throw new Error('Operation missing expr');

  expr = expr.map(function(measure) {
    return getMeasure(measure, levels);
  });

  var operation = {
    op: {
      kind: kind
    },
    expr: expr
  };

  return {
    kind: 'OP',
    op: operation
  };
}
