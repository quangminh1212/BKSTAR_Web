'use strict';



var defaultOptions = {

	// String: Selector to indicate each ticker item. Must be a direct child of the ticker element

	item: 'div',



	// Boolean: Toggles whether the ticker should pause if the mouse cursor is over it

	pauseOnHover: false,



	// Number: Speed of ticker in Pixels/Second.

	speed: 60,



	// String: (track|item) Sets whether ticker breaks when it hits a new item or if the track has reset

	pauseAt: '',



	// Number: Pause duration for pauseAt

	delay: 500

};



var rafSupported = true;



// Check for Transform Support | Credit: https://stackoverflow.com/questions/7212102/detect-with-javascript-or-jquery-if-css-transform-2d-is-available

function getSupportedTransform() {

	var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');

	var div = document.createElement('div');

	for (var i = 0; i < prefixes.length; i++) {

		if (div && div.style[prefixes[i]] !== undefined) {

			return prefixes[i];

		}

	}

	return false;

}



// Polyfill for requestAnimationFrame | Credit: https://stackoverflow.com/questions/5605588/how-to-use-requestanimationframe

var requestAnimFrame = function () {

	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function ( /* function */callback) {

		rafSupported = false;

		window.setTimeout(callback, 1000 / 60);

	};

}();



function createCommonjsModule(fn, module) {

	return module = { exports: {} }, fn(module, module.exports), module.exports;

}



/**

 * Helpers.

 */



var s = 1000;

var m = s * 60;

var h = m * 60;

var d = h * 24;

var y = d * 365.25;



/**

 * Parse or format the given `val`.

 *

 * Options:

 *

 *  - `long` verbose formatting [false]

 *

 * @param {String|Number} val

 * @param {Object} [options]

 * @throws {Error} throw an error if val is not a non-empty string or a number

 * @return {String|Number}

 * @api public

 */



var ms = function(val, options) {

  options = options || {};

  var type = typeof val;

  if (type === 'string' && val.length > 0) {

    return parse(val);

  } else if (type === 'number' && isNaN(val) === false) {

    return options.long ? fmtLong(val) : fmtShort(val);

  }

  throw new Error(

    'val is not a non-empty string or a valid number. val=' +

      JSON.stringify(val)

  );

};



/**

 * Parse the given `str` and return milliseconds.

 *

 * @param {String} str

 * @return {Number}

 * @api private

 */



function parse(str) {

  str = String(str);

  if (str.length > 100) {

    return;

  }

  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(

    str

  );

  if (!match) {

    return;

  }

  var n = parseFloat(match[1]);

  var type = (match[2] || 'ms').toLowerCase();

  switch (type) {

    case 'years':

    case 'year':

    case 'yrs':

    case 'yr':

    case 'y':

      return n * y;

    case 'days':

    case 'day':

    case 'd':

      return n * d;

    case 'hours':

    case 'hour':

    case 'hrs':

    case 'hr':

    case 'h':

      return n * h;

    case 'minutes':

    case 'minute':

    case 'mins':

    case 'min':

    case 'm':

      return n * m;

    case 'seconds':

    case 'second':

    case 'secs':

    case 'sec':

    case 's':

      return n * s;

    case 'milliseconds':

    case 'millisecond':

    case 'msecs':

    case 'msec':

    case 'ms':

      return n;

    default:

      return undefined;

  }

}



/**

 * Short format for `ms`.

 *

 * @param {Number} ms

 * @return {String}

 * @api private

 */



function fmtShort(ms) {

  if (ms >= d) {

    return Math.round(ms / d) + 'd';

  }

  if (ms >= h) {

    return Math.round(ms / h) + 'h';

  }

  if (ms >= m) {

    return Math.round(ms / m) + 'm';

  }

  if (ms >= s) {

    return Math.round(ms / s) + 's';

  }

  return ms + 'ms';

}



/**

 * Long format for `ms`.

 *

 * @param {Number} ms

 * @return {String}

 * @api private

 */



