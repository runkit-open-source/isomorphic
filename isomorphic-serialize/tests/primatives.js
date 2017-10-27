const test = require("ava");
const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const run = (aValue, t) => t.is(convert(aValue), aValue);

const primativesToTest = [
    0 ,1, 2, -1, -2,
    Infinity, -Infinity, -0,
    "Hello", "Hello World", "",
    null, undefined, NaN,
    true, false
];

primativesToTest.forEach(aValue =>
{
    test("" + aValue, t => run(aValue, t));
});
