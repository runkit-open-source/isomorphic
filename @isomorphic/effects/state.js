
const hasOwnProperty = Object.prototype.hasOwnProperty;
const NameAttribute = Symbol("StateNameAttribute");
const ReplaceChildEvent = "replace-child";


const type = Symbol("type");

module.exports = state;

function state(name)
{
    return name;
}

state.NameAttribute = NameAttribute;

state.type = type;
state.effect = Symbol("effect");

state.on = function on(name)
{
    return name;
}

state.state = state;

state.machine = function machine([name], states)
{
    if (arguments.length < 2)
        return states => machine([name], states)

    return Object.defineProperties(function constructor(data)
    {
        const typed = { children: { }, state: "initial", ...data, [type]: constructor };
        const init = states["init"];

        return init ? init(typed) : typed;
    }, { "name": { value: name }, "update": { value: update } });

    function update (record, event)
    {
        const { state } = record;
        const events = states[state];

        if (event.name !== ReplaceChildEvent)
        {
            if (!hasOwnProperty.call(events, event.name))
                if (event.name.toString().startsWith("#"))
                    return record;
                else
                    throw new Error(`State ${name} can't handle event ${event.name.toString()}.`);
console.log("RETURN");
            return states[state][event.name](record, event);
        }

        const { key, child } = event.data;
        const { children } = record;
console.log("KEY: " + key, children);
        const previousChildState = children[key].state;
        const proposedChildState = child.state;

        const updatedChildren = { ...children, [key]: child };
        const updatedRecord = { ...record, children: updatedChildren };

        if (previousChildState === proposedChildState)
            return updatedRecord;

        const stateChange = `#${key}.${proposedChildState}`;

        return update(updatedRecord, { ...event, name:stateChange });
    } 
}

module.exports = state;

state.debug = function (state)
{
    return base(state).name + "[" + attrs(state)[NameAttribute] + "]";
}
