const program = require("@isomorphic/program");

const { attrs } = require("./generic-jsx");
const EmitterPromise = require("./emitter-promise");

const { state, type } = require("./state");
const machine = require("./machine");
const update = require("./update");
const metadata = require("./metadata");

const { isArray } = Array;


module.exports = function effectsProgram (initial, pull)
{
    return EmitterPromise(function(emitter, resolve, reject)
    {
        const previous = { status: null };

        const children = { "root": initial };//(isArray(initial) ? initial : [initial]);
        const asyncPush = (...args) => push(...args);
        
        const state = machine({ push: asyncPush, children });
        console.log(debug(state));
        const push = program(state, update, function (state)
        {
        console.log(debug(state));//,metadata(state).effects);
            if (pull)
                pull(state);

            const { status, result } = attrs(state);

            // We don't need to hasOwnProperty here, because if "result"
            // isn't in attributes, we still want to resolve to undefined.
            if (status === "finished")
                return resolve(result)

            if (status === "error")
                return reject(result);

            if (status !== previous.status)
            {
                previous.status = status;

                setImmediate(() => emitter.emit(status, result));
            }
        });

        push({ name:"start", timestamp: Date.now() });
    });
}

function debug(node, lasts = [])
{
    const name = node[type].name;
    const { children, state } = node;
/*    const props = Object.keys(attributes)
        .map(key => `${key} = ${toValueString(attributes[key])}`);

    const propsString = props.length > 0 ? ` ${props.join(" ")} ` : "";
    const nonChildren = `${state.name}${propsString}`;*/
    
    const padding = branches(lasts);
    const keys = Object.keys(children);
    const childrenString = keys
        .map((key, index) => debug(children[key], lasts.concat(index === keys.length - 1)))
        .join("\n");

    return `${padding}${name} [${state}]` +
            (keys.length > 0 ? `\n${childrenString}` : "");
}

function toValueString(value)
{
    if (typeof value === "function")
        return `{ ${value.name || "ƒ"} }`;

    if (typeof value === "string")
        return `${JSON.stringify(value)}`;

    if (!Object.getPrototypeOf(value))
        return "{ { } }";

    if (typeof value === "object" && !Array.isArray(value))
        return `{ ${value.constructor.name} }`;

    return `{ ${JSON.stringify(value)} }`;
}

function branches(lasts)
{
    return lasts.map((last, index) =>
        index === lasts.length - 1 ?
            (last ? "└── " : "├── ") :
            (last ? "    " : "│   ")).join("")
}

