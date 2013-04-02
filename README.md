# syringe.js#

![syringe](https://github.com/holt/syringe/blob/master/img/syringe.png?raw=true "Just a little pin prick - there'll be no more "AAAAAAAAH!" ") Syringe is a tiny little dependency injection framework that allows you to bind data deterministically to your functions and methods. No more worrying about passing data directly or indirectly, or relying on the lexical scope - Syringe will vaccinate your operations ahead of time.

Now, let's roll up our sleeves and begin shall we?

## Examples ##


### Initialization and Registration

Create an empty new syringe:
```javascript
var mySyringe = syringe();
```
... or create one loaded up with some with some dependencies:

```javascript
var mySyringe = syringe({
   "$"   : jQuery,
   "bb"  : Backbone
});
```

Register some additional dependencies, one at a time:
```javascript
mySyringe.register('Modernizr', Modernizr);
```
... or in bulk:

```javascript
mySyringe.register({
   "hb"  : Handlebars,
   "fn"  : function (name) { return 'Hello ' + name + '!'; }
});
```

### Binding


You can bind your methods in a number of different ways. As a function expression:

```javascript
var talk = mySyringe.bind(function ($, fn, name) {      
   $('body').append('<p>' + fn(name) + '</p>');
});
```
... as an object reference:

```javascript
mySyringe.bind('talk', function ($, fn, name) {      
   $('body').append('<p>' + fn(name) + '</p>');
});
```
... as a progressively constructed object reference:

```javascript
mySyringe.bind('talk.to.this.guy', function ($, fn, name) {
   $('body').append('<p>' + fn(name) + '</p>');
});
```

... as a set:

```javascript
mySyringe.bind({
   "talk": function ($, fn, name) {      
      $('body').append('<p>' + fn(name) + '</p>');
   },
   "shout": function ($, fn, name) {      
      $('body').append('<p><strong>' + fn(name) + '!!!</strong></p>');
   },
});
```

### Execution

Run the function:

```javascript
talk('Mike');  // Appends "Hello Mike!" to the page.
```

Change the `fn` dependency to use a different function:

```javascript
mySyringe.set("fn", function (name) { return 'Goodbye ' + name + '!'; })
````

Run the function again:

```javascript
talk('Paul');  // Appends "Goodbye Paul!" to the page.
```