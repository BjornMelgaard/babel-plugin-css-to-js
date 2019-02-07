'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var postcss = require('postcss');
var safe = require('postcss-safe-parser');
var camelCase = require('camelcase');

module.exports = function (_ref) {
  var t = _ref.types;

  return {
    visitor: {
      TaggedTemplateExpression: function TaggedTemplateExpression(path, state) {
        if (path.node.tag.name !== 'css') {
          return false;
        }

        var nodeQuasis = path.node.quasi.quasis;
        var nodeExprs = path.node.quasi.expressions;

        var css = nodeQuasis.reduce(function (acc, quasi, i) {
          var expr = nodeExprs[i] ? expressionPlaceholder(i) : '';
          return acc + quasi.value.raw + expr;
        }, '');

        var pluginsOpts = state.opts.plugins || [];

        var plugins = pluginsOpts.map(handlePlugin);

        var processed = postcss(plugins).process(css, { parser: safe, from: this.file.opts.filename }).root;

        var objectExpression = buildObjectAst(t, processed.nodes, nodeExprs);
        path.replaceWith(objectExpression);
      }
    }
  };
};

function buildObjectAst(t, nodes, nodeExprs) {
  var properties = nodes.map(function (node) {
    return node.type == 'decl' ? t.objectProperty(t.identifier(camelCase(node.prop)), buildValueAst(t, node.value, nodeExprs, node.important)) : node.type == 'rule' ? t.objectProperty(t.stringLiteral(node.selector), buildObjectAst(t, node.nodes, nodeExprs)) : node.type == 'atrule' ? t.objectProperty(t.stringLiteral('@' + node.name + ' ' + node.params), buildObjectAst(t, node.nodes, nodeExprs)) : undefined;
  });

  return t.objectExpression(properties);
}

function isNumeric(x) {
  return !isNaN(x);
}

function buildValueAst(t, value, nodeExprs, isImportant) {
  var valueWithAppendedImportant = isImportant ? value + ' !important' : value;

  var _splitExpressions = splitExpressions(valueWithAppendedImportant),
      quasis = _splitExpressions.quasis,
      exprs = _splitExpressions.exprs;

  if (quasis.length == 2 && quasis[0].length == 0 && quasis[1].length == 0) {
    return nodeExprs[exprs[0]];
  }

  if (quasis.length == 1) {
    if (isNumeric(quasis[0])) {
      return t.numericLiteral(+quasis[0]);
    }
    return t.stringLiteral(quasis[0]);
  }

  var quasisAst = buildQuasisAst(t, quasis);
  var exprsAst = exprs.map(function (exprIndex) {
    return nodeExprs[exprIndex];
  });
  return t.templateLiteral(quasisAst, exprsAst);
}

function handlePlugin(pluginArg) {
  if (Array.isArray(pluginArg)) {
    return require(pluginArg[0]).apply(null, pluginArg.slice(1));
  } else if (typeof pluginArg === 'string') {
    return require(pluginArg);
  } else {
    return pluginArg;
  }
}

function expressionPlaceholder(i) {
  return '___QUASI_EXPR_' + i + '___';
}

function buildQuasisAst(t, quasis) {
  return quasis.map(function (quasi, i) {
    var isTail = i === quasis.length - 1;
    return t.templateElement({ raw: quasi, cooked: quasi }, isTail);
  });
}

var regex = /___QUASI_EXPR_(\d+)___/g;

function splitExpressions(css) {
  var found = void 0,
      matches = [];
  while (found = regex.exec(css)) {
    matches.push(found);
  }

  var reduction = matches.reduce(function (acc, match) {
    acc.quasis.push(css.substring(acc.prevEnd, match.index));

    var _match = _slicedToArray(match, 2),
        placeholder = _match[0],
        exprIndex = _match[1];

    acc.exprs.push(exprIndex);
    acc.prevEnd = match.index + placeholder.length;
    return acc;
  }, { prevEnd: 0, quasis: [], exprs: [] });

  reduction.quasis.push(css.substring(reduction.prevEnd, css.length));

  return {
    quasis: reduction.quasis,
    exprs: reduction.exprs
  };
}