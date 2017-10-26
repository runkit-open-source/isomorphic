
const I = require("immutable");
const isArray = Array.isArray;
const invoker = require("./utils").invoker;

module.exports.getSerializer = getSerializer;
module.exports.getDeserializer = getDeserializer;


var GenericObject = 0;
var JustKeyValueArray = 1;
var GaplessArray = 2;
var GenericArray = 3;
var NoKeyValueSet = 4;
var GenericSet = 5;
var NoKeyValueMap = 6;
var GenericMap = 7;
// FIXME: Immutable key/values?
var ImmutableMap = 8;
var ImmutableSet = 9;
var ImmutableList = 10;


function getEncodableType(anObject)
{
    if (isArray(anObject))
    {
        var keys = Object.keys(anObject);

        if (keys.length > 0 && anObject.length === 0)
            return JustKeyValueArray;

        if (keys.length === anObject.length)
            return GaplessArray;

        return GenericArray;
    }

    if (anObject instanceof Set)
    {
        var keys = Object.keys(anObject);
        return keys.length ? GenericSet : NoKeyValueSet;
    }

    if (anObject instanceof Map)
    {
        var keys = Object.keys(anObject);
        return keys.length ? GenericMap : NoKeyValueMap;
    }

    if (I.Map.isMap(anObject))
    {
        return ImmutableMap;
    }

    if (I.List.isList(anObject))
    {
        return ImmutableList;
    }

    if (I.Set.isSet(anObject))
    {
        return ImmutableSet;
    }

    return GenericObject;
}

var serializers = [
    require("./serializers/generic-object"),
    require("./serializers/key-value-array"),
    require("./serializers/gapless-array"),
    require("./serializers/generic-array"),
    require("./serializers/pure-set"),
    require("./serializers/generic-set"),
    require("./serializers/pure-map"),
    require("./serializers/generic-map"),
    require("./serializers/pure-map"), // Immutable map can use pure-map.
    require("./serializers/pure-set"), // Immutable set can use pure-set.
    // FIXME: Lists...
];



function getSerializer(anObject, aContext)
{
    var serializedType = getEncodableType(anObject, aContext);

    return function(toObjectSerialization)
    {
        return [serializedType].concat(serializers[serializedType](anObject, aContext, toObjectSerialization));
    };
};













function getMutator(anEncodedType, aContext)
{
    if (anEncodedType === GenericObject)
        return require("./deserializers/generic-object");
    if (anEncodedType === JustKeyValueArray)
        return require("./deserializers/key-value-array");
    if (anEncodedType === GaplessArray)
        return require("./deserializers/gapless-array");
    if (anEncodedType === GenericArray)
        return require("./deserializers/generic-array");
    if (anEncodedType === NoKeyValueSet)
        return require("./deserializers/pure-set");
    if (anEncodedType === GenericSet)
        return require("./deserializers/generic-set");
    if (anEncodedType === NoKeyValueMap)
        return require("./deserializers/pure-map");
    if (anEncodedType === GenericMap)
        return require("./deserializers/generic-map");

    // Immutable Maps and Sets can use native deserialization.
    if (anEncodedType === ImmutableMap)
        return require("./deserializers/pure-map");
    if (anEncodedType === ImmutableSet)
        return require("./deserializers/pure-set");
}

function getBase(encodedType, aContext)
{
    if (aContext.options.immutable)
    {
        switch(encodedType)
        {
            case GenericObject:
            case NoKeyValueMap:
            case GenericMap:
                return [I.Map(), true];
            case JustKeyValueArray:
            case GaplessArray:
            case GenericArray:
                return [I.List(), true];
            case NoKeyValueSet:
            case GenericSet:
                return [I.Set(), true];
            default:
                throw new Error("unknown type...");
        }
    }

    switch(encodedType)
    {
        case GenericObject:
            return [{}, false];
        case JustKeyValueArray:
        case GaplessArray:
        case GenericArray:
            return [[], false];
        case NoKeyValueSet:
        case GenericSet:
            return [new Set(), false];
        case NoKeyValueMap:
        case GenericMap:
            return [new Map(), false];
        case ImmutableMap:
            return [I.Map(), true];
        case ImmutableSet:
            return [I.Set(), true];
        default:
            throw new Error("unknown type...");
    }
}

function getDeserializer(aSerializedObject, aContext)
{
    var encodedType = aSerializedObject[0];
    var base = getBase(encodedType, aContext);
    var mutator = getMutator(encodedType, aContext);

    var withMutationsFunction = base[1] ? invoker("withMutations") : withMutations;

    return function(fromObjectSerialization)
    {
        return withMutationsFunction(function(aDeserializedObject)
        {
            return mutator(aDeserializedObject, aSerializedObject, aContext, fromObjectSerialization);
        }, base[0]);
    };
};

function withMutations(aMutator, anObject)
{
    aMutator(anObject);
    return anObject;
}
