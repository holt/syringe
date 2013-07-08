// > http://syringejs.org
// > syringe.js v0.4.3. Copyright (c) 2013 Michael Holt
// > holt.org. Distributed under the MIT License

/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, 
undef:true, unused:true, curly:true, browser:true, indent:4, maxerr:50, laxcomma:true,
forin:false, curly:false, evil: true */

(function () {

    "use strict";

    var root = this,
        _registry   = {},
        _cabinet    = {};

    // Utilities from core prototypes.
    var hasProp = {}.hasOwnProperty,
        slice   = [].slice;

    var makeId = function () {
        var count = 0;
        return function () {
            return 's' + (++count);
        };
    }.call(root);

    // Test to see if a passed URL is local.
    var isLocalURL = function (url) {
        var regexp = new RegExp("//" + location.host + "($|/)");
        return "http" === url.substring(0, 4) ? regexp.test(url) : true;
    };

    // Get the number of "own" properties in an object.
    var getPropSize = function (obj) {

        var size = 0,
            key;

        for (key in obj) {
            if (hasProp.call(obj, key)) size++;
        }

        return size;
    };

    // Get the object type as a string. If `lc` is `true` the comparison
    // is with the lowercased name.
    var getType = function (obj, lc) {
        var ret;
        if (obj) {
            ret = ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1];
        } else {
            ret = (obj === null) ? 'Null' : 'Undefined';
        }
        return (lc === true ? ret.toLowerCase() : ret);
    };

    // Get an object from an (optional) context `ctx` using delimited
    // string notation. The `sep` parameter determines the delimiter 
    // (a period `.` by default).
    var getObj = function (str, ctx, sep) {
        ctx = ctx || this;
        str = str.split(sep || '.');
        return str.filter(function (num) {
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
        str = str.split(sep || '.');
        var obj, _i, _len;
        for (_i = 0, _len = str.length; _i < _len; _i++) {
            obj = str[_i];
            ctx = (ctx[obj] = ctx[obj] || {});
        }
        return ctx;
    };

    // Return a map of any items in the passed array that match items
    // in the registry object.
    var getReg = function (arr, id) {

        var registry = _registry[id];

        return arr.map(function (item) {
            return getObj(item, registry);
        }, this);
    };

    // The `run` function resolves the dependencies of a bound method.
    // When it executes is retrieves the original `fn` method from the 
    // `cabinet` object, and applies both the injected and free arguments
    // to it. 
    var run = function (arr, fn, id) {

        var cabinet = _cabinet[id],
            args    = slice.call(arguments);
        
        // Remove the id from the arguments
        args.splice(2, 1);

        var match = cabinet.filter(function (item) {
            return item.fn === fn;
        })[0];

        fn = match ? match.fn : fn;

        // Copy the prototype
        for (var key in fn.prototype) {
            this.constructor.prototype[key] = fn.prototype[key];
        }

        return fn.apply(this, getReg(arr, id).concat(args.slice(2, args.length)));
    };

    var Syringe = function (props) {
        
        this.id             = makeId();
        _registry[this.id]  = {};
        _cabinet[this.id]   = [];

        _registry[this.id] = (props && getType(props, true) === 'object') 
            ? props 
            : _registry[this.id];
    };

    var proto = Syringe.prototype = {

        // Add a new item to the Syringe registry. The name can be provided 
        // in dot-notation, in which case a deep reference is built within
        // the registry. If `value` is a function, the optional `bindings` 
        // parameter can contain an array of all the registry properties 
        // with which to bind this function. In this way, registry methods
        // can be automatically bound to other registry methods.
        add: function (name, value, bindings) {

            var registry = _registry[this.id];

            if (getType(name, true) === 'object') {
                for (var key in name) {
                    if (!hasProp.call(name, key)) continue;
                    this.add.apply(this, [key, name[key]]);
                }
                return this;
            }

            if (getObj(name, registry)) {
                throw new Error('Key "' + name + '" already exists in the map; use .remove() to unregister it first!');
            } else {
                if (getType(value, true) === 'function' && bindings) {
                    value = this.on(bindings, value);
                }
                var strArr = name.split('.'),
                    objStr = (strArr.length > 1) ? strArr.pop() : false;
                if (objStr) {
                    setObj(strArr.join('.'), registry)[objStr] = value;
                } else {
                    registry[strArr.toString()] = value;
                }
            }

            return this;
        },

        // Remove a named item from the registry.
        remove: function (name) {

            var registry    = _registry[this.id],
                newregistry = {},
                obj         = {},
                splitname   = name.trim().split('.'),
                splitlast   = splitname.pop();

            splitname   = splitname.join('.');
            obj         = splitname ? getObj(splitname, registry) : registry;
            name        = splitlast || splitname;

            for (var key in obj) {
                if (!hasProp.call(obj, key) || (hasProp.call(obj, name) && key === name)) continue;
                newregistry[key] = obj[key];
            }

            // Deep removal (delimited name)
            if (splitname) this.set(splitname, newregistry);

            // Shallow removal (non-delimited name)
            else _registry[this.id] = newregistry;

            return this;
        },

        // Bind a method to the dependency registry. This function accepts
        // a variety of different arguments, the formulation of which 
        // determine what type of binding takes place. The variations are
        // described below.
        on: function ( /* 2, 3, or 4 params */ ) {

            ctx = root;

            var cabinet = _cabinet[this.id],
                args    = slice.call(arguments),
                isNamed = (getType(args[0]) === 'String') ? true : false,
                name, arr, fn, ctx, obj;
            
            switch (args.length) {

                // __Two__ parameters: the registry array `args[0]` and method
                // `args[1]`. No name or context object is provided. The 
                // bound function will be returned as an anonymous function.
            case 2:
                obj = {
                    fn  : args[1],
                    ctx : ctx,
                    bind: run.bind(ctx, args[0], args[1], this.id)
                };
                cabinet.push(obj);
                return obj.bind;
            case 3:

                if (isNamed) {

                    // __Three__ parameters: a name `args[0]`, the registry array 
                    // `args[1]`, and method `args[2]`. No context object
                    // is provided. The bound function will be assigned to 
                    // whatever the root object is.
                    name    = args[0];
                    arr     = args[1];
                    fn      = args[2];

                    obj = {
                        fn : args[2],
                        ctx: ctx
                    };
                } else {
                    // __Three__ parameters: the registry array `args[0]`, the
                    // method `args[1]`, and a context object `args[2]`.
                    // When the bound method executes the provided context
                    // will be used.
                    obj = {
                        fn  : args[1],
                        ctx : args[2],
                        bind: run.bind(args[2], args[0], args[1], this.id)
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
                name    = args[0];
                arr     = args[1];
                fn      = args[2];
                ctx     = args[3];

                obj = {
                    fn : args[2],
                    ctx: args[3]
                };
                break;
            }

            var strArr = name.split('.'),
                objStr = (strArr.length > 1) ? strArr.pop() : false;
            obj.bind = fn = run.bind(ctx, arr, fn, this.id);

            // Store a copy of this binding in the `cabinet` object.
            // This is useful if we want to copy an existing bound
            // function but use new registry items. 
            cabinet.push(obj);
            if (objStr) {
                setObj(strArr.join('.'), ctx)[objStr] = fn;
            } else {
                ctx[strArr.join('.')] = fn;
            }
            return this;
        },

        // Sometimes you need to call an executable registry item directly.
        // You can use this method to do just that. You can also (optionally) 
        // pass an array of arguments and a context.
        exec: function (name, args, ctx) {

            ctx = ctx || this;
            
            args = (getType(args, true) === 'array') 
                ? args 
                : [args];

            var fn = this.get(name);
            
            if ((getType(name, true) === 'string') &&
                (getType(fn, true) === 'function')) {
                return fn.apply(ctx, args);
            }
            return false;
        },

        // Retrieve a named item from the registry. You can use dot-notation
        // in the passed string. The method will return `false` if the item
        // does not exist.
        get: function (name) {

            var registry = _registry[this.id];

            if (getType(name, true) === 'string') {
                var obj = getObj(name, registry);
                if (getType(obj, true) !== 'undefined') {
                    return obj;
                }
                return false;
            }
            return registry;
        },

        // Set a named item from the registry. As with `get`, you can 
        // use dot-notation in the passed string. The method will throw
        // an exception if you try to set something that doesn't
        // exist.
        set: function (name, value) {

            var registry    = _registry[this.id],
                strArr      = name.split('.'),
                objStr      = (strArr.length > 1) ? strArr.pop() : false;

            if (getObj(name, registry) === undefined) {
                throw new Error('Key "' + name + '" does not exist in the map!');
            }

            if (objStr) setObj(strArr.join('.'), registry)[objStr] = value;
            else registry[strArr.toString()] = value;

            return this;
        },

        // Wrap a previously bound method in another `wrapper` function.
        // The original function is passed as the first argument to the
        // wrapper.
        wrap: function (fn, wrapper, ctx) {

            var cabinet = _cabinet[this.id];

            ctx = ctx || this;
            
            var match = cabinet.filter(function (item) {
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

            var cabinet = _cabinet[this.id],
                args    = slice.call(arguments);

            var match = cabinet.filter(function (item) {
                return item.bind === fn;
            })[0];

            if (match) {
                var obj = {
                    fn: fn,
                    ctx: args[0],
                    bind: run.bind(match.ctx, bindings, match.fn, this.id)
                };
                cabinet.push(obj);
                return obj.bind;
            }
            return false;
        },

        // Create a new Syringe object
        create: function (props) {
            return new Syringe(props);
        }
    };

    // Some method aliases...
    proto.bind          = proto.on;
    proto.register      = proto.add;
    proto.unregister    = proto.remove;

    // Current version...
    proto.VERSION = '0.4.3';

    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = new Syringe();
    }
    else {

        // Script loader for cross-domain resources.
        var addScript = function (url, callback) {
            var doc = window ? window.document : false;

            if (doc) {
                var head = doc.getElementsByTagName("head")[0] || doc.documentElement,
                    node = doc.createElement("script"),
                    done = false;
                node.src = url;
                node.onload = node.onreadystatechange = function () {
                    var rs = this.readyState;
                    if (!done && (!rs || rs === "loaded" || rs === "complete")) {
                        done = true;
                        node.onload = node.onreadystatechange = null;
                        if (head && node.parentNode) head.removeChild(node);
                        if (getType(callback, true) === 'function') callback();
                    }
                };
                head.insertBefore(node, head.firstChild);
            } else {
                return false;
            }
        };

        // Script loader for local resources.
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
                    return;
                }
                if (xhr.readyState === 4) {
                    callback(xhr);
                }
            };

            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
            xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
            xhr.send('');
        };

        // Asynch fetch is only needed on the browser
        proto.fetch = function (map, options) {

            options         = options || {};
            options.script  = options.script || false;

            var self = this,
                count = 0,
                url;

            // Keep a count of the script load events and reconcile it
            // against the length of the script list.
            var stack = function (xhr) {

                if (++count === getPropSize(map)) {
                    for (var key in map) {
                        if (!hasProp.call(map, key)) continue;

                        if (xhr && xhr.response) {

                            // A rare and (hopefully) legitimate use of eval() 
                            var data = eval(xhr.response);
                            if (data) self.add(key, data);
                        } else if (map[key].bind) {
                            self.add(key, getObj(map[key].bind, root));
                        }

                    }
                    if (getType(options.success) === 'Function') {
                        options.success.call(self);
                    }
                }
            };

            // Loop that adds a new script element for each list item.
            for (var key in map) {
                if (!hasProp.call(map, key)) continue;

                if (isLocalURL(url = map[key].path)) {
                    if (options.script) {
                        addScript(url, stack);
                    } else {
                        getData(url, stack);
                    }
                } else {
                    addScript(url, stack);
                }
            }

            return this;
        };

        root.Syringe = new Syringe();
    }

}.call(this));