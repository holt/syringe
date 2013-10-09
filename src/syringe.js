// > http://syringejs.org
// > syringe.js v0.4.18. Copyright (c) 2013 Michael Holt
// > holt.org. Distributed under the MIT License
/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, 
undef:true, unused:true, curly:true, browser:true, indent:4, maxerr:50, laxcomma:true,
forin:false, curly:false, evil: true, laxbreak:true, multistr: true */

(function () {

	"use strict";

	// Globals
	var 
		root	= this, 
		store	= {},
		hasProp	= {}.hasOwnProperty,
		slice	= [].slice;

	// Get an object from an (optional) context `ctx` using delimited
	// string notation. The `sep` parameter determines the delimiter 
	// (a period `.` by default).
	var getObj = function (str, ctx, sep) {

		ctx = ctx || this;
		sep = sep || '.';

		return str.split(sep).filter(function (num) {
			return num.length;
		}).reduce(function (prev, curr, index, list) {
			if (prev) {
				return prev[list[index]];
			}
		}, ctx);
	};

	// Create an object within an (optional) context `ctx` using 
	// delimited string notation. The `sep` parameter determines
	// the delimiter (period by default).			
	var setObj = function (str, ctx, sep) {

		ctx = ctx || this;
		sep = sep || '.';

		return str.split(sep).reduce(function (prev, curr) {
			return (prev[curr]) ? (prev[curr]) : (prev[curr]) = {};
		}, ctx);
	};

	// RFC 4122 GUID generator
	var makeId = function () {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (b) {
			var a = 16 * Math.random() | 0;
			return ('x' === b ? a : a & 3 | 8).toString(16);
		});
	};

	// Get the object type as a string. If an `istype` value is passed the comparison
	// is against this value and returns `true` or `false`, otherwise the type itself
	// is returned.
	var getType = function (obj, istype) {
		var ret = 'Undefined';
		if (obj) {
			ret = ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1];
		} else {
			if (obj === null) {
				ret = 'Null';
			} else if (obj === false) {
				ret = 'Boolean';
			} else if (typeof obj === 'string') {
				ret = 'String';
			} else if (obj === 0) {
				ret = 'Number';
			} else if (isNaN(obj) && typeof obj === 'number') {
				ret = 'NaN';
			}
		}
		if (typeof istype === 'string') {
			return (istype.toLowerCase() === ret.toLowerCase());
		} else {
			return ret;
		}
	};

	// Return a map of any items in the passed array that match items
	// in the registry object
	var getReg = function (arr, id) {
		var reg = store[id].registry;
		return arr.map(function (item) {
			switch (item) {
			case '':
				return undefined;
			case '*':
				return reg;
			case 'this':
				return this;
			default:
				return getObj(item, reg, store[id].sep);
			}
		}, this);
	};

	// Standard ajax retrieval operation
	var getData = function (url, callback) {

		var xhr;

		if (typeof XMLHttpRequest !== 'undefined') {
			xhr = new XMLHttpRequest();
		} else {
			[
				'MSXML2.XmlHttp.5.0',
				'MSXML2.XmlHttp.4.0',
				'MSXML2.XmlHttp.3.0',
				'MSXML2.XmlHttp.2.0',
				'Microsoft.XmlHttp'
			].forEach(function (item) {
				try {
					xhr = new window.ActiveXObject(item);
					return;
				} catch (e) {}
			});
		}

		xhr.onreadystatechange = function () {
			if (xhr.readyState < 4) {
				return;
			}
			if (xhr.status !== 200) {
				callback(null);
			} else if (xhr.readyState === 4) {
				callback(xhr);
			}
		};

		xhr.open('GET', url, true);
		xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
		xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
		xhr.send('');
	};

	// Asynch fetch
	var fetch = function (arr, options, ctx) {

		options		= options		|| {};
		options.success = options.success	|| false;
		options.xss	= options.xss		|| false;

		var 
			self	= this,
			count	= 0,
			url	= '';

		// Test to see if a passed URL is local
		var isLocalURL = function (url) {
			var regexp = new RegExp("//" + location.host + "($|/)");
			return "http" === url.substring(0, 4) ? regexp.test(url) : true;
		};

		// Keep a count of the script load events and reconcile it
		// against the length of the script list
		var stack = function (xhr) {

			if (xhr && xhr.responseText) {
				var data = JSON.parse(xhr.responseText);
				if (data) self.add(arr[count].bind, data);
			}

			if (++count === arr.length) {
				if (getType(options.success, 'function')) {
					options.success.call(self, (ctx || self));
				}
			}

		};

		arr.forEach(function (item) {
			if (isLocalURL(url = item.path) || options.xss === true) {
				getData(item.path, stack);
			}
		});
	};

	// Test to see if an object is empty
	var isEmpty = function(obj) {
		for (var key in obj) {
			if (hasProp.call(obj, key)) return false;
		}
		return true;
	};

	// The `run` function resolves the dependencies of a bound method.
	// When it executes is retrieves the original `fn` method from the 
	// `cabinet` object, and applies both the injected and free arguments
	// to it. 
	var run = function (arr, fn, syr) {

		var args = slice.call(arguments);

		// Remove the id from the arguments
		args.splice(2, 1);

		var match = store[syr.id].cabinet.filter(function (item) {
			return item.fn === fn;
		})[0];

		fn = match ? match.fn : fn;

		// Assume a constructor function
		if (!isEmpty(fn.prototype)) {
			var Obj = fn.bind.apply(fn, [null]
				.concat(getReg.apply(syr, [arr, syr.id])
				.concat(args.slice(2, args.length))));
			return new Obj();
		}
		// Assume a regular function
		else {
			return fn.apply(this, getReg.apply(syr, [arr, syr.id])
				.concat(args.slice(2, args.length)));
		}
	};

	// Syringe base constructor
	var Syringe = function (props) {
		store[this.id = makeId()] = {
			cabinet		: [],
			registry	: (props && getType(props, 'object')) ? props : {},
			separator	: '.'
		};
	};

	// Syringe object prototype methods
	var proto = Syringe.prototype = {

		// Set the separator character used for creating, specifying, and
		// retrieving objects. Whitespace and alphanumeric characters are
		// not permitted. By default, the period '.' character is used.
		separator: function (val) {
			var test = val.replace(/[?a-zA-Z\d]|\s/g, '').length === 1;
			if (getType(val, 'string') && test) {
				store[this.id].separator = val;
				return this;
			}
			return false;
		},

		// Add a new item to the Syringe registry. The name can be provided 
		// in dot-notation, in which case a deep reference is built within
		// the registry. If `value` is a function, the optional `bindings` 
		// parameter can contain an array of all the registry properties 
		// with which to bind this function. In this way, registry methods
		// can be automatically bound to other registry methods.
		add: function (name, value, bindings) {
			var 
				reg = store[this.id].registry,
				sep = store[this.id].separator;

			if (getType(name, 'object')) {
				for (var key in name) {
					if (!hasProp.call(name, key)) continue;
					this.add.apply(this, [key, name[key]]);
				}
				return this;
			}

			if (getObj(name, reg, sep)) {
				throw new Error('Key "' + name + 
					'" already exists in the map; use \
					.remove() to unregister it first!');
			} else {
				if (getType(value, 'function') && bindings) {
					value = this.on(bindings, value);
				}
				var 
					arr = name.split(sep),
					str = (arr.length > 1) ? arr.pop() : false;

				if (str) {
					setObj(arr.join(sep), reg, sep)[str] = value;
				} else {
					reg[arr.toString()] = value;
				}
			}
			return this;
		},

		// Remove a named item from the registry
		remove: function (name) {
			var 
				reg = store[this.id].registry,
				sep = store[this.id].separator,
				snm = name.trim().split(sep),
				lst = snm.pop(),
				nrg = {},
				obj = {};				

			snm = snm.join(sep);
			obj = snm ? getObj(snm, reg, sep) : reg;
			
			name = lst || snm;

			for (var key in obj) {
				if (!hasProp.call(obj, key) || 
				(hasProp.call(obj, name) && key === name)) continue;
				nrg[key] = obj[key];
			}

			// Deep removal (delimited name)
			if (snm) this.set(snm, nrg);

			// Shallow removal (non-delimited name)
			else store[this.id].registry = nrg;

			return this;
		},

		// Bind a method to the dependency registry. This function accepts
		// a variety of different arguments, the formulation of which 
		// determine what type of binding takes place. The variations are
		// described below.
		on: function ( /* 2, 3, or 4 params */ ) {

			ctx = root;

			var 
				cabinet		= store[this.id].cabinet,
				separator	= store[this.id].separator,
				args		= slice.call(arguments),
				isNamed		= (getType(args[0], 'String')) ? true : false,
				name, arr, fn, ctx, obj;

			switch (args.length) {

			// __Two__ parameters: the registry array `args[0]` and method
			// `args[1]`. No name or context object is provided. The 
			// bound function will be returned as an anonymous function.
			case 2:
				obj = {
					fn	: args[1],
					ctx	: ctx,
					bind	: run.bind(ctx, args[0], args[1], this),
					args	: args
				};
				cabinet.push(obj);
				return obj.bind;
			case 3:

				if (isNamed) {

					// __Three__ parameters: a name `args[0]`, the registry array 
					// `args[1]`, and method `args[2]`. No context object
					// is provided. The bound function will be assigned to 
					// whatever the root object is.
					name	= args[0];
					arr	= args[1];
					fn	= args[2];

					obj = {
						fn	: fn,
						ctx	: ctx,
						args	: args
					};
				} else {
					// __Three__ parameters: the registry array `args[0]`, the
					// method `args[1]`, and a context object `args[2]`.
					// When the bound method executes the provided context
					// will be used.
					obj = {
						fn	: args[1],
						ctx	: args[2],
						args	: args,
						bind	: run.bind(args[2], args[0], args[1], this)
					};
					cabinet.push(obj);
					return obj.bind;
				}
				break;

			// __Four__ parameters: a name `args[0]`, the registry array 
			// `args[1]`, the method `args[2]`, and a context object
			// `args[3]`. When the bound method executes the provided
			// context will be used.
			case 4:
				name	= args[0];
				arr	= args[1];
				fn	= args[2];
				ctx	= args[3];

				obj = {
					fn	: fn,
					ctx	: ctx,
					args	: args
				};
				break;
			}

			var 
				strArr = name.split(separator),
				objStr = (strArr.length > 1) ? strArr.pop() : false;

			obj.bind = fn = run.bind(ctx, arr, fn, this);

			// Store a copy of this binding in the `cabinet` object.
			// This is useful if we want to copy an existing bound
			// function but use new registry items. 
			cabinet.push(obj);

			if (objStr) {
				setObj(strArr.join(separator), ctx, separator)[objStr] = fn;
			} else {
				ctx[strArr.join(separator)] = fn;
			}

			return this;
		},

		// Sometimes you need to call an executable registry item directly.
		// You can use this method to do just that. You can also (optionally) 
		// pass an array of arguments and a context.
		exec: function (name, args, ctx) {

			ctx = ctx || this;

			var fn = this.get(name);
			var _fn = store[this.id].cabinet.filter(function (item) {
				return item.bind === fn;
			})[0];

			args = (getType(args, 'array')) ? args : [args];

			if ((getType(name, 'string')) && (getType(fn, 'function'))) {
				if (_fn) {
					fn = _fn ? _fn.fn : fn;
					return run.apply(ctx, [_fn.args[0], fn, this].concat(args));
				}
				return fn.apply(ctx, args);
			}
			return false;
		},

		// Retrieve a named item from the registry. You can use dot-notation
		// in the passed string. The method will return `false` if the item
		// does not exist.
		get: function (name) {
			var reg = store[this.id].registry;
			if (getType(name, 'string')) {
				var obj = getObj(name, reg, store[this.id].separator);
				if (!getType(obj, 'undefined')) {
					return obj;
				}
				return false;
			}
			return reg;
		},

		// Set a named item from the registry. As with `get`, you can 
		// use dot-notation in the passed string. The method will throw
		// an exception if you try to set something that doesn't
		// exist.
		set: function (name, value, bindings) {

			var
				reg = store[this.id].registry,
				sep = store[this.id].separator,
				arr = name.split(sep),
				str = (arr.length > 1) ? arr.pop() : false,
				prn;

			// Test the existence of the key we're trying to set. The getObj function
			// simply returns the key value, which could be `undefined`. Thus, we need to
			// first establish if the value is undefined because the key doesn't exist,
			// or if it *does* exist but its value is `undefined`. In the former case we
			// throw an error.
			if (getObj(name, reg, sep) === undefined) {

				prn = getObj(arr.join(sep), reg, sep);

				if (str) {
					if ((prn && !hasProp.call(prn, str)) || !prn) {
						throw new Error('Key "' + name + 
						'" does not exist in the map!');
					}
				} else if (!hasProp.call(reg, arr.toString())) {
					throw new Error('Key "' + name + 
					'" does not exist in the map!');
				}
			}

			if (getType(value, 'function') && bindings) {
				value = this.on(bindings, value);
			}

			if (str) {
				setObj(arr.join(sep), reg, sep)[str] = value;
			} else {
				reg[arr.toString()] = value;
			}
			return this;
		},

		// Wrap a previously bound method in another `wrapper` function.
		// The original function is passed as the first argument to the
		// wrapper.
		wrap: function (fn, wrapper, ctx) {

			ctx = ctx || this;

			var match = store[this.id].cabinet.filter(function (item) {
				return item.bind === fn;
			})[0];

			if (match) {
				return function () {
					var args = slice.call(arguments);
					return wrapper.apply(ctx, [
						function () {
							args = arguments.length ? arguments : args;
							return match.bind.apply(ctx, args);
						}
					].concat(args));
				};
			}
			return false;
		},

		// Copy an existing bound function `fn` where the copy
		// has different registry bindings, provided by the
		// `bindings` argument. You can also provide an optional
		// execution context.
		copy: function (bindings, fn, ctx) {

			ctx = ctx || this;

			var cab = store[this.id].cabinet;
			var match = cab.filter(function (item) {
				return item.bind === fn;
			})[0];

			if (match) {
				var obj = {
					fn	: fn,
					ctx	: slice.call(arguments)[0],
					bind	: run.bind(match.ctx, bindings, match.fn, this)
				};
				cab.push(obj);
				return obj.bind;
			}
			return false;
		},

		// Create a new Syringe object
		create: function (props) {
			return new Syringe(props);
		}

	};

	// Allow mixins to be added to the prototype
	proto.mixin = function (obj) {
		if (getType(obj, 'object')) {
			for (var key in obj) {
				if (!hasProp.call(obj, key)) continue;				
				if (getType(obj[key], 'function')) proto[key] = obj[key];
			}
			return this;
		}
		return false;
	};

	// Create some method aliases
	proto.bind		= proto.on;
	proto.register		= proto.add;
	proto.unregister	= proto.remove;

	// Add the current semver version
	proto.VERSION = '0.4.18';

	if (typeof module !== 'undefined' && module.exports) {
		exports = module.exports = new Syringe();
	} else {

		// Asynch fetch is only present on the browser
		proto.fetch	= fetch;
		root.Syringe	= new Syringe();
	}

}.call(this));