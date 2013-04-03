# syringe.js #

![syringe](https://github.com/holt/syringe/blob/master/img/syringe.png?raw=true "Just a little pin prick... there'll be no more "AAAAAAAAH!" ") Syringe is a teeny-tiny (~1.5Kb _sans ECMAScript 5 shims_) little [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) framework that allows you to assign data deterministically to your functions and methods. No more worrying about passing data directly, indirectly, or relying on the lexical scope as Syringe can vaccinate your operations ahead of time!

Now, let's roll up our sleeves and begin shall we?

## Examples ##


### Initialization and Registration

Create a sterile new syringe:
```javascript
var mySyringe = syringe();
```
... or create one loaded up with some with some globally available dependencies:

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
      return a() + a() + "-" + a() + "-" + a() + "-" + a() + "-" + a() + a() + a();
   }()),
   'stat': 0
});
```

### Binding


You can bind your methods in a number of different ways. 

... as a function expression:

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
... as an object reference:

```javascript
mySyringe.on('accessEvent', function (uuid, tzone, stat, props) { /* ... as above */ });
```
... as a _deep_ object reference (which is dynamically constructed if the object doesn't already exist):

```javascript
mySyringe.on('security.access.event', function (uuid, tzone, stat, props) { /* ... as above */ });
```
... as an object reference within a provided context:

```javascript
mySyringe.on('event', function (uuid, tzone, stat, props) { /* ... as above */ }, security.access);
```
... as a map:

```javascript
mySyringe.on({
   'accessEvent'  : function (uuid, tzone, stat, props) { /* ... as above  */ },
   'otherEvent1'  : function ($, props) { /* ... yet more code */ },
   'otherEvent2'  : function ($, props) { /* ... yet more code */ }
});
```
... in a chain:

```javascript
mySyringe.on('accessEvent', function (uuid, tzone, stat, props) { /* ... as above  */ })
   .on('otherEvent1', function ($, props) { /* ... yet more code */ })
   .on('otherEvent2', function ($, props) { /* ... yet more code */ });
```

... or asynchronously:

```javascript
mySyringe.fetch({
   '_': {
      'path': 'http://underscorejs.org/underscore-min.js',
      'bind': '_'
   },
   'bb': {
      'path': 'http://backbonejs.org/backbone-min.js',
      'bind': 'Backbone'
   },
   '$': {
      'path': 'http://code.jquery.com/jquery-1.9.1.min.js',
      'bond': 'jQuery'
   }
}, function () {
   // The context for the callback is `mySyringe`
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