function fmtLong(ms) {

  return plural(ms, d, 'day') ||

    plural(ms, h, 'hour') ||

    plural(ms, m, 'minute') ||

    plural(ms, s, 'second') ||

    ms + ' ms';

}



/**

 * Pluralization helper.

 */



function plural(ms, n, name) {

  if (ms < n) {

    return;

  }

  if (ms < n * 1.5) {

    return Math.floor(ms / n) + ' ' + name;

  }

  return Math.ceil(ms / n) + ' ' + name + 's';

}







var ms$2 = Object.freeze({

	default: ms,

	__moduleExports: ms

});



var require$$0 = ( ms$2 && ms ) || ms$2;



var debug = createCommonjsModule(function (module, exports) {

/**

 * This is the common logic for both the Node.js and web browser

 * implementations of `debug()`.

 *

 * Expose `debug()` as the module.

 */



exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;

exports.coerce = coerce;

exports.disable = disable;

exports.enable = enable;

exports.enabled = enabled;

exports.humanize = require$$0;



/**

 * Active `debug` instances.

 */

exports.instances = [];



/**

 * The currently active debug mode names, and names to skip.

 */



exports.names = [];

exports.skips = [];



/**

 * Map of special "%n" handling functions, for the debug "format" argument.

 *

 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".

 */



exports.formatters = {};



/**

 * Select a color.

 * @param {String} namespace

 * @return {Number}

 * @api private

 */



function selectColor(namespace) {

  var hash = 0, i;



  for (i in namespace) {

    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);

    hash |= 0; // Convert to 32bit integer

  }



  return exports.colors[Math.abs(hash) % exports.colors.length];

}



/**

 * Create a debugger with the given `namespace`.

 *

 * @param {String} namespace

 * @return {Function}

 * @api public

 */



function createDebug(namespace) {



  var prevTime;



  function debug() {

    // disabled?

    if (!debug.enabled) return;



    var self = debug;



    // set `diff` timestamp

    var curr = +new Date();

    var ms = curr - (prevTime || curr);

    self.diff = ms;

    self.prev = prevTime;

    self.curr = curr;

    prevTime = curr;



    // turn the `arguments` into a proper Array

    var args = new Array(arguments.length);

    for (var i = 0; i < args.length; i++) {

      args[i] = arguments[i];

    }



    args[0] = exports.coerce(args[0]);



    if ('string' !== typeof args[0]) {

      // anything else let's inspect with %O

      args.unshift('%O');

    }



    // apply any `formatters` transformations

    var index = 0;

    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {

      // if we encounter an escaped % then don't increase the array index

      if (match === '%%') return match;

      index++;

      var formatter = exports.formatters[format];

      if ('function' === typeof formatter) {

        var val = args[index];

        match = formatter.call(self, val);



        // now we need to remove `args[index]` since it's inlined in the `format`

        args.splice(index, 1);

        index--;

      }

      return match;

    });



    // apply env-specific formatting (colors, etc.)

    exports.formatArgs.call(self, args);



    var logFn = debug.log || exports.log || console.log.bind(console);

    logFn.apply(self, args);

  }



  debug.namespace = namespace;

  debug.enabled = exports.enabled(namespace);

  debug.useColors = exports.useColors();

  debug.color = selectColor(namespace);

  debug.destroy = destroy;



  // env-specific initialization logic for debug instances

  if ('function' === typeof exports.init) {

    exports.init(debug);

  }



  exports.instances.push(debug);



  return debug;

}



function destroy () {

  var index = exports.instances.indexOf(this);

  if (index !== -1) {

    exports.instances.splice(index, 1);

    return true;

  } else {

    return false;

  }

}



/**

 * Enables a debug mode by namespaces. This can include modes

 * separated by a colon and wildcards.

 *

 * @param {String} namespaces

 * @api public

 */



