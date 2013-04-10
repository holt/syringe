// Array.filter polyfill (MDN)
[].filter||(Array.prototype.filter=function(c,f){if(null==this)throw new TypeError;var b=Object(this),g=b.length>>>0;if("function"!=typeof c)throw new TypeError;for(var d=[],a=0;a<g;a++)if(a in b){var e=b[a];c.call(f,e,a,b)&&d.push(e)}return d});

// Array.map polyfill (MDN)
[].map||(Array.prototype.map=function(d,f){var g,e,a;if(null==this)throw new TypeError(" this is null or not defined");var b=Object(this),h=b.length>>>0;if("function"!==typeof d)throw new TypeError(d+" is not a function");f&&(g=f);e=Array(h);for(a=0;a<h;){var c;a in b&&(c=b[a],c=d.call(g,c,a,b),e[a]=c);a++}return e});

// Array.reduce polyfill (MDN)
"function"!==typeof Array.prototype.reduce&&(Array.prototype.reduce=function(d,e){if(null===this||"undefined"===typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!==typeof d)throw new TypeError(d+" is not a function");var a=0,f=this.length>>>0,b,c=!1;1<arguments.length&&(b=e,c=!0);for(;f>a;++a)this.hasOwnProperty(a)&&(c?b=d(b,this[a],a,this):(b=this[a],c=!0));if(!c)throw new TypeError("Reduce of empty array with no initial value");return b});

// Function.bind polyfill (MDN)
Function.prototype.bind||(Function.prototype.bind=function(b){if("function"!==typeof this)throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");var d=Array.prototype.slice.call(arguments,1),e=this,a=function(){},c=function(){return e.apply(this instanceof a&&b?this:b,d.concat(Array.prototype.slice.call(arguments)))};a.prototype=this.prototype;c.prototype=new a;return c});

/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, 
undef:true, unused:true, curly:true, browser:true, indent:3, maxerr:50, laxcomma:true,
forin:false, curly:false */

// syringe.js v0.1.10
(function () {

   "use strict";
   
   var root = this, syringe;

   syringe = function (props) {
      
      // Pointers and containers
      var syringe    = {}
         , deps      = {}
         , hasProp   = {}.hasOwnProperty
         , slice     = [].slice
         , toString  = Object.prototype.toString;

      // Patterns
      var PARAMS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
         , PARAM = /^\s*(_?)(\S+?)\1\s*$/
         , CLEAN = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
   
      // Asynch script-loader/-runner...
      var addScript = function (src, callback) {

         var doc     = document
            , head   = doc.getElementsByTagName("head")[0] || doc.documentElement
            , script = doc.createElement("script")
            , done   = false;

         script.src = src;

         script.onload = script.onreadystatechange = function () {

            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {

               done = true;
               script.onload = script.onreadystatechange = null;

               if (head && script.parentNode) head.removeChild(script);
               if (getType(callback, true) === 'function') callback();

            }
         };

         head.insertBefore(script, head.firstChild);
      };

      // Get the number of "own" properties in an object
      var getPropSize = function (obj) {

         var size = 0, key;
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
      
         var arr = str.filter(function (num) {
            return num.length;
         }),
            obj = null;
      
         obj = arr.reduce(function (prev, curr, index, list) {
            if (prev) {
               return prev[list[index]];
            }
         }, ctx);
         return obj;
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
            , fn     = args.shift()
            , argStr = fn.toString().replace(CLEAN, '').match(PARAMS);
   
         var depArr = getDeps(argStr[1].split(',').map(function (val) {
            return val.replace(PARAM, function (match, p1, p2) {
               return p2;
            });
         }));
   
         depArr.length = depArr.length - args.length;
         return fn.apply(this, depArr.concat(args));
      };
      
      deps = (getType(props, true) === 'object') ? props : deps;      
      
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
         }
         else {
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

         var strArr  = str.split('.')
         , objStr    = (strArr.length > 1) ? strArr.pop() : false;
      
         if (!getObj(str, deps)) {
            throw new Error('Key "' + str + '" does not exist in the map!');
         }

         if (objStr) {
            setObj(strArr.join('.'), deps)[objStr] = value;
         }
         else {
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

      syringe.$ = root.jQuery || root.Zepto || root.ender || root.$;

      syringe.VERSION = '0.1.10';

      return syringe;

   };

   root.syringe         = syringe();
   root.syringe.create  = syringe;

}.call(this));