$(document).ready(function () {

	module("New");

	// Get the number of "own" properties in an object.
	var getPropSize = function (obj) {
		var size = 0,
			key;
		for (key in obj) {
			if ({}.hasOwnProperty.call(obj, key)) size++;
		}
		return size;
	};

	test("new syringe", 2, function () {
		var syr = Syringe.create();
		equal('object', typeof syr, 'object should be returned.');
		equal(getPropSize(syr.get()), 0, 'object should be empty.');
	});

	test("new syringe with props map", 2, function () {
		var syr = Syringe.create({
			'data': 'somedata'
		});
		equal(typeof syr, 'object', 'object should be returned.');
		equal(getPropSize(syr.get()), 1, 'object should have one property.');
	});

	test("new syringe with verified props map", 1, function () {
		var syr = Syringe.create({
			'data': 'somedata'
		});
		equal(syr.get('data'), 'somedata', 'data should be set correctly.');
	});

	test("new syringe with verified deep props map", 1, function () {
		var syr = Syringe.create({
			'data': {
				'first': {
					'second': 'done'
				}
			}
		});
		equal(syr.get('data.first.second'), 'done', 'deep data should be set correctly.');
	});

	module("Add");

	test("add a new shallow property", 1, function () {
		var syr = Syringe.create();
		syr.add('data', 'ok')
		equal(syr.get('data'), 'ok', 'shallow data should be set correctly.');
	});

	test("add a new deep property", 1, function () {
		var syr = Syringe.create();
		syr.add('data.first.second', 'done')
		equal(syr.get('data.first.second'), 'done', 'deep data should be set correctly.');
	});

	test("add a new property map with deep and shallow items", 2, function () {
		var syr = Syringe.create();
		syr.add({
			'data': {
				'first': {
					'second': 'done'
				}
			},
			'data2': {}
		})
		equal(syr.get('data.first.second'), 'done', 'deep data should be set correctly.');
		equal(typeof syr.get('data2'), 'object', 'object should be returned.');
	});

	test("add a multiple property maps with deep and shallow items from an array", 4, function () {
		var syr = Syringe.create();
		syr.add([{
			'data': {
				'first': {
					'second': 'done'
				}
			},
			'data2': {}
		}, {
			'data3': {
				'first': {
					'second': 'done'
				}
			},
			'data4': {}
		}])
		equal(syr.get('data.first.second'), 'done', 'deep data should be set correctly.');
		equal(syr.get('data3.first.second'), 'done', 'deep data should be set correctly.');
		equal(typeof syr.get('data2'), 'object', 'object should be returned.');
		equal(typeof syr.get('data4'), 'object', 'object should be returned.');
	});

	test("add deep method with binding", 1, function () {
		var syr = Syringe.create();
		syr.add({
			'first': {
				'second': 'done'
			}
		});
		syr.add('func', function (data, msg) {
			return msg + ' - ' + data;
		}, ['first.second']);
		equal(syr.exec('func', ['hello world']), 'hello world - done', 'data from bound method should be returned.');
	});

	test("add constructor function with deep binding", 1, function () {
		var syr = Syringe.create();
		syr.add({
			'first': {
				'second': 'done'
			}
		});

		var Func = function (data, msg) {
			this.data = data;
			this.msg = msg;
		}

		Func.prototype.say = function () {
			return this.msg + ' - ' + this.data;
		};

		syr.add('Func', Func, ['first.second']);

		var F = (syr.get('Func'));
		var f = new F('hello world');

		equal(f.say(), 'hello world - done', 'data from bound method should be returned.');
	});

	test("add multiple constructor functions with deep binding", 2, function () {
		var syr = Syringe.create();
		syr.add({
			'first': {
				'second': 'done'
			},

			'third': {
				'fourth': 'done and done'
			},

			'fifth': {
				'sixth': 'over and out'
			}

		});

		var Func1 = function (data, msg1) {
			this.data = data;
			this.msg1 = msg1;
		}

		Func1.prototype.say = function () {
			return this.msg1 + ' - ' + this.data;
		};

		var Func2 = function (data1, data2, msg1, msg2, msg3) {
			this.data1 = data1;
			this.data2 = data2;
			this.msg1 = msg1;
			this.msg2 = msg2;
			this.msg3 = msg3;
		}

		Func2.prototype.say = function () {
			return this.msg1 + ' ' + this.msg2 + ' ' + this.msg3 + ' - ' + this.data1 + ' - ' + this.data2;
		};

		syr.add('Func1', Func1, ['first.second']);
		syr.add('Func2', Func2, ['third.fourth', 'fifth.sixth']);

		var F1 = (syr.get('Func1'));
		var f1 = new F1('hello world');

		var F2 = (syr.get('Func2'));
		var f2 = new F2('goodbye', 'cruel', 'world');

		equal(f1.say(), 'hello world - done', 'data from first bound method should be returned.');
		equal(f2.say(), 'goodbye cruel world - done and done - over and out', 'data from second bound method should be returned.');
	});

	module("Set");

	test("set shallow props of non-existant item", 1, function () {
		var syr = Syringe.create();
		throws(function () {
				syr.set('data', 'ok');
			},
			Error, "must throw error to pass.");
	});

	test("set deep props of non-existant item", 1, function () {
		var syr = Syringe.create();
		throws(function () {
				syr.set('first.second.third', 'ok');
			},
			Error, "must throw error to pass.");
	});

	test("set shallow props of existing item", 1, function () {
		var syr = Syringe.create();
		syr.add('data', false);
		syr.set('data', 'ok');
		equal(syr.get('data'), 'ok', 'shallow data should be set correctly.');
	});

	test("set deep props of existing item", 1, function () {
		var syr = Syringe.create({
			'data': {
				'first': {
					'second': 'done'
				}
			}
		});
		syr.set('data.first.second', 'ok');
		equal(syr.get('data.first.second'), 'ok', 'deep data should be set correctly.');
	});

	test("set shallow props of existing item where value is undefined", 1, function () {
		var syr = Syringe.create();
		syr.add('data');
		syr.set('data', 'ok');
		equal(syr.get('data'), 'ok', 'shallow data should be set correctly.');
	});

	test("set deep props of existing item where value is undefined", 1, function () {
		var syr = Syringe.create();
		syr.add('first.second.third');
		syr.set('first.second.third', 'ok');
		equal(syr.get('first.second.third'), 'ok', 'shallow data should be set correctly.');
	});

	test("add deep method with binding", 2, function () {

		var syr = Syringe.create();
		syr.add({
			'first': {
				'second': 'done'
			},
			'third': {
				'fourth': 'done and done'
			}
		});
		syr.add('func', function (data, msg) {
			return msg + ' - ' + data;
		}, ['first.second']);

		equal(syr.exec('func', ['hello world']), 'hello world - done', 'data from bound method should be returned.');

		syr.set('func', function (data, msg) {
			return msg + ' - ' + data;
		}, ['third.fourth']);

		equal(syr.exec('func', ['hello world']), 'hello world - done and done', 'data from bound method should be returned.');
	});

	module("Remove");

	test("remove shallow props", 2, function () {
		var syr = Syringe.create({
			'data': {
				'first': {
					'second': 'done'
				},
				'other': {}
			},
			'data2': {}
		});
		syr.remove('data');
		strictEqual(syr.get('data'), false, 'targeted data should be removed.');
		equal(typeof syr.get('data2'), 'object', 'siblings of targeted data should not be removed.');
	});

	test("remove deep props", 3, function () {
		var syr = Syringe.create({
			'data': {
				'first': {
					'second': 'done'
				},
				'other': {}
			},
			'data2': {}
		});
		syr.remove('data.first');
		strictEqual(syr.get('data.first'), false, 'targeted deep data should be removed.');
		equal(typeof syr.get('data.other'), 'object', 'siblings of targeted data should not be removed.');
		equal(typeof syr.get('data2'), 'object', 'siblings of ancestor of targeted data should not be removed.');
	});

	test("remove multiple deep props", 4, function () {
		var syr = Syringe.create({
			'data': {
				'first': {
					'second': 'done'
				},
				'other': {}
			},
			'data2': {},
			'data3': {
				'third': {}
			}
		});

		syr.remove(['data.first', 'data3.third']);

		strictEqual(syr.get('data.first'), false, 'targeted deep data should be removed.');
		strictEqual(syr.get('data3.third'), false, 'targeted deep data should be removed.');

		equal(typeof syr.get('data.other'), 'object', 'siblings of targeted data should not be removed.');
		equal(typeof syr.get('data2'), 'object', 'siblings of ancestor of targeted data should not be removed.');
	});

	module("Bind");

	test("bind an anonymous method, no context", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});
		var f = syr.bind(['data'], function (data, args) {
			return 'process is ' + data;
		});
		equal(f(), 'process is done', 'bound function returns injected data.');
	});

	test("bind an anonymous method, with context", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		var f = syr.bind(['data'], function (data, args) {
			return this.example + ' process is ' + data;
		}, {
			'example': 'test'
		});

		equal(f(), 'test process is done', 'bound function returns injected data.');
	});

	test("bind a named method, with no context", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		syr.bind('f', ['data'], function (data, args) {
			return 'process is ' + data;
		});

		equal(f(), 'process is done', 'bound function returns injected data.');
	});

	test("bind a named method, with context", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		var obj = {
			'first': {'second': 'and done'}
		};
		syr.bind('x.f', ['data'], function (data, args) {
			return 'process is ' + data + ' ' + this.second;
		}, obj.first);

		equal(x.f(), 'process is done and done', 'bound function returns injected data.');
	});

	test("bind a named method, with context, that contains the entire registry", 2, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		var obj = {
			'first': {}
		};
		syr.bind('x.f', ['*', 'data'], function (map, data, args) {
			return {
				data: 'process is ' + data,
				map: map
			}
		}, obj.first);

		equal(x.f().data, 'process is done', 'bound function returns injected data.');
		equal(x.f().map, syr.get(), 'bound function returns entire map.');
	});

	test("bind a named method, with context, that contains the current Syringe object", 2, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		var obj = {
			'first': {}
		};
		syr.bind('x.f', ['data', 'this'], function (data, syr, args) {

			return {
				id: syr.id,
				data: data
			}

		}, obj.first);

		equal(x.f().id, syr.id, 'bound function returns injected data.');
		equal(x.f().data, 'done', 'bound function returns registry object.');
	});

	test("bind a named method, with context, that contains an item from the global object", 1, function () {
		
		var syr = Syringe.create();
		
		var obj = {
			'first': {}
		};

		window.obj2 = {
			'data': 'done'
		};

		syr.bind('x.f', ['global:obj2.data'], function (data) {

			return {
				data: data
			}

		}, obj.first);

		equal(x.f().data, 'done', 'bound function returns registry object.');
	});

	test("bind an anonymous method, no context, from a property map", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});
		var f = syr.bind({
			bindings: ['data'],
			fn: function (data, args) {
				return 'process is ' + data;
			}
		});
		equal(f(), 'process is done', 'bound function returns injected data.');
	});

	test("bind an anonymous method, with context, from property map", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});
		var f = syr.bind({
			bindings: ['data'],
			fn: function (data, args) {
				return this.example + ' process is ' + data;
			},
			ctx: {
				'example': 'test'
			}
		});
		equal(f(), 'test process is done', 'bound function returns injected data.');
	});

	test("bind a named method, with no context, from property map", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});
		syr.bind({
			name: 'f',
			bindings: ['data'],
			fn: function (data, args) {
				return 'process is ' + data;
			}
		});
		equal(f(), 'process is done', 'bound function returns injected data.');
	});

	test("bind a named method, with context, from property map", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		var obj = {
			'first': {'second': 'and done'}
		};
		syr.bind({
			name: 'x.f',
			bindings: ['data'],
			fn: function (data, args) {
				return 'process is ' + data + ' ' + this.second;
			},
			ctx: obj.first

		});
		equal(x.f(), 'process is done and done', 'bound function returns injected data.');
	});

	test("bind a named method, with no context, from property map, to a specified target", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});
		var target = {};
		syr.bind({
			name: 'f',
			bindings: ['data'],
			fn: function (data, args) {
				return 'process is ' + data;
			},
			target: target
		});
		equal(target.f(), 'process is done', 'bound function returns injected data.');
	});

	test("bind a named method, with context, from property map, to a specified target", 1, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		var obj = {
			'first': {'second': 'and done'}
		};

		var target = {};

		syr.bind({
			name: 'x.f',
			bindings: ['data'],
			fn: function (data, args) {
				return 'process is ' + data + ' ' + this.second;
			},
			target: target,
			ctx: obj.first

		});
		equal(target.x.f(), 'process is done and done', 'bound function returns injected data.');
	});

	test("bind a named method, with context, from property map, that contains the entire registry", 2, function () {
		var syr = Syringe.create({
			'data': 'done'
		});
		var obj = {
			'first': {'second': 'and done'}
		};
		syr.bind({
			name: 'x.f',
			bindings: ['*', 'data'],
			fn: function (map, data, args) {
				return {
					data: 'process is ' + data + ' ' + this.second,
					map: map
				}
			},
			ctx: obj.first

		});
		equal(x.f().data, 'process is done and done', 'bound function returns injected data.');
		equal(x.f().map, syr.get(), 'bound function returns entire map.');
	});

	test("bind a named method, with context, from property map, that contains the current Syringe object", 2, function () {
		var syr = Syringe.create({
			'data': 'done'
		});

		var obj = {
			'first': {
				'second': 'and done'
			}
		};

		syr.bind({
			name: 'x.f',
			bindings: ['data', 'this'],
			fn: function (data, syr, args) {
				return {
					id: syr.id,
					data: data + ' ' + this.second
				}
			},
			ctx: obj.first

		});

		equal(x.f().id, syr.id, 'bound function returns injected data.');
		equal(x.f().data, 'done and done', 'bound function returns registry object.');
	});

	test("bind a named method, with context, from property map, that contains items from the global object", 1, function () {
		var syr = Syringe.create();

		var obj = {
			'first': {
				'second': 'and done'
			}
		};

		window.obj2 = {
			'data': 'done'
		};

		syr.bind({
			name: 'x.f',
			bindings: ['global:obj2.data', 'this'],
			fn: function (data, args) {
				return {
					data: data + ' ' + this.second
				}
			},
			ctx: obj.first

		});

		equal(x.f().data, 'done and done', 'bound function returns registry object.');
	});

	module("Exec");

	test("directly execute a registry method", 1, function () {
		var syr = Syringe.create({
			'f': function (arg1, arg2) {
				return this.example + ' ' + arg1 + ' is ' + arg2
			}
		});

		equal(syr.exec('f', ['process', 'done'], {
			'example': 'test'
		}), 'test process is done', 'executed function returns data.');
	});

	test("directly execute a registry method with context but no arguments", 1, function () {

		var syr = Syringe.create({
			'f': function () {
				return this.example
			}
		});

		equal(syr.exec('f', [], {
			'example': 'test'
		}), 'test', 'executed function returns data.');
	});

	test("directly execute a registry with injected propeties", 1, function () {

		var syr = Syringe.create({
			'data': 'test'
		});

		syr.add('f', function (d, arg1, arg2) {
			return d + ' ' + arg1 + ' is ' + arg2;
		}, ['data']);

		equal(syr.exec('f', ['process', 'done']), 'test process is done', 'executed function returns data.');
	});

	test("directly execute a registry with injected propeties and context", 1, function () {

		var syr = Syringe.create({
			'data': 'binding'
		});

		syr.add('f', function (d, arg1, arg2) {
			return this.example + ' ' + arg1 + ' is ' + arg2 + ' with ' + d;
		}, ['data']);

		equal(syr.exec('f', ['process', 'done'], {
			'example': 'test'
		}), 'test process is done with binding', 'executed function returns data.');
	});

	module("Wrap");

	test("wrap an existing method", 1, function () {
		var syr = Syringe.create({
			'data': 'foo',
			'data2': 'bar'
		});

		var f = syr.bind(['data', 'data2'], function (d, d2, arg, arg2) {
			return d + ' ' + d2 + ' ' + arg + ' ' + arg2;
		});

		var f2 = function (fn, arg) {
			return fn(arg, this.example);
		};

		f2 = syr.wrap(f, f2, {
			'example': 'test'
		});

		equal(f2('woo'), 'foo bar woo test', 'wrapped function returns injected data and expected arguments.');
	});

	module("Separator");

	test("change the separator character to a valid alternative", 3, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.separator('#');
		equal(syr.get('first#second#third'), 'done', 'executed function returns data');

		syr.separator('/');
		equal(syr.get('first/second/third'), 'done', 'executed function returns data');

		syr.separator('*');
		equal(syr.get('first*second*third'), 'done', 'executed function returns data');

		syr.separator('.');
	});

	test("change the separator character to an invalid alternative", 4, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});
		syr.separator(' ');
		equal(syr.get('first second third'), false, 'executed function does not return data');

		syr.separator('A');
		equal(syr.get('firstAsecondAthird'), false, 'executed function does not return data');

		syr.separator('1');
		equal(syr.get('first1second1third'), false, 'executed function does not return data');

		syr.separator('##');
		equal(syr.get('first##second##third'), false, 'executed function does not return data');

		syr.separator('.');
	});

	test("allow different separators between instances", 3, function () {

		var syr1 = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		var syr2 = syr1.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr1.separator('#');
		syr2.separator('*');

		equal(syr1.get('first#second#third'), 'done', 'executed function returns data');
		equal(syr2.get('first*second*third'), 'done', 'executed function returns data');

		syr2.separator('.');

		equal(syr2.get('first.second.third'), 'done', 'executed function returns data');
	});

	module("Copy");

	test("copy an existing method", 1, function () {
		var syr = Syringe.create({
			'data': 'foo',
			'data2': 'bar'
		});

		var f = syr.bind(['data'], function (d) {
			return d;
		});

		var f2 = function (d) {
			return d;
		};

		f2 = syr.copy(['data2'], f);

		equal(f2('woo'), 'bar', 'bound function returns injected data.');
	});

	module("Fetch", {
		setup: function () {

			this.server = sinon.fakeServer.create();

			// Return an object
			this.server.respondWith("GET", "/syringe/fetch1", [200, {
					"Content-Type": "application/json"
				},
				JSON.stringify({
					foo: 'bar'
				})
			]);

			// Return an array
			this.server.respondWith("GET", "/syringe/fetch1arr", [200, {
					"Content-Type": "application/json"
				},
				JSON.stringify([{
					foo: 'bar'
				}])
			]);

			this.server.autoRespond = true;

		},
		teardown: function () {
			this.server.restore();

		}
	});

	asyncTest("fetch and bind an item", 1, function () {

		var syr = Syringe.create();

		syr.fetch([{
			path: '/syringe/fetch2',
			bind: 'data2'
		}, {
			path: '/syringe/fetch1',
			bind: 'data1'
		}], {
			'success': function () {
				ok((typeof this.get('data1') === 'object' && this.get('data1.foo') === 'bar'), "asynch data fetched and bound correctly");
				start();
			}
		});
	});

	asyncTest("fetch and bind an item to an existing path", 1, function () {

		var syr = Syringe.create({
			data1: { 'woo': true },
			data2: {}
		});

		syr.fetch([{
			path: '/syringe/fetch2',
			bind: 'data2'
		}, {
			path: '/syringe/fetch1',
			bind: 'data1'
		}], {
			'success': function () {
				ok((typeof this.get('data1') === 'object' && this.get('data1.foo') === 'bar' && this.get('data1.woo') === true), "asynch data fetched and bound correctly");
				start();
			}
		});
	});

	asyncTest("fetch and bind an array item to an existing path", 1, function () {

		var syr = Syringe.create({
			data1: { 'woo': true }
		});

		syr.fetch([{
			path: '/syringe/fetch1arr',
			bind: 'data1'
		}], {
			'success': function () {
				ok((typeof this.get('data1') === 'object' && this.get('data1.json').length && this.get('data1.woo') === true), "asynch data fetched and bound correctly");
				start();
			}
		});
	});

	module("Mixin");

	test("add a mixin to the prototype", 1, function () {
		var syr = Syringe.create({
			'data': 'foo',
			'data2': 'bar'
		});

		var id = syr.id;

		syr.mixin({
			'func': function () {
				return this.get('data');
			}
		});

		equal(syr.func(), 'foo', 'mixin returns Syringe object');
	});

	module("Events");

	test("Listen for any add event", 2, function () {

		var syr = Syringe.create({
			'data': 'foo'
		});

		syr.listen('add', function (type, name, value) {
			equal(name, 'data2', 'Add event fires and returns correct name');
			equal(value, 'bar', 'Add event fires and returns correct value');
		});		

		syr.add('data2', 'bar');		
	});

	test("Listen for any set event", 2, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('set', function (type, name, value) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
			equal(value, 'done and done', 'Set event fires and returns correct value');
		});		

		syr.set('first.second.third', 'done and done');		
	});

	test("Listen for any get event", 1, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('get', function (type, name) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
		});		

		syr.get('first.second.third');		
	});

	test("Listen for any remove event", 1, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('remove', function (type, name) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
		});		

		syr.remove('first.second.third');		
	});

	test("Listen for a scoped add event", 2, function () {

		var syr = Syringe.create({
			'data': 'foo'
		});

		syr.listen('add:data2', function (type, name, value) {
			equal(name, 'data2', 'Add event fires and returns correct name');
			equal(value, 'bar', 'Add event fires and returns correct value');
		});		

		syr.add('data2', 'bar');		
	});

	test("Listen for a scoped set event", 4, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('set:first.second.third', function (type, name, value) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
			equal(value, 'done and done', 'Set event fires and returns correct value');
		});		

		syr.listen('set:third', function (type, name, value) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
			equal(value, 'done and done', 'Set event fires and returns correct value');
		});		

		syr.set('first.second.third', 'done and done');		
	});

	test("Listen for any get event", 2, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('get:first.second.third', function (type, name) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
		});		

		syr.listen('get:third', function (type, name) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
		});		


		syr.get('first.second.third');		
	});

	test("Listen for a scoped remove event", 2, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('remove:first.second.third', function (type, name) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
		});		

		syr.listen('remove:third', function (type, name) {
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
		});		

		syr.remove('first.second.third');		
	});

	test("Listen for any event", 3, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('all', function (type, name, value) {
			equal(type, 'set', 'Set event fires and returns correct name');
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
			equal(value, 'done and done', 'Set event fires and returns correct value');
		});		

		syr.set('first.second.third', 'done and done');		
	});

	test("Listen for any event", 3, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': 'done'
				}
			}
		});

		syr.listen('all:first.second.third', function (type, name, value) {
			equal(type, 'remove', 'Set event fires and returns correct name');
			equal(name, 'first.second.third', 'Set event fires and returns correct name');
			equal(value, undefined, 'Set event fires and returns correct value');
		});		

		syr.remove('first.second.third');		
	});

	module("List Operations");

	test("Process an array and return a result to the associated event", 3, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': [1,2,3]
				}
			}
		});

		syr.listen('listops:first.second.third', function (type, name) {
			equal(name, 'first.second.third', 'Listops event fires and returns correct name');
		});		

		syr.listen('listops:third', function (type, name) {
			equal(name, 'first.second.third', 'Listops event fires and returns correct name');
		});	

		syr.listops('first.second.third', function (arr) {
			arr.push(4,5,6);
		});

		var val = syr.get('first.second.third');

		deepEqual(val, [1,2,3,4,5,6], 'List operation completed successfully')		
	});

	test("Process an array and return an extended result to the associated event", 6, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': [1,2,3]
				}
			}
		});

		syr.listen('listops:first.second.third', function (type, name, arr) {
			equal(name, 'first.second.third', 'Listops event fires and returns correct name');
			deepEqual(arr, [1,2], 'Listops event fires and returns processed list');

		});		

		syr.listen('listops:third', function (type, name, arr, val) {
			equal(name, 'first.second.third', 'Listops event fires and returns correct name');
			deepEqual(arr, [1,2], 'Listops event fires and returns processed list');
			equal(val, 3, 'Listops event fires and returns correct value');

		});	

		syr.listops('first.second.third', function (arr) {
			return arr.pop();
		});

		var val = syr.get('first.second.third');

		deepEqual(val, [1,2], 'List operation completed successfully')		
	});

	test("Process a non-array and throw an error", 1, function () {

		var syr = Syringe.create({
			'first': {
				'second': {
					'third': {'a': 1, 'b': 2, 'c': 3}
				}
			}
		});

		throws(function () {
				syr.listops('first.second.third', function (arr) { arr.pop(); });
			},
			Error, "must throw error to pass.");			
	});

});