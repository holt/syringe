# syringe.js #

![syringe](https://github.com/holt/syringe/blob/master/img/syringe.png?raw=true "Just a little pin prick... there'll be no more "AAAAAAAAH!" ") Syringe is a teeny-tiny (~2.5Kb when minified without MDN polyfills) [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) framework that allows you to assign data deterministically to your functions and methods. No more worrying about passing data directly, indirectly, or relying on the lexical scope as Syringe can vaccinate your operations ahead of time!

Now, let's roll up our sleeves and begin shall we?

## Installation

Just add `syringe.js` or `syringe.min.js` to your environment.

**Note:** Syringe requires the following ECMAScript 5 / JavaScript 1.6 methods:  

- `Array.filter` 
- `Array.map`
- `Array.reduce`
- `Function.bind`

For your convenience, the [MDN](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects) polyfills for these methods are provided as part of the Syringe deliverable (they don't execute if your environment indicates the methods are already available). Take them out if you know you won't need them or have provided your own implementations.

### Browser Compatibility / Unit Tests

In progress.

## Overview ##

Syringe works by examining the parameter definition of a previously bound function and then _inoculating_ that function with any _corresponding_ data items located inside a predefined registry. That is, when a Syringe-bound function executes, the expected parameters are reconciled against a registry of data objects and are passed in automatically. If the arguments aren't found in the registry then they will be treated like ordinary passed parameters. 

Here's a simple example:
```javascript
var syr = syringe.create({
   'props': {
      'name': 'Mike',
      'age' : 39
   }
});

var f = syr.on(function (props, arg1, arg2) {
   return props.name + ' ' + props.age + ' ' + arg1 + ' ' + arg2;
});

f('Foo', 'Bar'); // Returns: "Mike 39 Foo Bar"
```

### Can I smell [curry](https://en.wikipedia.org/wiki/Partial_application)?

Not exactly<sup>+</sup>. When you curry a function you need the parameter values in your hand before you can create a version of that function that has some (or all) of those values partially applied to it. With Syringe however, this binding takes place dynamically at the point of invocation. 

This is very convenient because you can arbitrarily change the registry definition for a parameter so that completely different data gets passed the next time your bound function gets called. In medical terms, it's as if the influenza vaccine you received last Winter could be remotely updated throughout the year.

<sup>+</sup>Currying _does_ take place, just at a different point; Syringe curries _your_ function into a factory function that examines the passed parameters and applies them to your function when your function is called.

### What's this about a "registry"?

The registry is a closured map of all the data items you're interested in automatically provisioning to your syringe-bound functions on invocation. You can provision objects, arrays, values, functions, strings, numbers, anything really. You can map to their values directly, or by reference.

## API and Examples ##

This following table describes the methods offered by a the `syringe` object:

Name     | Parameters   | Description | Example
---------|--------------|-------------|---------
*create* | `map` (optional) | Create a new syringe object. | `var syr = syringe.create();`
*add*    | `name, value, bind` | Register an item with the dependency map, where `name` is the dependency name and `value` is any valid JavaScript value. Set `bind` to `true` if the value is a function that you want to automatically bind as a Syringe method. Alias: _register_ | `syr.add('data', {'name': 'Mike'});`
*add*    | `map`      | Register a map of dependencies, where `map` is an object. Alias: _register_ | `syr.add({'data': {'name': 'Mike'}});`
*remove* | `name`                   | Remove a named item from the dependency map. Alias: _unregister_ |  `syr.remove('data');`
*on*     | `function`               | Return a bound function that can access the dependency map. Alias: _bind_ | `var f = syr.on(function (data) {...});`
*on*     | `name, function, context`| Bind a named function to an optional context. The `name` string can be a dot-delimited path; if the path doesn't exist it will be created dynamically as a nested object structure. An optional `context` parameter adds the bound function to a context. Alias: _bind_ | ` syr.on('f', function (data) {...}, this);`
*get*    | `name` (optional) | Returns the named value from dependency map object. Dot-notation is permitted. Passing no argument returns the dependency map object. | `syr.get('data');`
*set*    | `name, value` | Directly sets the value of a named key in the dependency map, if it exists. | `syr.set('data.name', 'Bob');`
*fetch*  | `map, callback` | Retrieve mapped items asynchronously. In order to the do this each map entry requires a `path` property and a `bind` property. The `path` property is a string containing the HTTP path to the resource. The `bind` property indicates the value you want to ultimately associate with this key. | [See below](#asynchronously)

### Initialization and Registration

Create a sterile new syringe:
```javascript
var syr = syringe.create();
```
... or initialize one that is loaded up with some with useful dependencies:

```javascript
var syr = syringe.create({
   '$': window.jQuery || window.Zepto
});
```
Register an additional item:
```javascript
syr.add('tzone', {
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
... or a map of multiple items:

```javascript
syr.add({
   'uuid': function () {
      var a = function () {
         return Math.floor(65536 * Math.random()).toString(16);
      };
      return a()+a()+'-'+a()+'-'+a()+'-'+a()+'-'+a()+a()+a();
   },
   'stat': 0
});
```

### Binding

You can bind your methods in a number of different ways. 

##### Function Expression

```javascript
var event = syr.on(function (uuid, tzone, stat, props) {

   var state = ['Green', 'Amber', 'Orange', 'Red'][stat++];

   var GMT = tzone.result.filter(function (item) {
      return item.TimeZoneId === props.locale;
   })[0].GMT;

   if (stat < 4) syr.set('stat', stat); // Change the `stat` value

   return {
      'msg' : 'User "' + props.name + '" entered restricted zone at ' + tzone.datetime + ' GMT(' + GMT + ')',
      'id'  : uuid(),
      'stat': state
   };

});
```
##### Object Reference

```javascript
syr.on('event', function (uuid, tzone, stat, props) { /* as above */ });
```
... or as a _deep_ object reference (which is dynamically constructed if the object doesn't already exist):

```javascript
syr.on('security.access.event', function (uuid, tzone, stat, props) { /* as above */ });
```
... or as an object reference within a provided context:

```javascript
syr.on('event', function (uuid, tzone, stat, props) { /* as above */ }, security.access);
```

##### Map

```javascript
syr.on({
   'event'  : function (uuid, tzone, stat, props) { /* as above  */ },
   'func1'  : function ($, props) { /* ... */ },
   'func2'  : function ($, props) { /* ... */ }
});
```
##### Chain

```javascript
syr
   .on('event', function (uuid, tzone, stat, props) { /* as above  */ })
   .on('func1', function ($, props) { /* ... */ })
   .on('func2', function ($, props) { /* ... */ });
```

##### Asynchronously

```javascript
var scripts = {
   'first': {
      '_': {
         'path': 'http://underscorejs.org/underscore-min.js',
         'bind': '_'
      }
   },
   'second': {
      'bb': {
         'path': 'http://backbonejs.org/backbone-min.js',
         'bind': 'Backbone'
      }
   }
};

syr.fetch(scripts.first, function () {
   syr.fetch(scripts.second, this.bind(function (_, bb) {
      console.log(arguments);
   }));
});
```

### Execution

Run the function:

```javascript
event({
   'name'   : 'Doe, John',
   'locale' : 'America-Sao_Paulo'
});

// Returns: 
//    {
//       "msg" : "User \"Doe, John\" entered restricted zone at 2013-04-03T02:38:49.068Z GMT(-2)",
//       "id"  : "5bc612d1-d6ea-d78f-7c24-5d26d299ec1",
//       "cond": "Green"
//    }
```
Run it again:

```javascript
event({
   'name'   : 'Smith, Alice',
   'locale' : 'America-Sao_Paulo'
});

// Returns: 
//    {
//       "msg" : "User \"Smith, Alice\" entered restricted zone at 2013-04-03T02:44:13.196Z GMT(-2)",
//       "id"  : "5418d190-c1df-7d26-82e9-6d1aab74c1f",
//       "cond": "Amber"
//    }
```

###  Register and Bind Example

If you pass `true` as the third argument when you register a function, syringe will automatically bind the function before addding it to the map:

```javascript
// Define a function for getting the current date:
var getDate = function () {
   
   var a    = new Date
      , b   = a.getDate()
      , c   = a.getMonth() + 1
      , a   = a.getFullYear();

   return a + "/" + (10 > c ? "0" + c : c) + "/" + (10 > b ? "0" + b : b);
};

// Define a function for getting the current time:
var getTime = function () {
   
   var a    = new Date
      , b   = a.getMinutes()
      , a   = a.getHours();

   return (10 > a ? "0" + a : a) + ":" + (10 > b ? "0" + b : b);
};

// Create a new syringe and register the date and time functions:
var syr = syringe.create({
   'date': getDate,
   'time': getTime
});

// Register a "condition" function that itself is bound and uses the date and time functions:
syr.register('condition', function (date, time, stat) {
   return 'Current status on ' + date() + ' at ' + time() + ' is ' + (stat || 'Green');
}, true);   // Registration binds the passed function

// Create a bound function that gets passed the "condition" function:
var msg = syr.on(function (condition, stat, motd) {
   return condition(stat) + '\nMessage of the day: ' + motd;
});

// Call the bound function with a message of the day:
msg('All is well.');                      
// Returns:
//    "Current status on 2013/04/07 at 23:15 is Green
//    Message of the day: All is well."

// Call the bound function with a status level and message of the day:
msg('Amber', 'Keep calm and carry on!');  
// Returns:
//    "Current status on 2013/04/07 at 23:15 is Amber
//    Message of the day: Keep calm and carry on!"
```