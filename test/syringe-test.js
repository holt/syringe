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

    module("Set");

    test("set shallow props of non-existant item", 1, function () {
        var syr = Syringe.create();
        raises(function () {
            syr.set('data', 'ok');
        },
        Error, "must throw error to pass.");
    });

    test("set shallow props of existing item", 1, function () {
        var syr = Syringe.create();
        syr.add('data', false);
        syr.set('data', 'ok');
        equal(syr.get('data'), 'ok', 'shallow data should be set correctly.');
    });

    test("set deep props", 1, function () {
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

    test("set deep method with binding", 1, function () {
        var syr = Syringe.create();
        syr.add({
            'first': {
                'second': 'done'
            }
        });
        syr.add('func', function (data, msg) {
            return msg + ' - ' + data;
        }, ['first.second']);
        equal('hello world - done', syr.exec('func', ['hello world']), 'data from bound method should be returned.');
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
        strictEqual(syr.get('data.first.second'), false, 'targetted data should be removed.');
        equal(typeof syr.get('data2'), 'object', 'siblings of targetted data should not be removed.');
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
        strictEqual(syr.get('data.first'), false, 'targetted deep data should be removed.');
        equal(typeof syr.get('data.other'), 'object', 'siblings of targetted data should not be removed.');
        equal(typeof syr.get('data2'), 'object', 'siblings of ancestor of targetted data should not be removed.');
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
            'first': {}
        };
        syr.bind('x.f', ['data'], function (data, args) {
            return 'process is ' + data;
        }, obj.first);

        equal(obj.first.x.f(), 'process is done', 'bound function returns injected data.');
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

});