# syringe.js #

<img src="https://github.com/holt/syringe/blob/master/img/syringe.png?raw=true" align="right" title="# Just a little pin prick ... there'll be no more AAAAAAAAH!"/>

Syringe is a teeny-tiny [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) framework that allows you to dynamically assign data contracts to your functions and methods. No more worrying about passing information directly, indirectly, or relying on the lexical scope as Syringe can vaccinate your operations ahead of time!

Now, let's roll up our sleeves and begin shall we?

[![Build Status](https://travis-ci.org/holt/syringe.png)](https://travis-ci.org/holt/syringe)

## Table of Contents

- [Installation](#installation)
    - [Browser](#browser)
        - [Compatibility](#compatibility)
    - [Node](#node)
    - [NuGet](#nuget)
    - [Bower](#bower)
- [Overview](#overview)
    - [Example](#example)
- [Questions](#questions)
    - [Does injection work with constructor functions?](#does-injection-work-with-constructor-functions)
    - [Are we making a curry?](#are-we-making-a-curry)
    - [What's this about a "registry"?](#what's-this-about-a-registry)
- [API](#api)
- [Additional Examples](#additional-examples)
    - [Initialization and Registration](#initialization-and-registration)
        - [Register a Single Item](#register-a-single-item)
        - [Register a Map of Multiple Items](#register-a-map-of-multiple-items)
        - [Register Asynchronous Objects](#register-asynchronous-objects)
    - [Binding Methods](#binding-methods)
        - [Function Expression](#function-expression)
        - [Object Reference](#object-reference)
    - [Execution](#execution)
    - [Register and Bind Example](#register-and-bind-example)
    - [Wrap Example](#wrap-example)

## Installation

### Browser

Just add `syringe.min.js` to your environment.

**Note:** Syringe uses `JSON.parse` and also the following ECMAScript 5 / JavaScript 1.6 methods:  

- `Array.filter` 
- `Array.map`
- `Array.reduce`
- `Function.bind`
- `String.trim`

If you need to support older browsers, the [MDN](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects) polyfills for all these methods are provided in [lib/polyfill.min.js](https://github.com/holt/syringe/blob/master/lib/polyfill.min.js)

#### Compatibility

Syringe has been tested on the following browsers:

- Firefox 2+
- Chrome 11+
- Safari 3+
- Opera 9+
- Internet Explorer 7+

### Node

Ensure that you have installed the latest version of [node.js](http://nodejs.org) and run the following from the command prompt:

`npm install syringejs`

### NuGet

Run the following command in the [Package Manager Console](http://docs.nuget.org/docs/start-here/using-the-package-manager-console):

`Install-Package syringe.js`

### Bower

Ensure that you have installed the latest version of [Bower](http://bower.io/) and run the following from the command prompt:

`bower install syringe`


## Overview ##

Syringe works by taking a function and inoculating it with deep or shallow references to data items located within a data registry. When a syringed function executes, the references are reconciled against the registry and the _actual_ data items are passed to the function automatically.

### Example

First, create a new `Syringe` object instance:

```javascript
var syr = Syringe.create({
    'data': {
        '52774Y': {
            'name'      : 'McCaulay, Bob',
            'dob'       : '04/13/1967'
            'locale'    : 'GB',
            'division'  : 'Marketing'
        },
        '52775Z': {
            'name'      : 'Metzger, Ted',
            'dob'       : '08/23/1959',
            'locale'    : 'CA',
            'division'  : 'Facilities'
        }    
    }
});
```

Now define a simple _getter_ method and add it to the Syringe object registry. As part of this registration, we also specify that we want the `data` object to be injected into the getter when it is invoked:

```javascript
syr.add('get', function (data, id) {

    "use strict";
    data = data[id] || false;

    if (data) {
        var name    = data.name     || 'N/A',
            div     = data.division || 'N/A',
            locale  = data.locale   || 'N/A';

        data.msg = '' 
            + 'Name: '          + name 
            + '; Division: '    + div 
            + '; Locale: '      + locale;
    }

    return data;
}, ['data']);
```
**Note:** The `data` _parameter_ could actually be called anything (for example, `d` or `staff`) - it doesn't have to match the name of the injected object.

Let's create a simple utility function into which, on invocation, the getter is injected:

```javascript
syr.on('log', ['get'], function (get, id) {

    "use strict";

    return (get = get(id)) 
        ? (console.info('Volatile data accessed by employee ' + id + ' ... ' + get.msg), get)
        : false;
});
```

Now call the utility function with Ted's ID:

```javascript
log('52775Z');  // Logs: 
                // Volatile data accessed by employee 52775Z ... Name: Metzger, Ted; 
                // Division: Facilities; Locale: CA

                // Returns: 
                // {
                //    "name"        : "Metzger, Ted",
                //    "dob"         : "08/23/1959",
                //    "division"    : "Facilities",
                //    "locale"      : "CA",
                //    "msg"         : "Name: Metzger, Ted; Division: Facilities; Locale: CA"
                // }
```

The logging utility returns some useful information and logs out a messsage to the console.

Now we change the registry data for one of the items ...

```javascript
syr.set('data.52775Z.division', 'Development');
```
... and call the utility function again:

```javascript
log('52775Z');  // Logs: 
                // Volatile data accessed by employee 52775Z ... Name: Metzger, Ted; 
                // Division: Development; Locale: CA
                // ...
```

Ted's division has changed from `Facilities` to `Development` (quite the career move).

We'll take things up a notch. Create a simple validation function and add it to the registry:

```javascript
syr.add('flag', function (data) {
    return data.division !== 'Research';
});
```

Wrap the utility function with some enhancements ...

```javascript
log = syr.wrap(log, function (fn, id) {

    "use strict";
    
    var data = fn(), flag = this.get('flag');

    if (data && flag && flag(data)) {
        data.flagged = true;
        console.warn('This activity has been flagged!');
    } 

    return data;
});
```

... and call the enhanced utility function with Bob's ID:

```javascript
log('52774Y');  // Logs: 
                // Volatile data accessed by employee 52774Y ... Name: McCaulay, Bob; 
                // Division: Marketing; Locale: GB
                // This activity has been flagged!
                // ...
```

A condition in the base data triggers the warning logger we placed in the wrapper, and a `flagged` property is added to the data entry.

## Questions

### Does injection work with constructor functions?

Indeed it does. [Here's an example](http://goo.gl/KFGFQf) of a todo application (CSS styling courtesy of the awesome  [TodoMVC](http://todomvc.com) project) that uses dependency injection to construct collection and view objects, and conventional injection to manage controller operations. You can view the source code for this app in the [syringe-todos](https://github.com/holt/syringe-todos) repo.

<img src="https://github.com/holt/syringe/blob/master/img/todos.png?raw=true" align="center" title="What to do... what to do..."/>

### Are we making a [curry](https://en.wikipedia.org/wiki/Partial_application)?

When you curry a function you typically have some values in your hand before you create a version of the function that has some (or all) of those values partially applied to it. With Syringe, instead of actual values we bind pointers to a registry which is interrogated at execution time when the bound method is invoked. 

This is very convenient because you can arbitrarily change the registry values for a parameter so that completely different data gets passed the next time your bound function gets called. To further labor the medical theme, it's as if the flu shot you received last Winter could be remotely updated throughout the year. Only minus the Nobel Prize, obviously.

Currying _does_ take place, just at a different point. Syringe curries _your_ bound function into a factory that examines the passed parameters and applies the corresponding registry values to your function when it is called.

### What's this about a "registry"?

The registry is a closured dependency map unique to each Syringe object instance that holds all of the data items you're interested in automatically provisioning to your bound functions on invocation. You can provision objects, arrays, values, functions, strings, numbers, anything really. You can map to their values directly, or by reference.

**Note:** The free arguments you pass to a *bound* function don't have to match the signature; this is consistent with ordinary JavaScript functions. However, the bound parameters are expected to exist in the registry when the bound function is invoked.

## API ##

This following table describes the methods provided by the `Syringe` object:

Name     | Parameters   | Description 
---------|--------------|-------------
*create* | `map` (optional) | Create a new syringe object. <br/><br/>**Example**: `var syr = Syringe.create();`
*add*    | `name, value` | Register an item with the dependency map, where `name` is the dependency name and `value` is any valid JavaScript value. Alias: _register_. <br/><br/>**Example**: `syr.add('data', {'name': 'Mike'});`
*add*    | `name, value, binding` | If  `value` is a function that you want to automatically bind as a Syringe method, set the `binding` property to the array of properties you want to inject. Alias: _register_. <br/><br/>**Example**: `syr.add('data', function (props) {...}, ['props']);`
*add*    | `map`      | Register a map of dependencies, where `map` is an object. Alias: _register_. <br/><br/>**Example**: `syr.add({'data': {'name': 'Mike'}});`
*remove* | `name`                   | Remove a named item from the dependency map. Alias: _unregister_. <br/><br/>**Example**: `syr.remove('data');`
*on*     | `binding, fn, ctx` | Return a bound function that can access the dependency map. An optional `ctx` parameter makes the bound function execute in a specific context. Alias: _bind_. <br/><br/>**Example**: `var f = syr.on(['data'], function (data) {...});` <br/><br/> If you want to bind the _entire_ dependency map, use an asterisk (`*`) instead of a keyname in the binding array. <br/><br/>**Example**: `var f = syr.on(['*', 'data'], function (map, data) {...});`
*on*     | `name, binding, fn, ctx`| Bind a named function to an optional context. The `name` string can be a dot-delimited path; if the path doesn't exist it will be created dynamically as a nested object structure. An optional `ctx` parameter adds the bound function to a specified context. Alias: _bind_. <br/><br/>**Example**: `syr.on('f', ['data'], function (data) {...}, this);`
*get*    | `name` (optional) | Returns the named value from dependency map object. Dot-notation is permitted. Passing no argument returns the dependency map object. <br/><br/>**Example**: `syr.get('data');`
*set*    | `name, value` | Directly sets the value of a named key in the dependency map, if it exists. <br/><br/>**Example**: `syr.set('data.name', 'Bob');`
*exec*    | `name, args, ctx` | Directly execute a method within the registry. Provided as a convenience for occasions where binding isn't possible. An optional `ctx` parameter executes the method against a specified context. <br/><br/>**Example**: `syr.exec('func', ['Mike', '39']);`
*fetch*  | `array, callback` | Retrieve array-defined items asynchronously. Each array item is an object that contains a `path` property and a `bind` property. The `path` property is a string containing the (local) URI of the resource. The `bind` property specifies the Syringe key you want to associate with the JSON object retrieved from the resource.<br/><br/>**Note:** This method is only available in the browser.<br/><br/>**Example**: [See below](#register-asynchronous-objects)
*wrap*   | `fn, wrapper, ctx` | Wrap a bound method with another method in order to develop middleware. <br/><br/>**Example**: [See below](#wrap-example)
*copy*   | `binding, fn` | Create a new bound function from an existing one using a new registry binding. <br/><br/>**Example**: `var f2 = syr.copy(['data2'], f);`


## Additional Examples ##

The following sections describe how to initialize a new Syringe registry, populate it with data, and bind the data to functions in order to inject dependencies.

### Initialization and Registration

Create a sterile new syringe:
```javascript
var syr = Syringe.create();
```
... or initialize one that is loaded up with some with useful dependencies:

```javascript
var syr = Syringe.create({
   '$': window.jQuery || window.Zepto
});
```
#### Register a Single Item
```javascript
syr.add('tzone', {
    'result': [{
            'TimeZoneId': 'America-Montevideo',
            'DST'       : '-3',
            'GMT'       : '-2'
        }, {
            'TimeZoneId': 'America-Sao_Paulo',
            'DST'       : '-3',
            'GMT'       : '-2'
        }
    ]
});
```
#### Register a Map of Multiple Items

```javascript
syr.add({
    'uuid': function () {
        var a = function () {
            return Math.floor(65536 * Math.random()).toString(16);
        };
        return a() + a() + '-' + a() + '-' + a() + '-' + a() + '-' + a() + a() + a();
    },
    'stat': 0,
    'date': (function () {
        return JSON.parse(JSON.stringify(new Date()));
    }())
});
```

#### Register Asynchronous Objects

```javascript
syr.fetch([{
    path: '/syringe/test1',
    bind: 'data1'
}, {
    path: '/syringe/test2',
    bind: 'data2'
}], {
    'success': function () {
        console.log(this.get('data1'));
        console.log(this.get('data2'));
    }
});
```

### Binding Methods

You can bind your methods in a number of different ways. 

##### Function Expression

```javascript
var event = syr.on(['uuid', 'tzone', 'stat', 'date'], function (uuid, tzone, stat, date, props) {

    var state = ['Green', 'Amber', 'Orange', 'Red'][(stat = stat+1)];

    var GMT = tzone.result.filter(function (item) {
        return item.TimeZoneId === props.locale;
    })[0].GMT;

    if (stat < 4) syr.set('stat', stat); // Change the `stat` value

    return {
        'msg': 'User "' + props.name + '" entered forbidden zone at ' + date + ' GMT(' + GMT + ')',
        'id': uuid(),
        'stat': state
    };

});
```
##### Object Reference

```javascript
syr.on('event', ['uuid', 'tzone', 'stat'], function (uuid, tzone, stat, props) { 
    /* as above */ 
});
```
... or as a _deep_ object reference (which is dynamically constructed if the object doesn't already exist):

```javascript
syr.on('security.access.event', ['uuid', 'tzone', 'stat'], function (uuid, tzone, stat, props) {
    /* as above */
});
```
... or as an object reference within a provided context:

```javascript
syr.on('event', ['uuid', 'tzone', 'stat'], function (uuid, tzone, stat, props) { 
    /* as above */ 
}, security.access);
```

The object reference form returns the Syringe object, so you can create a chain of binding operations:

```javascript
syr
    .on('event', ['uuid', 'tzone', 'stat'], function (uuid, tzone, stat, props) { /* as above  */})
    .on('func1', ['_'], function (_, props) { /* ... */ })
    .on('func2', ['_'], function (_, props) { /* ... */ });
```

### Execution

Run the function:

```javascript
event({
    'name': 'Doe, John',
    'locale': 'America-Montevideo'
});

/* Returns: 
{
    "msg" : "User \"Doe, John\" entered forbidden zone at 2013-04-03T02:38:49.068Z GMT(-2)",
    "id"  : "5bc612d1-d6ea-d78f-7c24-5d26d299ec1",
    "cond": "Green"
}
*/
```
Run it again:

```javascript
event({
    'name': 'Smith, Alice',
    'locale': 'America-Sao_Paulo'
});

/* Returns: 
{
    "msg" : "User \"Smith, Alice\" entered forbidden zone at 2013-04-03T02:44:13.196Z GMT(-2)",
    "id"  : "5418d190-c1df-7d26-82e9-6d1aab74c1f",
    "cond": "Amber"
}
*/
```

###  Register and Bind Example

If you pass an array of registry properties as the third argument when you register a function, syringe will automatically bind the function before addding it to the registry:

```javascript
// Define a function for getting the current date:
var getDate = function () {

    var a = new Date(),
        b = a.getDate(),
        c = a.getMonth() + 1,
        a = a.getFullYear();

    return a + "/" + (10 > c ? "0" + c : c) + "/" + (10 > b ? "0" + b : b);
};

// Define a function for getting the current time:
var getTime = function () {

    var a = new Date(),
        b = a.getMinutes(),
        a = a.getHours();

    return (10 > a ? "0" + a : a) + ":" + (10 > b ? "0" + b : b);
};

// Create a new syringe and register the date and time functions:
var syr = Syringe.create({
    'date': getDate,
    'time': getTime
});

// Register a "condition" function that itself is bound and uses the date and time functions:
syr.add('condition', function (date, time, stat) {
    return 'Current status on ' + date() + ' at ' + time() + ' is ' + (stat || 'Green');
}, ['date', 'time']); // Registration binds the passed function

// Create a bound function that gets passed the "condition" function:
var msg = syr.on( ['condition'], function (condition, motd, stat) {
    return condition(stat) + '\nMessage of the day: ' + motd;
});

// Call the bound function with a message of the day:
msg('All is well.');
/* Returns:
    "Current status on 2013/04/07 at 23:15 is Green
    Message of the day: All is well."
*/

// Call the bound function with a status level and message of the day:
msg('Keep calm and carry on!', 'Amber');
/* Returns:
    "Current status on 2013/04/07 at 23:15 is Amber
     Message of the day: Keep calm and carry on!"
*/
```

###  Wrap Example

Bound methods can themselves be wrapped in other methods in order to create tiers of operation. For example, you might want to use a generic timer function to log out the execution time of a bound method. Example:

```javascript
// Generic timer function that will be passed the original registry method, 
// its name, and an array of its original arguments:
var timer = function (fn, name, funcname) {

    var start, stop, ret;
    
    start   = (new Date()).getTime();
    ret     = fn();
    stop    = (new Date()).getTime();
    
    console.log('The function "' + funcname + '" took ' + (stop - start) + 'ms');
    return ret;
};

var syr = Syringe.create({
    'utils': {
        "motd": function (user) {
            return "Greetings " + user;
        }
    }
});

var f = syr.on(['utils.motd'], function (motd, name) {
    // ... do stuff
    return motd(name);
});

// Wrap the `f` method with the `timer` function:
f = syr.wrap(f, timer);

f('Mike', 'msg'); // log: "The function "msg" took 1ms"
/* Returns: 
    "Greetings Mike"
*/
```