function enable(namespaces) {

  exports.save(namespaces);



  exports.names = [];

  exports.skips = [];



  var i;

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);

  var len = split.length;



  for (i = 0; i < len; i++) {

    if (!split[i]) continue; // ignore empty strings

    namespaces = split[i].replace(/\*/g, '.*?');

    if (namespaces[0] === '-') {

      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));

    } else {

      exports.names.push(new RegExp('^' + namespaces + '$'));

    }

  }



  for (i = 0; i < exports.instances.length; i++) {

    var instance = exports.instances[i];

    instance.enabled = exports.enabled(instance.namespace);

  }

}



/**

 * Disable debug output.

 *

 * @api public

 */



function disable() {

  exports.enable('');

}



/**

 * Returns true if the given mode name is enabled, false otherwise.

 *

 * @param {String} name

 * @return {Boolean}

 * @api public

 */



function enabled(name) {

  if (name[name.length - 1] === '*') {

    return true;

  }

  var i, len;

  for (i = 0, len = exports.skips.length; i < len; i++) {

    if (exports.skips[i].test(name)) {

      return false;

    }

  }

  for (i = 0, len = exports.names.length; i < len; i++) {

    if (exports.names[i].test(name)) {

      return true;

    }

  }

  return false;

}



/**

 * Coerce `val`.

 *

 * @param {Mixed} val

 * @return {Mixed}

 * @api private

 */



function coerce(val) {

  if (val instanceof Error) return val.stack || val.message;

  return val;

}

});



var debug_1 = debug.coerce;

var debug_2 = debug.disable;

var debug_3 = debug.enable;

var debug_4 = debug.enabled;

var debug_5 = debug.humanize;

var debug_6 = debug.instances;

var debug_7 = debug.names;

var debug_8 = debug.skips;

var debug_9 = debug.formatters;





var debug$2 = Object.freeze({

	default: debug,

	__moduleExports: debug,

	coerce: debug_1,

	disable: debug_2,

	enable: debug_3,

	enabled: debug_4,

	humanize: debug_5,

	instances: debug_6,

	names: debug_7,

	skips: debug_8,

	formatters: debug_9

});



var require$$0$1 = ( debug$2 && debug ) || debug$2;



var browser = createCommonjsModule(function (module, exports) {

/**

 * This is the web browser implementation of `debug()`.

 *

 * Expose `debug()` as the module.

 */



exports = module.exports = require$$0$1;

exports.log = log;

exports.formatArgs = formatArgs;

exports.save = save;

exports.load = load;

exports.useColors = useColors;

exports.storage = 'undefined' != typeof chrome

               && 'undefined' != typeof chrome.storage

                  ? chrome.storage.local

                  : localstorage();



/**

 * Colors.

 */



exports.colors = [

  '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',

  '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',

  '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',

  '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',

  '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',

  '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',

  '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',

  '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',

  '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',

  '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',

  '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'

];



/**

 * Currently only WebKit-based Web Inspectors, Firefox >= v31,

 * and the Firebug extension (any Firefox version) are known

 * to support "%c" CSS customizations.

 *

 * TODO: add a `localStorage` variable to explicitly enable/disable colors

 */



function useColors() {

  // NB: In an Electron preload script, document will be defined but not fully

  // initialized. Since we know we're in Chrome, we'll just detect this case

  // explicitly

  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {

    return true;

  }



  // Internet Explorer and Edge do not support colors.

  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {

    return false;

  }



  // is webkit? http://stackoverflow.com/a/16459606/376773

  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632

  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||

    // is firebug? http://stackoverflow.com/a/398120/376773

    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||

    // is firefox >= v31?

    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages

    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||

    // double check webkit in userAgent just in case we are in a worker

    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));

}



/**

 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.

 */



exports.formatters.j = function(v) {

  try {

    return JSON.stringify(v);

  } catch (err) {

    return '[UnexpectedJSONParseError]: ' + err.message;

  }

};





