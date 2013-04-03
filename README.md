# syringe.js #

![syringe](https://github.com/holt/syringe/blob/master/img/syringe.png?raw=true "Just a little pin prick... there'll be no more "AAAAAAAAH!" ") Syringe is a teeny-tiny little dependency injection framework that allows you to bind data deterministically to your functions and methods. No more worrying about passing data directly, indirectly, or relying on the lexical scope as Syringe can vaccinate your operations ahead of time!

Now, let's roll up our sleeves and begin shall we?

## Examples ##


### Initialization and Registration

Create a sterile new syringe:
```javascript
var mySyringe = syringe();
```
... or create one loaded up with some with some dependencies:

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
   "result": [{
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
   ]
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
   'time': (function () {
      return JSON.parse(JSON.stringify(new Date()));
   }()),
   'cond': 0
});
```

### Binding


You can bind your methods in a number of different ways. 

... as a function expression:

```javascript
var accessEvent = mySyringe.on(function (uuid, time, tzone, cond, props) {

   var state = ['Green', 'Amber', 'Orange', 'Red'][cond++];

   var GMT = tzone.result.filter(function (item) {
      return item.TimeZoneId === props.locale;
   })[0].GMT;

   if (cond < 4) mySyringe.set('cond', cond)

   return {
      'msg' : 'User "' + props.name + '" entered restricted zone at ' + time + ' GMT(' + GMT + ')',
      'id'  : uuid,
      'cond': state
   };

});

```
... as an object reference:

```javascript
mySyringe.on('accessEvent', function (uuid, time, tzone, props) { /* ... as above */ });
```
... as a _deep_ object reference (which is dynamically constructed if the object doesn't already exist):

```javascript
mySyringe.on('security.access.event', function (uuid, time, tzone, props) { /* ... as above */ });
```
... as an object reference within a provided context:

```javascript
mySyringe.on('event', function (uuid, time, tzone, props) { /* ... as above */ }, security.access);
```
... as a map:

```javascript
mySyringe.on({
   'accessEvent'  : function (uuid, time, tzone, props) { /* ... as above  */ },
   'exitEvent'    : function (uuid, time, tzone, props) { /* ... more code */ },
   'otherEvent'   : function (uuid, time, tzone, props) { /* ... more code */ }
});
```
... or in a chain:

```javascript
mySyringe.on('accessEvent', function (uuid, time, tzone, props) { /* ... as above  */ })
   .on('exitEvent', function (uuid, time, tzone, props) { /* ... more code */ })
   .on('otherEvent', function (uuid, time, tzone, props) { /* ... more code */ });
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
   'name'   : 'Doe, John',
   'locale' : 'America-Sao_Paulo'
});

// Returns: 
{
   "msg" : "User \"Doe, John\" entered restricted zone at 2013-04-03T02:44:13.196Z GMT(-2)",
   "id"  : "5418d190-c1df-7d26-82e9-6d1aab74c1f",
   "cond": "Amber"
}
```