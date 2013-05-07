// > http://syringejs.org
// > syringe.js v0.3.2. Copyright (c) 2013 Michael Holt
// > holt.org. Distributed under the MIT License

/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, 
undef:true, unused:true, curly:true, browser:true, indent:4, maxerr:50, laxcomma:true,
forin:false, curly:false */

(function () {

    "use strict";

    var root = this,
        syringe = function (props) {

            // Utilities from core prototypes.
            var hasProp     = {}.hasOwnProperty,
                slice       = [].slice;

            // Global containers.
            var syringe     = {}, 
                registry    = {},
                cabinet     = [];

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
            // is with the lowercase form.
            var getType = function (obj, lc) {
                var a;
                try {
                    var b = /function (.{1,})\(/.exec(obj.constructor.toString());
                    a = b && 1 < b.length ? b[1] : '';
                } catch (e) {
                    a = (null === obj) ? 'aNull' : 'Undefined';
                } finally {
                    return lc ? a.toLowerCase() : a;
                }
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
            var getRegistry = function (arr) {
                return arr.map(function (item) {
                    return getObj(item, registry);
                }, this);
            };

            // Asynch script loader. Note that this is used in a browser context
            // only.
            var addScript = function (src, callback) {
                var doc = window ? window.document : false;

                if (doc) {
                    var head = doc.getElementsByTagName("head")[0] || doc.documentElement,
                        node = doc.createElement("script"),
                        done = false;
                    node.src = src;
                    node.onload = node.onreadystatechange = function () {
                        if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                            done = true;
                            node.onload = node.onreadystatechange = null;
                            if (head && node.parentNode) head.removeChild(node);
                            if (getType(callback, true) === 'function') callback();
                        }
                    };
                    head.insertBefore(node, head.firstChild);
                }
                else {
                    return false;
                }
            };

            // The `run` function resolves the dependencies of a bound method.
            // When it executes is retrieves the original `fn` method from the 
            // `cabinet` object, and applies both the injected and free arguments
            // to it. 
            var run = function (arr, fn) {
                var args = slice.call(arguments),
                    match = cabinet.filter(function (item) {
                    return item.fn === fn;
                })[0];     
                fn = match ? match.fn : fn;
                return fn.apply(this, getRegistry(arr).concat(args.slice(2, args.length)));
            };

            // Initialize the `registry` object with any properties that were
            // passed in, or just start with the empty object.
            registry = (props && getType(props, true) === 'object') ? props : registry;

            // Public Methods
            // --------------

            // Add a new item to the Syringe registry. The name can be provided 
            // in dot-notation, in which case a deep reference is built within
            // the registry. If `value` is a function, the optional `bindings` 
            // parameter can contain an array of all the registry properties 
            // with which to bind this function. In this way, registry methods
            // can be automatically bound to other registry methods.
            syringe.register = syringe.add = function (name, value, bindings) {
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
            };

            // Remove a named item from the registry.
            syringe.unregister = syringe.remove = function (name) {

                var newregistry = {},
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
                else registry = newregistry;
                return this;
            };

            // Bind a method to the dependency registry. This function accepts
            // a variety of different arguments, the formulation of which 
            // determine what type of binding takes place. The variations are
            // described below.
            syringe.bind = syringe.on = function (/* 2, 3, or 4 params */) {
                ctx = root;
                var args, isNamed, name, arr, fn, ctx, obj;
                args = slice.call(arguments);
                isNamed = (getType(args[0]) === 'String') ? true : false;
                switch (args.length) {

                    // __Two__ parameters: the registry array `args[0]` and method
                    // `args[1]`. No name or context object is provided. The 
                    // bound function will be returned as an anonymous function.
                case 2:
                    obj = {
                        fn  : args[1],
                        ctx : ctx,
                        bind: run.bind(ctx, args[0], args[1])
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
                        obj     = {
                            fn : args[2],
                            ctx: ctx
                        };
                    }
                    else {
                        // __Three__ parameters: the registry array `args[0]`, the
                        // method `args[1]`, and a context object `args[2]`.
                        // When the bound method executes the provided context
                        // will be used.
                        obj = {
                            fn  : args[1],
                            ctx : args[2],
                            bind: run.bind(args[2], args[0], args[1])
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
                    obj     = {
                        fn  : args[2],
                        ctx : args[3]
                    };
                    break;
                }

                var strArr = name.split('.'),
                    objStr = (strArr.length > 1) ? strArr.pop() : false;
                obj.bind = fn = run.bind(ctx, arr, fn);
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
            };

            // Sometimes you need to call an executable registry item directly.
            // You can use this method to do just that. You can also (optionally) 
            // pass an array of arguments and a context.
            syringe.exec = function (name, args, ctx) {
                ctx = ctx || this;
                args = (getType(args, true) === 'array') ? args : [args];
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
            syringe.get = function (name) {
                if (getType(name, true) === 'string') {
                    var obj = getObj(name, registry);
                    if (getType(obj, true) !== 'undefined') {
                        return obj;
                    }


                    return false;
                }
                return registry;
            };

            // Set a named item from the registry. As with `get`, you can 
            // use dot-notation in the passed string. The method will throw
            // an exception if you try to set something that doesn't
            // exist.
            syringe.set = function (name, value) {
                var strArr = name.split('.'),
                    objStr = (strArr.length > 1) ? strArr.pop() : false;
                if ((getType(getObj(name, registry), true) === 'undefined')) {
                    throw new Error('Key "' + name + '" does not exist in the map!');
                }
                if (objStr) {
                    setObj(strArr.join('.'), registry)[objStr] = value;
                } else {
                    registry[strArr.toString()] = value;
                }
                return this;
            };

            syringe.fetch = function (map, callback) {
                var self = this,
                    count = 0;
                // Keep a count of the script load events and reconcile it
                // against the length of the script list.
                var stack = function () {
                    if (++count === getPropSize(map)) {
                        for (var key in map) {
                            if (!hasProp.call(map, key)) continue;
                            if (map[key].bind) self.add(key, getObj(map[key].bind, root));
                        }
                        callback.call(self);
                    }
                };
                // Loop that adds a new script element for each list item.
                for (var key in map) {
                    if (!hasProp.call(map, key)) continue;
                    addScript(map[key].path, stack);
                }
            };

            // Wrap a previously bound method in another `wrapper` function.
            // The original function is passed as the first argument to the
            // wrapper.
            syringe.wrap = function (fn, wrapper, ctx) {
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
            };

            // Copy an existing bound function `fn` where the copy
            // has different registry bindings, provided by the
            // `bindings` argument. You can also provide an optional
            // execute context.
            syringe.copy = function (bindings, fn, ctx) {
                ctx = ctx || this;
                var args = slice.call(arguments);
                var match = cabinet.filter(function (item) {
                    return item.bind === fn;
                })[0];
                if (match) {
                    var obj = {
                        fn: fn,
                        ctx: args[0],
                        bind: run.bind(match.ctx, bindings, match.fn)
                    };
                    cabinet.push(obj);
                    return obj.bind;
                }
                return false;
            };

            // Current version.
            syringe.VERSION = '0.3.2';
            return syringe;
        };

    root.Syringe = syringe();
    root.Syringe.create = syringe;

}.call(this));