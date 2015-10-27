'use strict';

var _ = require('lodash');

module.exports = QueryGenerator;

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

var AGG = Object.keys(AGG_PRIM);
var OP = Object.keys(OP_KIND);

function QueryGenerator(config) {
  this.config = _.defaults(config || {}, {
    levels: {}
  });
}

QueryGenerator.prototype.generate = function(definitions) {
  var self = this;

  if (definitions) {
    if (!Array.isArray(definitions))
      definitions = [definitions];

    var requests = [];

    definitions.forEach(function(definition) {
      var request = self.getRequest(definition);

      if (request)
        requests.push(request);
    });
  }

  return {
    query_request: requests
  };
};

QueryGenerator.prototype.getRequest = function(definition) {
  var self = this;
  var key = [];
  var measure = [];

  if (definition) {
    var levels = _.defaults(definition.levels || {}, self.config.levels);

    if (definition.key) {
      var keyDefinition = Array.isArray(definition.key) ? definition.key : [definition.key];

      keyDefinition.forEach(function(definition) {
        var k = self.getKey(definition, levels);

        if (k)
          key.push(k);
      });
    }

    if (definition.measure) {
      var measureDefinition = Array.isArray(definition.measure) ? definition.measure : [definition.measure];

      measureDefinition.forEach(function(definition) {
        var m = self.getMeasure(definition, levels);

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
};

QueryGenerator.prototype.getKey = function(definition, levels) {
  var self = this;
  var dimension = null;

  if (definition.dimension && self.config.levels[definition.dimension])
    dimension = definition.dimension;

  if (dimension && definition.attribute) {
    return {
      qualified_level: {
        dimension: dimension,
        level: definition.level || levels[dimension]
      },
      attribute: definition.attribute
    }
  }
};

QueryGenerator.prototype.getMeasure = function(definition, levels) {
  var self = this;

  if (typeof definition === 'string')
    return self.getMetric(definition);

  var aggregation = null;

  AGG.some(function(key) {
    if (definition[key]) {
      aggregation = key;

      return true;
    }
  });

  if (aggregation) {
    return self.getAggregation(
      AGG_PRIM[aggregation],
      self.getMeasure(definition[aggregation], levels),
      self.getGrouping(definition.group, levels)
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
    return self.getOperation(
      OP_KIND[operation],
      definition[operation],
      levels
    );
  }
};

QueryGenerator.prototype.getMetric = function(name) {
  return {
    kind: 'METRIC',
    metric: {
      name: name
    }
  }
};

QueryGenerator.prototype.getAggregation = function(primitive, expr, grouping) {
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
};

QueryGenerator.prototype.getGrouping = function(definition, levels) {
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
};

QueryGenerator.prototype.getOperation = function(kind, expr, levels) {
  var self = this;

  if (expr && !Array.isArray(expr))
    expr = [expr];

  if (!expr || !expr.length)
    throw new Error('Operation missing expr');

  expr = expr.map(function(measure) {
    return self.getMeasure(measure, levels);
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
};
