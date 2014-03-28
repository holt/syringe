# syringe.js [![Build Status](https://travis-ci.org/holt/syringe.png)](https://travis-ci.org/holt/syringe) #

<img src="https://github.com/holt/syringe/blob/master/img/syringe.png?raw=true" align="right" title="# Just a little pin prick ... there'll be no more AAAAAAAAH!"/>

Syringe is a teeny-tiny JavaScript dependency injection framework that allows you to dynamically assign data contracts to your functions, constructor functions, and methods. No more worrying about passing information directly, indirectly, or relying on the lexical scope as Syringe can vaccinate your operations ahead of time!

Now, let's roll up our sleeves and begin shall we?

## Table of Contents

- [Overview](#overview)
- [Questions](#questions)
- [Installation](#installation)
- [API](#api)
- [Examples](#examples)
- [License](#license)

## Overview ##

Syringe works by taking a function and inoculating it with deep or shallow references to data items located within a data registry. When a syringed function executes, the references are reconciled against the registry and the _actual_ data items are passed to the function automatically.

### A Simple Example

First, create a new `Syringe` object instance:

```javascript
var syr = Syringe.create({
    'data': {
        '00000': {
            'name'      : 'Slothrop, Tyrone',
            'rank'      : 'Lieutenant',
            'locale'    : 'GB',
            'division'  : 'ACHTUNG'
        }
    }
});
```

Now define a simple _getter_ method and add it to the Syringe object registry. As part of this registration, we also specify that we want the `data` object to be injected
into the getter when it is invoked:

```javascript
syr.add('utils.get', function (data, id) {

    'use strict';

    if (data = data[id] || false) {
        data.msg = ''
            + 'ID: '            + id
            + '; Rank: '        + data.rank     || 'N/A'
            + '; Division: '    + data.division || 'N/A';
    }

    return data;
}, ['data']);
```
**Note:** The `data` _parameter_ could actually be called anything (for example, `d` or `staff`) - it doesn't have to match the name of the injected object.

Let's create a simple utility function into which, on invocation, the getter is injected:

```javascript
syr.on('log', ['utils.get'], function (get, id) {

    'use strict';

    return (get = get(id))
        ? (console.info('Schwarzgerät accessed by "' + get.name + '"\n' + get.msg), get)
        : false;
});
```

Now call the utility function with Slothrop's ID:

```javascript
log('00000');   // Logs:
                //      Schwarzgerät accessed by "Slothrop, Tyrone"
                //      ID: 00000; Rank: Lieutenant; Division: ACHTUNG

                // Returns:
                //      {
                //          'name'      : 'Slothrop, Tyrone',
                //          'rank'      : 'Lieutenant',
                //          'locale'    : 'GB',
                //          'division'  : 'ACHTUNG',
                //          'msg'       : 'ID: 00000; Rank: Lieutenant; Division: ACHTUNG'
                //      }
```

The logging utility returns some useful information and logs out a message to the console.

### What Just Happened?

 The `log` function definition doesn't contain any _direct_ references to which getter method should be used or where the staff data is stored as the `get` method is passed into `log` by injection. When `get` is executed the `data` object is passed into `get` automatically. Thus, invoking `log` completes an injection contract between the three entities: `data`, `get`, and `log`.

Loose coupling between the concerns means that we can easily change the registry data for the injected items. Let's add a custom warning message:

```javascript
syr.add({
    'warnings': {
        'access': {
            'success'   : '{0} is A-OK!',
            'fail'      : '{0} does not have the proper authorization!'
        }
    }
});
```
... modify the getter to check the data:

```javascript
syr.set('utils.get', function (data, access, id) {

    'use strict';

    if (data = data[id] || false) {
        var action = (data.rank !== 'General') ? 'fail' : 'success';
        data.msg = access[action].replace('{0}', 'ID ' + id);
    }

    return data;
}, ['data', 'warnings.access']);

```

... and call the utility function again:


```javascript
log('00000');   // Logs:
                //      Schwarzgerät accessed by "Slothrop, Tyrone"
                //      ID 00000 does not have the proper authorization!
                // ...
```

Change Slothrop's rank:

```javascript
syr.set('data.00000.rank', 'General');
```
... and call the utility function again:

```javascript
log('00000');   // Logs:
                //      Schwarzgerät accessed by "Slothrop, Tyrone"
                //      ID 00000 is A-OK!
                // ...
```

## Questions

### "Does injection work with constructor functions?"

Indeed it does, and we can demonstrate this with another simple example. Create a data object:

```javascript
var syr = Syringe.create({
    'data': {
        '00000': {
            'name'      : 'Slothrop, Tyrone',
            'rank'      : 'Lieutenant',
            'locale'    : 'GB',
            'division'  : 'ACHTUNG'
        },
        '00001': {
            'name'      : 'Mucker-Maffick, Oliver',
            'rank'      : 'Lieutenant',
            'locale'    : 'GB',
            'division'  : 'ACHTUNG'
        }
    }
});
```
Create a simple constructor that automatically adds `data` to its context:
```javascript
var StaffObj = function (data, id) {

    'use strict';

    data = data || {};

    if (({}).toString.call(data[id]) === '[object Object]') {
        for (var prop in data[id]) {
            if (data[id].hasOwnProperty(prop)) {
                this[prop] = data[id][prop];
            }
        }
    }
};
```
Bind the `data` object to the constructor:
```javascript
StaffObj = syr.on(['data'], StaffObj);
```
... and create a couple of new objects:
```javascript
var slothrop = new StaffObj('00000');   // Creates:
                                        //      {
                                        //          "name"    : "Slothrop, Tyrone",
                                        //          "rank"    : "Lieutenant",
                                        //          "locale"  : "GB",
                                        //          "division": "ACHTUNG"
                                        //      }

var tantivy = new StaffObj('00001');    // Creates:
                                        //      {
                                        //          "name"    : "Mucker-Maffick, Oliver",
                                        //          "rank"    : "Lieutenant",
                                        //          "locale"  : "GB",
                                        //          "division": "ACHTUNG"
                                        //      }
```

### "Can I see a more complex example?"

[Here's a Todos application](http://holt.github.io/syringe-todos)<sup>+</sup> that uses Syringe dependency injection to construct collection and view objects and manage controller operations. You can view the source code for this app in the [syringe-todos](https://github.com/holt/syringe-todos) repo.

<img src="https://github.com/holt/syringe/blob/master/img/todos.png?raw=true" align="center" title="What to do... what to do..."/>

<sup>+ CSS and images courtesy of the awesome [TodoMVC](http://todomvc.com) project</sup>

### "Aren't we just making a curry?"

When you [curry](https://en.wikipedia.org/wiki/Partial_application) a function you typically have some values in your hand before you create a version of the function that has some (or all) of those values partially applied to it. With Syringe, instead of actual values we bind pointers to a registry which is interrogated at execution time when the bound method is invoked.

This is very convenient because you can arbitrarily change the registry values for a parameter so that completely different data gets passed the next time your bound function gets called. To further labor the medical theme, it's as if the flu shot you received last Winter could be remotely updated throughout the year. Only minus the Nobel Prize, obviously.

Currying _does_ take place, just at a different point. Syringe curries _your_ bound function into a factory that examines the passed parameters and applies the corresponding registry values to your function when it is called.

### "What's this about a registry?"

The registry is a closured dependency map unique to each Syringe object instance that holds all of the data items you're interested in automatically provisioning to your bound functions on invocation. You can provision objects, arrays, values, functions, strings, numbers, anything really. You can map to their values directly, or by reference.

**Note:** The free arguments you pass to a *bound* function don't have to match the signature; this is consistent with ordinary JavaScript functions. However, the bound parameters are expected to exist in the registry when the bound function is invoked.

### "Why doesn't Syringe just use the function signature?"

Some JavaScript dependency injection tutorials and libraries out there describe or provide ways of deriving function dependencies by _inference_ - that is, by scraping the contents of the bound function's signature:

```javascript
var f = function ($dep1, $dep2, freearg1, frearg2) { ... };

Injection.bind(f);  // The library uses RegEx to figure out the parameters
                    // of `f` in order to pull them from the data registry
                    // and apply them to `f` when the function is executed
```

There are a number of reasons why Syringe does not work this way, the main one being that parameters often get renamed when run through compression / obfuscation systems such as Google Closure or UglifyJS. This makes any subsequent reconciliation of the parameters against named items impossible.

In addition, unless you namespace the dependencies it is impossible to disambiguate them from the free arguments. Also, dot-notation is not allowed in parameter names so you end up using something goofy like `$leve1_level2_level3` to retrieve deep items.

## Installation

### Browser

Just download [syringe.min.js](https://raw.github.com/holt/syringe/master/syringe.min.js) and add it to your to your environment.

#### Dependencies

Syringe uses `JSON.parse` and also the following ECMAScript 5 / JavaScript 1.6 methods:

- `Array.filter`
- `Array.map`
- `Array.reduce`
- `Function.bind`
- `String.trim`
- `Object.keys`
- `Object.create`

All of the above methods are available natively on modern browsers. If you need to support older browsers, the polyfills for these methods are provided in [lib/polyfill.min.js](https://raw.github.com/holt/syringe/master/lib/polyfill.min.js)

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

### Bower

Ensure that you have installed the latest version of [Bower](http://bower.io/) and run the following from the command prompt:

`bower install syringe --save`

### NuGet

Run the following command in the [Package Manager Console](http://docs.nuget.org/docs/start-here/using-the-package-manager-console):

`Install-Package syringe.js`

## API ##

This following table describes the methods provided by the `Syringe` object:

Name     | Parameters   | Description
---------|--------------|-------------
*create* | `[map]` | Create a new syringe object. <br/><br/>**Example**: `var syr = Syringe.create();`
*add*    | `name, value [, bindings]` | Register an item with the dependency map, where `name` is the dependency name and `value` is any valid JavaScript value. Alias: _register_. <br/><br/>**Example**: `syr.add('data', {'name': 'Mike'});`<br/><br/> If  `value` is a function that you want to automatically bind as a Syringe method, set the `bindings` property to the array of properties you want to inject. Alias: _register_. <br/><br/>**Example**: `syr.add('data', function (props) {...}, ['props']);`
*add*    | `map`      | Register a map of dependencies, where `map` is an object. Alias: _register_. <br/><br/>**Example**: `syr.add({'data': {'name': 'Mike'}});`
*add*    | `array`      | Register an array of map of dependencies, where each map is an object. Useful for asserting order when additions are functions that are side-effectful. Alias: _register_. <br/><br/>**Example**: `syr.add([{'data.name': 'Mike'}, {'data.age': '39'}]);`
*remove* | `name`                   | Remove a named item from the dependency map. Alias: _unregister_. <br/><br/>**Example**: `syr.remove('data');`
*remove* | `array`                   | Remove an array of named item from the dependency map. Alias: _unregister_. <br/><br/>**Example**: `syr.remove(['data', 'foo.bar']);`
*on*     | `bindings, fn [, ctx]` | Return a bound function that can access the dependency map. An optional `ctx` parameter makes the bound function execute in a specific context. Alias: _bind_. <br/><br/>**Example**: `var f = syr.on(['data'], function (data) {...});` <br/><br/> If you want to bind the current Syringe object, use the keyword `this` instead of a keyname in the bindings array. <br/><br/>**Example**: `var f = syr.on(['this'], function (syr) {...});` <br/><br/> If you want to bind the _entire_ dependency map, use an asterisk (`*`) instead of a keyname in the bindings array. <br/><br/>**Example**: `var f = syr.on(['*'], function (map) {...});` <br/><br/> If you want to bind a shallow or deep item located _outside_ of the dependency map in the global object, use the prefix `global:` before the keyname in the bindings array. <br/><br/>**Example**: `var f = syr.on(['global:jQuery'], function ($) {..});`
*on*     | `name, bindings, fn [, ctx]`| Bind a named function. The `name` string can be a character-delimited path; if the path doesn't exist it will be created dynamically as a nested object structure. An optional `ctx` parameter makes the bound function execute in a specific context. Alias: _bind_. <br/><br/>**Example**: `syr.on('f', ['data'], function (data) {...}, this);`
*on* | `map` | Bind a named function to an optional target, or return an unnamed function. The `name` property can be a character-delimited path; if the path doesn't exist it will be created dynamically as a nested object structure. An optional `ctx` property makes the bound function execute in a specific context. Alias: _bind_. <br/><br/>**Example**: [See below](#creating-bound-functions-using-a-property-map)
*get*    | `name` | Returns the named value from dependency map object. Dot-notation is permitted. Passing no argument returns the dependency map object. <br/><br/>**Example**: `syr.get('data');`
*set*    | `name, value [, bindings]` | Directly sets the value of a named key in the dependency map, if it exists. <br/><br/>**Example**: `syr.set('data.name', 'Bob');`<br/><br/> If  `value` is a function that you want to automatically bind as a Syringe method, set the `bindings` property to the array of properties you want to inject.<br/><br/>**Example**: `syr.set('get', function (name) {...}, ['data.name']);`
*exec*    | `name, args [, ctx]` | Directly execute a method within the dependency map. Provided as a convenience for occasions where binding isn't possible. An optional `ctx` parameter executes the method against a specified context. <br/><br/>**Example**: `syr.exec('f', ['Mike', '39']);`
*fetch*  | `array, props` | Retrieve array-defined items asynchronously. Each array item is an object that contains a `path` property and a `bind` property. The `path` property is a string containing the (local) URI of the resource. The `bind` property specifies the Syringe key you want to associate with the JSON object retrieved from the resource.<br/><br/>**Note:** This method is only available in the browser.<br/><br/>**Example**: [See below](#register-items-asynchronously)
*wrap*   | `fn, wrapper [, ctx]` | Wrap a bound method with another method in order to develop middleware. An optional `ctx` parameter adds the bound function to a specified context.<br/><br/>**Example**: [See below](#fibonacci-number-add-on-remove-wrap-get)
*copy*   | `bindings, fn [, ctx]` | Create a new bound function from an existing one using a new dependency map binding. <br/><br/>**Example**: `var f2 = syr.copy(['data2'], f);`
*mixin*   | `map` | Add mixin methods to the Syringe object prototype. <br/><br/>**Example**: `syr.mixin({'f': function () { return this; }});`
*separator* | `value` | Change the name separator character used to create, retrieve, and bind objects. The default character is a period (`.`). The character must be non-alphanumeric. <br/><br/>**Example**: `syr.separator('#');`
*listen* | `name, fn` | Binds a listener to a named Syringe method (`get`, `set`, `add`, or `remove`). Shallow or deep 
path namespacing is also supported. <br/><br/>**Example**: `syr.listen('add', function (name, value) {...});` <br/><br/>**Example**: `syr.listen('set:name', function (name, value) {...});`  <br/><br/>**Example**: `syr.listen('remove:data.name', function (name) {...});`

### Creating Bound Functions Using a Property Map

Instead of passing multiple arguments to `.on()`, functions can be bound using a property map object.

Property  | Description  | Example | Optional
----------|--------------|---------|----------
*name*    | A character delimited name for the bound function.<br/><br/>If a name but no `target` property is provided, the function is attached in shallow or deep form to the global object.<br/><br/>If a name and a `target` property is provided, the function is attached in shallow or deep form to the target object.<br/><br/>**Note:** If no name is provided, the bound function is returned as an anonymous function. | `first.second.third` | Yes
*bindings*| An array of registry map items to be injected into the function specified by `fn`. | `['data', 'weather.report']` | No
*fn*      | The function against which the injection operation takes place. Must have at least as many parameters as injected items. Any additional parameters are treated as free arguments that are passed by the caller on invocation. | `function (data, report) {...}` | No
*ctx*     | The `this` context in which the function specified by `fn` will execute. | `{'foo': 'bar'}` | Yes
*target*  | The target into which a named bound function can be attached. If the function isn't named, this property has no effect. | `window.utils` | Yes

Here's a simple example. Add a an empty target:

```javascript
window.utils = {};
```
Add some data to the registry:
```javascript
Syringe.add({
    data: 'example data',
    weather: {
        report: 'sunny'
    }
})
```
Create a simple function:
```javascript
var fn = function (data, report) {
    console.log('Here is some ' + data);
    console.log('The weather is ' + report);
    console.log('Let\'s go to the ' + this.foo);
};
```
Bind the function as a named function that executes with a provided context and gets added to a specified target:
```javascript
Syringe.on({
    name    : 'first.second.third',
    bindings: ['data', 'weather.report'],
    fn      : fn,
    ctx     : {'foo': 'bar'},
    target  : window.utils
});
```
Execute the bound function:
```javascript
window.utils.first.second.third();  //  Logs:
                                    //      Here is some example data
                                    //      The weather is sunny
                                    //      Let's go to the bar
```

### Register Items Asynchronously

You can retrieve JSON data items from a remote source and add them to the Syringe registry using the `fetch` method:

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


## Examples ##

The following generic examples show how some of the API methods provided by Syringe might be used to manage function operations.

### FizzBuzz (add, bind, exec, remove) ###

A FizzBuzz is a program that prints the numbers from 1 to 100. But for multiples of three it prints `Fizz` instead of the number. For multiples of five it prints `Buzz`. For numbers which are multiples of both three and five it prints `FizzBuzz`. It's also a drinking game, and a surprisingly tricky one.

```javascript
Syringe.add('fn', function (syr, fn, lg, n) {

    // Examine the passed integer and log the evaluation
    n = n || 1, lg((n % 3?'':'Fizz')+(n % 5?'':'Buzz') || n);

    // Execute against self with current integer or remove self
    return (100 >= ++n ? fn(n) : syr.remove('fn'));

}, ['this', 'fn', 'global:console.log']);

// Execute the function:
Syringe.exec('fn');
```

The above code shows how a simple functional FizzBuzz can be created with Syringe, and illustrates a number of different qualities. The first is obviously recursion - a function can inject itself into itself when executed.

The bound function also receives its action (in this case a logger from the `global:` context) as a passed parameter, which decouples side-effectful operations from the main operation slightly. When the function completes, it removes itself from the dependency map and returns the Syringe object.

### Sieve Of Eratosthenes (add, bind, on, copy) ###

The sieve of Eratosthenes is a simple, ancient algorithm for finding all prime numbers up to any given limit. It does so by iteratively marking as composite (that is, not prime) the multiples of each prime, starting with all multiples of 2. 

For this example we're going to implement two slightly different ways of recursively processing the data and see which one is more performant. First we create a processor that sieves the data using `reduce`:

```javascript
Syringe.add('reduce', function (proc, arr, cnt) {

    if ((cnt = cnt || 1) > Math.sqrt(arr.length)) {
        return 1 === arr[0] && arr.shift(), arr;
    }

    return proc(arr.reduce(function (prv, cur, idx, lst) {
        0 === cur % lst[cnt] && cur !== lst[cnt] || prv.push(cur);
        return prv;
    }, []), ++cnt);

}, ['reduce']);
```

Next we create an alternate processor that sieves the data using an incrementing `while` loop:

```javascript
Syringe.add('while', function (proc, arr, cnt) {

    var len = 0, newarr = [];

    if ((cnt = cnt || 1) > Math.sqrt(arr.length)) {
        return 1 === arr[0] && arr.shift(), arr;
    }
   
    while (len < arr.length) {
        arr[len] % arr[cnt] === 0 && arr[len] !== arr[cnt] || newarr.push(arr[len])        
        len++;
    }

    return proc(newarr, ++cnt);

}, ['while']);
```

Now we create a sieving function that builds the seed array and passes it to the `while` processor:

```javascript
var sieve_while = Syringe.on(['while'], function (proc, to) {

    to = to || 10;
    var n = 1, arr = [];
    while (to--) arr[to] = n++;      

    return proc(arr.reverse());

});
```

We can copy `sieve_while` and create an alternate sieving function that uses the `reduce` processor:

```javascript
var sieve_reduce = Syringe.copy(['reduce'], sieve_while);
```

Finally, let's ask both to return all prime numbers between 1 and 10,000 and see what happens:

```javascript
console.time('sieve while');

console.log(sieve_while(10000));    // Logs:
                                    //      [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41 ... ]
console.timeEnd('sieve while');     // Logs:
                                    //      sieve while: 80ms


console.time('sieve reduce');

console.log(sieve_reduce(10000));   // Logs:
                                    //      [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41 ... ]

console.timeEnd('sieve reduce');    // Logs:
                                    //      sieve reduce: 120ms
```

The `while` processor appears to be considerably more performant!

###  Fibonacci Number (add, on, remove, wrap, get)

The Fibonacci sequence is a numeric list where the first two numbers are 0 and 1 and each subsequent number is the sum of the previous two. The following example describes a simple function that calculates the Fibonacci value of a specific number.

```javascript
var fib = function () {
    var fn = Syringe.on(['store'], function (store, a) {
        var res = store[a];
        if ('number' !== typeof res) {
            res = fn(a - 1) + fn(a - 2);
            store[a] = res;
        }
        return res;
    });
    return fn;
}();
```

To improve performance, the storage of each preceding number is held inside the dependency map:

```javascript
Syringe.add('store', [0, 1]);
```

In the Sieve Of Eratosthenes example we bookended the bound function with a console timer to determine the overall performance of the operation. In this example we'll use Syringe to wrap our bound function with a timer in order to produce a new function:

```javascript
fib = Syringe.wrap(fib, function (fn, num, name) {

    var start, stop, ret;

    start   = (new Date()).getTime();
    ret     = fn();
    stop    = (new Date()).getTime();

    this.remove('log.' + name)
        .add('log.' + name, 'The ' + name + ' function took ' + (stop - start) + 'ms');

    return ret;
});
```

Now we execute the function, providing an argument that specifies the number for which we want know the Fibonacci value, and the name of the function for logging purposes:

```javascript
fib(100, 'fib');    // Returns:
                    //      55

Syringe.get('log'); // Returns: 
                    //      {
                    //          fib: "The fib function took 11ms"
                    //      }
```

## License

Syringe is freely distributable under the terms of the MIT license.