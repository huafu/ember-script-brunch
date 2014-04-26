var emberScript = require('ember-script');

var normalizeChecker = function (item) {
  switch (toString.call(item)) {
    case '[object RegExp]':
      return function (string) {
        return item.test(string);
      };
    case '[object Function]':
      return item;
    default:
      return function () {
        return false;
      };
  }
};

function EmberScriptCompiler(config) {
  if (config == null) config = {};
  var plugin = config.plugins && config.plugins.emberscript;
  var conv = config.conventions && config.conventions.vendor;
  this.bare = plugin && plugin.bare;
  this.sourceMaps = !!config.sourceMaps;
  this.isVendor = normalizeChecker(conv);
  this.optimise = !!config.optimize;
}

EmberScriptCompiler.prototype.brunchPlugin = true;
EmberScriptCompiler.prototype.type = 'javascript';
EmberScriptCompiler.prototype.extension = 'em';
EmberScriptCompiler.prototype.pattern = /\.em$/;

EmberScriptCompiler.prototype.compile = function (data, path, callback) {
  var compiled, jsAST, esAST, result,
      options = {
        bare: this.bare == null ? !this.isVendor(path) : this.bare,
        sourceMap: this.sourceMaps,
        sourceFiles: [path],
        optimise: this.optimise
      };
  try {
    esAST = emberScript.parse(data, options);
    jsAST = emberScript.compile(esAST, {bare: options.bare});
    compiled = options.sourceMap ? emberScript.jsWithSourceMap(jsAST, path, options) : emberScript.js(jsAST, options);
  } catch (err) {
    var loc = err.location, error;
    if (loc) {
      error = loc.first_line + ":" + loc.first_column + " " + (err.toString());
    } else {
      error = err.toString();
    }
    return callback(error);
  }

  result = options.sourceMap ? {
    data: compiled.code,
    map: compiled.map
  } : {
    data: compiled
  };
  return callback(null, result);
};

module.exports = EmberScriptCompiler;