/**

 * Colorize log arguments if enabled.

 *

 * @api public

 */



function formatArgs(args) {

  var useColors = this.useColors;



  args[0] = (useColors ? '%c' : '')

    + this.namespace

    + (useColors ? ' %c' : ' ')

    + args[0]

    + (useColors ? '%c ' : ' ')

    + '+' + exports.humanize(this.diff);



  if (!useColors) return;



  var c = 'color: ' + this.color;

  args.splice(1, 0, c, 'color: inherit');



  // the final "%c" is somewhat tricky, because there could be other

  // arguments passed either before or after the %c, so we need to

  // figure out the correct index to insert the CSS into

  var index = 0;

  var lastC = 0;

  args[0].replace(/%[a-zA-Z%]/g, function(match) {

    if ('%%' === match) return;

    index++;

    if ('%c' === match) {

      // we only are interested in the *last* %c

      // (the user may have provided their own)

      lastC = index;

    }

  });



  args.splice(lastC, 0, c);

}



/**

 * Invokes `console.log()` when available.

 * No-op when `console.log` is not a "function".

 *

 * @api public

 */



function log() {

  // this hackery is required for IE8/9, where

  // the `console.log` function doesn't have 'apply'

  return 'object' === typeof console

    && console.log

    && Function.prototype.apply.call(console.log, console, arguments);

}



/**

 * Save `namespaces`.

 *

 * @param {String} namespaces

 * @api private

 */



function save(namespaces) {

  try {

    if (null == namespaces) {

      exports.storage.removeItem('debug');

    } else {

      exports.storage.debug = namespaces;

    }

  } catch(e) {}

}



/**

 * Load `namespaces`.

 *

 * @return {String} returns the previously persisted debug modes

 * @api private

 */



function load() {

  var r;

  try {

    r = exports.storage.debug;

  } catch(e) {}



  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG

  if (!r && typeof process !== 'undefined' && 'env' in process) {

    r = process.env.DEBUG;

  }



  return r;

}



/**

 * Enable namespaces listed in `localStorage.debug` initially.

 */



exports.enable(load());



/**

 * Localstorage attempts to return the localstorage.

 *

 * This is necessary because safari throws

 * when a user disables cookies/localstorage

 * and you attempt to access it.

 *

 * @return {LocalStorage}

 * @api private

 */



function localstorage() {

  try {

    return window.localStorage;

  } catch (e) {}

}

});



var browser_1 = browser.log;

var browser_2 = browser.formatArgs;

var browser_3 = browser.save;

var browser_4 = browser.load;

var browser_5 = browser.useColors;

var browser_6 = browser.storage;

var browser_7 = browser.colors;





var browser$2 = Object.freeze({

	default: browser,

	__moduleExports: browser,

	log: browser_1,

	formatArgs: browser_2,

	save: browser_3,

	load: browser_4,

	useColors: browser_5,

	storage: browser_6,

	colors: browser_7

});



var require$$0$2 = ( browser$2 && browser ) || browser$2;



var logger = function logger(location) {

	{

		var debug = require$$0$2;



		debug.enable('ticker:*');



		return debug('ticker:' + location);

	}

};



/* This is where the magic happens */

var log$1 = logger('brain');



var FPSs = [60];



var tickers = [];



function getFps() {

	//return 60;

	if (!rafSupported) return 60;

	var l = FPSs.length;

	return FPSs.reduce(function (a, b) {

		return a + b;

	}) / l;

}



