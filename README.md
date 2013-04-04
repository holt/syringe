# syringe.js #

![syringe](https://github.com/holt/syringe/blob/master/img/syringe.png?raw=true "Just a little pin prick... there'll be no more "AAAAAAAAH!" ") Syringe is a teeny-tiny (~1.5Kb _sans_ MDN polyfills) [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) framework that allows you to assign data deterministically to your functions and methods. No more worrying about passing data directly, indirectly, or relying on the lexical scope as Syringe can vaccinate your operations ahead of time!

Now, let's roll up our sleeves and begin shall we?

## Installation

Just add `syringe.js` or `syringe.min.js` to your environment.

**Note:** Syringe _does_ require the following methods ECMAScript 5 methods:  

- `Array.filter` 
- `Array.map`
- `Array.reduce`
- `Function.bind`

For your convenience, the [MDN](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects) polyfills for these methods are provided as part of the Syringe deliverable (they don't execute if your environment indicates the methods are already available). Take them out if you know you won't need them.

## Overview ##

Functions definitions in JavaScript are implicitly declarative; that is, you can see what arguments they expect by examining the signature and arity of their parameter definition. 

If arguments are meaningfully named (or even just familiar, like `$`) we can look at something like this:

```javascript
var identify = function (name, age) { // Do stuff... };
```
... and get an immediate sense of what is expected.


### So I can look at function and know what parameters it expects. So what?

So the function still needs _something_ to pass those arguments at the point of invocation. Syringe is all about what - given what we know of a function's declarative nature - that _something_ might be.

Syringe works by examining the parameter definition of a provided function and innoculating it with any _corresponding_ data items that already exist in a predefined registry. That is, when a Syringe-bound function executes, the expected parameters are reconciled against a registry of data objects and are passed in automatically. If the arguments aren't found in the registry then they will be treated like ordinary passed parameters.

### Do I smell curry?

Not exactly. When you [curry](https://en.wikipedia.org/wiki/Partial_application) a function you need the parameter values in your hand before you can create a version of the function that has some (or all) of those values prebound to it. With Syringe, this binding takes place deterministically at the point of invocation. 

This is very convenient because you can arbitrarily change the registry definition for a parameter so that _completely different_ data gets passed each time the bound function gets called. In medical terms, it's as if the influenza vaccine you received last Winter could be remotely updated throughout the year.

## Examples ##

### Initialization and Registration

Create a sterile new syringe:
```javascript
var mySyringe = syringe();
```
... or create one loaded up with some with some available dependencies:

```javascript
var mySyringe = syringe({
   '$'   : window.jQuery || window.Zepto,
   'bb'  : window.Backbone,
   'md'  : window.Modernizr,
   'hb'  : window.Handlebars
});
```
Register an additional item:
```javascript
mySyringe.add('tzone', {
   'result': [{
         'TimeZoneId': 'America-Montevideo',
         'DST': '-3',
         'GMT': '-2'
      }, {
         'TimeZoneId': 'America-Noronha',
         'DST': '-2',
         'GMT': '-2'
      }, {
         'TimeZoneId': 'America-Sao_Paulo',
         'DST': '-3',
         'GMT': '-2'
      }, {
         'TimeZoneId': 'Atlantic-South_Georgia',
         'DST': '-2',
         'GMT': '-2'
      }
   ],
   'datetime': (function () {
      return JSON.parse(JSON.stringify(new Date()));
   }())   
});
```
... or a map of mutliple items:

```javascript
mySyringe.add({
   'uuid': (function () {
      var a = function () {
         return Math.floor(65536 * Math.random()).toString(16)
      };
      return a() + a() + '-' + a() + '-' + a() + '-' + a() + '-' + a() + a() + a();
   }()),
   'stat': 0
});
```

### Binding


You can bind your methods in a number of different ways. 

##### Function Expression

```javascript
var accessEvent = mySyringe.on(function (uuid, tzone, stat, props) {

   var state = ['Green', 'Amber', 'Orange', 'Red'][stat++];

   var GMT = tzone.result.filter(function (item) {
      return item.TimeZoneId === props.locale;
   })[0].GMT;

   if (stat < 4) mySyringe.set('stat', stat);

   return {
      'msg' : 'User "' + props.name + '" entered restricted zone at ' + tzone.datetime + ' GMT(' + GMT + ')',
      'id'  : uuid,
      'stat': state
   };

});
```
##### Object Reference

```javascript
mySyringe.on('accessEvent', function (uuid, tzone, stat, props) { /* ... as above */ });
```
... or as a _deep_ object reference (which is dynamically constructed if the object doesn't already exist):

```javascript
mySyringe.on('security.access.event', function (uuid, tzone, stat, props) { /* ... as above */ });
```
... or as an object reference within a provided context:

```javascript
mySyringe.on('event', function (uuid, tzone, stat, props) { /* ... as above */ }, security.access);
```

##### Map

```javascript
mySyringe.on({
   'accessEvent'  : function (uuid, tzone, stat, props) { /* ... as above  */ },
   'otherEvent1'  : function ($, props) { /* ... yet more code */ },
   'otherEvent2'  : function ($, props) { /* ... yet more code */ }
});
```
##### Chain

```javascript
mySyringe.on('accessEvent', function (uuid, tzone, stat, props) { /* ... as above  */ })
   .on('otherEvent1', function ($, props) { /* ... yet more code */ })
   .on('otherEvent2', function ($, props) { /* ... yet more code */ });
```

##### Asynchronously

```javascript
var scripts = {
   'first': {
      '_': {
         'path': 'http://underscorejs.org/underscore-min.js',
         'bind': '_'
      },
      '$': {
         'path': 'http://code.jquery.com/jquery-1.9.1.min.js',
         'bind': 'jQuery'
      }
   },
   'second': {
      'mz': {
         'path': 'http://modernizr.com/downloads/modernizr-latest.js',
         'bind': 'Modernizr'
      },
      'bb': {
         'path': 'http://backbonejs.org/backbone-min.js',
         'bind': 'Backbone'
      }
   }
};

mySyringe.fetch(scripts.first, function () {
   mySyringe.fetch(scripts.second, this.bind(function (_, mz, bb, $) {
      console.log(arguments);
   }));
});
```


### Execution

Run the function:

```javascript
accessEvent({
   'name'   : 'Doe, John',
   'locale' : 'America-Sao_Paulo'
});

// Returns: 
{
   "msg" : "User \"Doe, John\" entered restricted zone at 2013-04-03T02:38:49.068Z GMT(-2)",
   "id"  : "5bc612d1-d6ea-d78f-7c24-5d26d299ec1",
   "cond": "Green"
}
```
Run it again:

```javascript
accessEvent({
   'name'   : 'Smith, Alice',
   'locale' : 'America-Sao_Paulo'
});

// Returns: 
{
   "msg" : "User \"Smith, Alice\" entered restricted zone at 2013-04-03T02:44:13.196Z GMT(-2)",
   "id"  : "5418d190-c1df-7d26-82e9-6d1aab74c1f",
   "cond": "Amber"
}
```