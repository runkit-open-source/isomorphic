const test = require("ava");
const { OrderedMap } = require("immutable");

const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const fastConvert = aValue => parse(stringify(aValue, { fastMode: true }));

const run = (aValue, t) =>
{
    t.true(aValue.equals(convert(aValue)));
    t.true(aValue.equals(fastConvert(aValue)));
};

test("empty", t => run(OrderedMap(), t));

test("simple", t => run(OrderedMap([[1, true],[2, false],[3, "abc"]]), t));

test("Nested primative", t =>
{

    const value = OrderedMap([["foo", "abc"], [123, {"bar": "baz"}]]);
    const value2 = convert(value);
    t.is(value.size, value2.size);
    t.is(value.first(), value2.first());
    t.deepEqual(value.last(), value2.last());
});

test("Nested 2", t => run(OrderedMap([["foo", "abc"], OrderedMap([["bar", "baz"]])]), t));

