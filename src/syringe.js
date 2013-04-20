// syringe.js v0.1.14

/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, 
undef:true, unused:true, curly:true, browser:true, indent:4, maxerr:50, laxcomma:true,
forin:false, curly:false */

(function () {

    "use strict";

    var root = this,
        syringe;

    syringe = function (props) {

        // Pointers and containers
        var syringe  = {}
        , deps       = {}
        , hasProp    = {}.hasOwnProperty
        , slice      = [].slice
        , toString   = Object.prototype.toString;

        // RegExp Patterns
        var PARAMS  = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
        , PARAM     = /^\s*(_?)(\S+?)\1\s*$/
        , CLEAN     = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        // Asynch script loader
        var addScript = function (src, callback) {

            var doc = document
            , head  = doc.getElementsByTagName("head")[0] || doc.documentElement
            , node  = doc.createElement("script")
            , done  = false;

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

            var fn = function (item) {
                return deps[item];
            };
            return arr.map(fn, this);
        };

        // Execute a passed function by first reconciling its arguments
        // against the dependency object and then applying any matches
        // directly
        var run = function ( /* fn, args1, args2... */ ) {

            var args    = slice.call(arguments)
            , fn        = args.shift()
            , argStr    = fn.toString().replace(CLEAN, '').match(PARAMS);

            var depArr = getDeps(argStr[1].split(',').map(function (val) {
                return val.replace(PARAM, function (match, p1, p2) {
                    return p2;
                });
            })).filter(function (item) {
                return item;
            });

            return fn.apply(this, depArr.concat(args));
        };

        deps = (props && getType(props, true) === 'object') ? props : deps;

        // --------------------------- Start Public API ---------------------------

        syringe.register = syringe.add = function (name, dep, bind) {

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
                if (getType(dep, true) === 'function' && bind) {
                    dep = this.on(dep);
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

        syringe.on = syringe.bind = function (name, fn, ctx) {

            if (getType(name, true) === 'object') {
                for (var key in name) {
                    if (!hasProp.call(name, key)) continue;
                    this.on.apply(this, [key, name[key]]);
                }
                return this;
            }

            // Is this binding going to be assigned to a name in an optional context?
            if (getType(name, true) === 'string' && getType(fn, true) === 'function') {

                ctx = ctx || root;

                var strArr  = name.split('.')
                , objStr    = (strArr.length > 1) ? strArr.pop() : false;

                fn = run.bind(ctx, fn);

                if (objStr) setObj(strArr.join('.'), ctx)[objStr] = fn;
                else ctx[strArr.join('.')] = fn;
                return this;

                // Is this binding simply going to be returned as an anonymous function?
            } else if (getType(name, true) === 'function') {
                ctx = getType(fn, true) === 'object' ? fn : root;
                return run.bind(ctx, name);
            }
        };

        syringe.get = function (str) {

            if (getType(str, true) === 'string') {
                return (getObj(str, deps) || false);
            }

            return deps;
        };

        syringe.set = function (str, value) {

            var strArr = str.split('.'),
                objStr = (strArr.length > 1) ? strArr.pop() : false;

            if (!getObj(str, deps)) {
                throw new Error('Key "' + str + '" does not exist in the map!');
            }
            if (objStr) {
                setObj(strArr.join('.'), deps)[objStr] = value;
            } else {
                deps[strArr.toString()] = value;
            }

            return this;
        };

        syringe.fetch = function (map, callback) {

            var self = this,
                count = 0;

            // Keeps a count of the script load events and reconciles it
            // against the length of the script list...
            var stack = function () {

                if (++count === getPropSize(map)) {
                    for (var key in map) {
                        if (!hasProp.call(map, key)) continue;
                        self.add(key, getObj(map[key].bind, root));
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

        syringe.VERSION = '0.1.14';
        return syringe;
    };

    root.Syringe = syringe();
    root.Syringe.create = syringe;

}.call(this));