var brain = {

	get fps() {

		return getFps();

	},

	get tickers() {

		return tickers;

	},

	init: function init($) {

		var frameCount = 0;

		var fpsInterval = 0;



		requestAnimFrame(function tick() {

			frameCount++;

			if (tickers.length) tickers.forEach(function (t) {

				return t.advance();

			});



			requestAnimFrame(tick);

		});



		// Monitor fps

		if (rafSupported) {

			var fpsMon = void 0;

			$(window).on('load focus', function () {

				log$1('Frame Count: %d, FPS Interval: %d', frameCount, fpsInterval);

				if (!fpsMon && document.hasFocus()) {

					fpsInterval = frameCount;

					fpsMon = setInterval(function () {

						var fps = frameCount - fpsInterval;

						FPSs.push(fps);



						while (FPSs.length > 10) {

							FPSs.shift();

						}log$1(getFps());



						fpsInterval = frameCount;

					}, 1000);

				}

			}).on('blur', function () {

				clearInterval(fpsMon);

				fpsMon = null;

			});

		}

	}

};



var asyncGenerator = function () {

  function AwaitValue(value) {

    this.value = value;

  }



  function AsyncGenerator(gen) {

    var front, back;



    function send(key, arg) {

      return new Promise(function (resolve, reject) {

        var request = {

          key: key,

          arg: arg,

          resolve: resolve,

          reject: reject,

          next: null

        };



        if (back) {

          back = back.next = request;

        } else {

          front = back = request;

          resume(key, arg);

        }

      });

    }



    function resume(key, arg) {

      try {

        var result = gen[key](arg);

        var value = result.value;



        if (value instanceof AwaitValue) {

          Promise.resolve(value.value).then(function (arg) {

            resume("next", arg);

          }, function (arg) {

            resume("throw", arg);

          });

        } else {

          settle(result.done ? "return" : "normal", result.value);

        }

      } catch (err) {

        settle("throw", err);

      }

    }



    function settle(type, value) {

      switch (type) {

        case "return":

          front.resolve({

            value: value,

            done: true

          });

          break;



        case "throw":

          front.reject(value);

          break;



        default:

          front.resolve({

            value: value,

            done: false

          });

          break;

      }



      front = front.next;



      if (front) {

        resume(front.key, front.arg);

      } else {

        back = null;

      }

    }



    this._invoke = send;



    if (typeof gen.return !== "function") {

      this.return = undefined;

    }

  }



  if (typeof Symbol === "function" && Symbol.asyncIterator) {

    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {

      return this;

    };

  }



  AsyncGenerator.prototype.next = function (arg) {

    return this._invoke("next", arg);

  };



  AsyncGenerator.prototype.throw = function (arg) {

    return this._invoke("throw", arg);

  };



  AsyncGenerator.prototype.return = function (arg) {

    return this._invoke("return", arg);

  };



  return {

    wrap: function (fn) {

      return function () {

        return new AsyncGenerator(fn.apply(this, arguments));

      };

    },

    await: function (value) {

      return new AwaitValue(value);

    }

  };

}();











var classCallCheck = function (instance, Constructor) {

  if (!(instance instanceof Constructor)) {

    throw new TypeError("Cannot call a class as a function");

  }

};



var createClass = function () {

  function defineProperties(target, props) {

    for (var i = 0; i < props.length; i++) {

      var descriptor = props[i];

      descriptor.enumerable = descriptor.enumerable || false;

      descriptor.configurable = true;

      if ("value" in descriptor) descriptor.writable = true;

      Object.defineProperty(target, descriptor.key, descriptor);

    }

  }



  return function (Constructor, protoProps, staticProps) {

    if (protoProps) defineProperties(Constructor.prototype, protoProps);

    if (staticProps) defineProperties(Constructor, staticProps);

    return Constructor;

  };

}();



/* Ticker Class - Controls each instance of a ticker. */



var log$2 = logger('class');



/* TODO: Port over to private fields

 * - Requires Gulp setup

 **/



