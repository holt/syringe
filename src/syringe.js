// syringe.js v0.2.1
/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, 
undef:true, unused:true, curly:true, browser:true, indent:4, maxerr:50, laxcomma:true,
forin:false, curly:false */
(function () {

    "use strict";

    var root = this,
        syringe = function (props) {

            // Pointers and containers
            var syringe = {}
            , deps      = {}
            , hasProp   = {}.hasOwnProperty
            , slice     = [].slice
            , toString  = Object.prototype.toString;

            // Get the number of "own" properties in an object
            var getPropSize = function (obj) {

                var size = 0,
                    key;
                for (key in obj) {
                    if (hasProp.call(obj, key)) size++;
                }
                return size;
            };

            // Get the name of an object type as a string
            var getType = function (obj, lc) {

                var str = toString.call(obj).slice(8, -1);
                return (lc && str.toLowerCase()) || str;
            };

            // Get an object from an (optional) context using delimited string notation
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

            // Create an object within an (optional) context using delimited string notation
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

            // Return a map of any items in the passed array that match
            // items in the dependency object
            var getDeps = function (arr) {

                return arr.map(function (item) {
                    return getObj(item, deps);
                }, this);
            };

            // Execute a passed function by first reconciling its arguments
            // against the dependency object and then applying any matches
            // directly
            var run = function (arr, fn) {
                var args = slice.call(arguments);                
                return fn.apply(this, getDeps(arr).concat(args.slice(2, args.length)));
            };

            // Asynch script loader
            var addScript = function (src, callback) {

                var doc = document,
                    head = doc.getElementsByTagName("head")[0] || doc.documentElement,
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
            };

            deps = (props && getType(props, true) === 'object') ? props : deps;

            // --------------------------- Start Public API ---------------------------

            syringe.register = syringe.add = function (name, dep, bindings) {

                if (getType(name, true) === 'object') {
                    for (var key in name) {
                        if (!hasProp.call(name, key)) continue;
                        this.add.apply(this, [key, name[key]]);
                    }
                    return this;
                }

                if (deps[name]) {
                    throw new Error('Key "' + name + '" already exists in the map; use .remove() to unregister it first!');
                } else {
                    if (getType(dep, true) === 'function' && bindings) {
                        dep = this.on(bindings, dep);
                    }
                    deps[name] = dep;
                }
                return this;
            };

            syringe.unregister = syringe.remove = function (name) {

                var newdeps = {};

                for (var key in deps) {
                    if (!hasProp.call(deps, key) || (hasProp.call(deps, name) && key === name)) continue;
                    newdeps[key] = deps[key];
                }

                deps = newdeps;
                return this;
            };

            syringe.bind = syringe.on = function () {

                ctx = root;

                var args, isNamed, name, arr, fn, ctx;

                args = [].slice.call(arguments);
                isNamed = (getType(args[0]) === 'String') ? true : false;

                switch (args.length) {

                    // Anonymous function, no context
                case 2:
                    return run.bind(ctx, args[0], args[1]);

                case 3:
                    // Named function, no context
                    if (isNamed) {
                        name    = args[0];
                        arr     = args[1];
                        fn      = args[2];
                    }
                    // Anonymous function, with context
                    else {
                        return run.bind(ctx[2], args[0], args[1]);
                    }
                    break;

                    // Named function, with context
                case 4:
                    name    = args[0];
                    arr     = args[1];
                    fn      = args[2];
                    ctx     = args[3];
                    break;
                }

                var strArr  = name.split('.')
                , objStr    = (strArr.length > 1) ? strArr.pop() : false;

                fn = run.bind(ctx, arr, fn);

                if (objStr) {
                    setObj(strArr.join('.'), ctx)[objStr] = fn;
                } else {
                    ctx[strArr.join('.')] = fn;
                }

                return this;
            };

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

            syringe.get = function (name) {

                if (getType(name, true) === 'string') {
                    
                    var obj = getObj(name, deps);

                    if (getType(obj, true) !== 'undefined') {
                        return obj;
                    }
                    return false;
                }

                return deps;
            };

            syringe.set = function (name, value) {

                var strArr = name.split('.'),
                    objStr = (strArr.length > 1) ? strArr.pop() : false;

                if ((getType(getObj(name, deps), true) === 'undefined')) {
                    throw new Error('Key "' + name + '" does not exist in the map!');
                }
                if (objStr) {
                    setObj(strArr.join('.'), deps)[objStr] = value;
                } else {
                    deps[strArr.toString()] = value;
                }

                return this;
            };

            syringe.fetch = function (map, callback) {

                var self = this, count = 0;

                // Keeps a count of the script load events and reconciles it
                // against the length of the script list...
                var stack = function () {

                    if (++count === getPropSize(map)) {
                        for (var key in map) {
                            if (!hasProp.call(map, key)) continue;
                            if (map[key].bind) self.add(key, getObj(map[key].bind, root));
                        }
                        callback.call(self);
                    }
                };

                // Loop that adds new script element for each list item...
                for (var key in map) {
                    if (!hasProp.call(map, key)) continue;
                    addScript(map[key].path, stack);
                }
            };

            syringe.wrap = function (name, wrapper, ctx) {

                ctx = ctx || this;

                var fn = this.get(name);
                if (getType(fn, true) === 'function' &&
                    getType(wrapper, true) === 'function') {
                    return this.set(name, function () {
                        var args = arguments;
                        return wrapper.apply(this, [
                            function () {
                                args = arguments.length ? arguments : args;
                                return fn.apply(ctx, args);
                            },
                            name, args
                        ]);
                    });
                }
                return false;
            };

            syringe.VERSION = '0.2.1';
            return syringe;
        };

    root.Syringe = syringe();
    root.Syringe.create = syringe;

}.call(this));