var Ticker = function () {

	function Ticker(elem, settings) {

		classCallCheck(this, Ticker);



		this.elem = elem;



		this.settings = settings;



		this.__offset = 0;

		this.__pauseTracker = 0;



		this.build();

	}



	createClass(Ticker, [{

		key: 'build',

		value: function build() {

			var _this = this;



			if (!this.started) {

				this.started = true;



				//region Build Track

				var track = document.createElement('div'); // <div class="js-ticker-track">;

				track.className = 'js-ticker-track';



				this.elem.addClass('js-ticker');

				this.elem.children(this.settings.item).addClass('js-ticker-item').appendTo(track);



				this.elem.append(track);

				//endregion



				//region Init Variables

				this.track = this.elem.find('.js-ticker-track');

				this.__items = this.track.children('.js-ticker-item');



				this.__first = this.__items.first();

				this.__first.attr('data-first', true);

				//endregion



				//region Clone For Scale

				var targetWidth = this.elem.width() + this.__first.width();



				log$2('(Pre Clones) Target Width: %d, Actual: %d', targetWidth, this.elem[0].scrollWidth);



				while (this.elem[0].scrollWidth < targetWidth) {

					this.__items.each(function (i) {

						_this.track.append(_this.__items.eq(i).clone());

					});

				}



				log$2('(Post Clones) Target Width: %d, Actual: %d', targetWidth, this.elem[0].scrollWidth);

				//endregion



				//region Init Events

				// Insurance to prevent doubling up on enter triggers

				/* FIXME: This looks... un... safe. */

				var initHover = function initHover() {

					_this.elem.one('mouseenter', function () {

						_this.__pauseTracker++;

						_this.elem.one('mouseleave', function () {

							_this.__pauseTracker--;

							initHover();

						});

					});

				};



				if (this.settings.pauseOnHover) initHover();



				/* TODO: Pause on focus and reset slider position for ADA

     * - Also need a solution on keyboard navigation

     **/

				//endregion



				//region Enable Ticker

				this.elem.addClass('active');

				this.elem.data('ticker', this);



				brain.tickers.push(this);

				//endregion

			}

		}

	}, {

		key: 'advance',

		value: function advance() {

			var _this2 = this;



			this.__width = this.__first.outerWidth();

			if (!this.__pauseTracker) {



				this.__offset += this.settings.speed / brain.fps;



				/* TODO: Need a solution to go in reverse */

				if (this.__offset > this.__width) {

					this.__offset = 0;

					this.__first.appendTo(this.track);

					this.__first = this.track.children('.js-ticker-item').first();

					if (this.settings.pauseAt === 'item' || this.settings.pauseAt === 'track' && this.__first.data('first')) {

						this.__pauseTracker++;

						setTimeout(function () {

							return _this2.__pauseTracker--;

						}, this.settings.delay);

					}

				}



				var transformProp = getSupportedTransform();



				if (transformProp) {

					this.track.css(transformProp, 'translateX(' + -this.__offset + 'px)');

				} else {

					this.track.css('left', -this.__offset + 'px');

				}

			}

		}

	}, {

		key: 'pause',

		value: function pause() {

			if (!this.__manuallyPaused) {

				this.__pauseTracker++;

				this.__manuallyPaused = true;

			}

		}

	}, {

		key: 'play',

		value: function play() {

			if (this.__manuallyPaused) {

				this.__pauseTracker--;

				this.__manuallyPaused = false;

			}

		}

	}, {

		key: 'toggle',

		value: function toggle() {

			if (this.__manuallyPaused) {

				this.play();

			} else {

				this.pause();

			}

		}

	}], [{

		key: 'version',

		get: function get$$1() {

			return '0.0.1';

		}

	}]);

	return Ticker;

}();



/**

 * Small jQuery Plugin create by Quangdao Nguyen

 */



var log = logger('entry');



(function ($) {

	'use strict';



	if (!$) return console.warn('Whoa there, buddy! Looks like you included the jQuery Ticker plugin without including jQuery first.');



	$.ticker = function (elem, settings) {

		return new Ticker($(elem), settings);

	};



	$.fn.ticker = function () {

		var overrides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};



		return this.each(function () {

			$.ticker(this, $.extend(true, {}, defaultOptions, overrides));

		});

	};



	brain.init($);

})(typeof jQuery !== 'undefined' ? jQuery : null);

