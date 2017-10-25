
var Call = (Function.prototype.call).bind(Function.prototype.call);

var Map = global.Map || require("native-map");

var MapGet = Map.prototype.get;
var MapSet = Map.prototype.set;

var MathLog = Math.log;
var MathLN10 = Math.LN10;

var types = require("./types");

module.exports = function(anObject)
{
    var context = { UIDs: new Map(), objects:[], types: new Map() };
    var UID = toObjectSerialization(anObject, context);
    var list = context.tail;

    while (list)
    {
        completeObjectSerialization(list.object, list.UID, context);

        list = list.next;
    }

    var UIDs = context.UIDs;
    var serializedObjects = [];

    analyzeUIDs(UIDs).forEach(function(aUID)
    {
        var serializedLocation = aUID.serializedLocation;
        var serializedObject = context.objects[serializedLocation];
        serializedObjects[aUID.__UNIQUE_ID] = serializedObject;
    });

    return { index:UID, objects:serializedObjects };
};

function toObjectSerialization(anObject, aContext, aUIDHint, hasHint)
{
    if (anObject === null)
        return -1;

    var type = typeof anObject;

    if (type === "undefined")
        return -2;

    if (type === "number")
    {
        // NaN
        if (anObject !== anObject)
            return -3;

        // -0
        if (anObject === 0 && 1 / anObject === -Infinity)
            return -4;

        // -Infinity
        if (anObject === -Infinity)
            return -5;

        // Infinity
        if (anObject === Infinity)
            return -6;
    }

    var UIDs = aContext.UIDs;
    var UID = UIDForValue(anObject, UIDs);

    if (UID)
        return UID.increment(); // iF the UID already exists the object has already been encoded.

    UID = new UIDWrapper(hasHint && aUIDHint);

    Call(MapSet, UIDs, anObject, UID);

    if (type === "boolean" ||
        type === "number" ||
        type === "string")
        aContext.objects[UID.serializedLocation] = anObject;
    else
    {
        aContext.objects[UID.serializedLocation] = null;

        var tail = { UID: UID, object: anObject };

        if (aContext.tail)
            aContext.tail.next = tail;

        aContext.tail = tail;
    }

    return UID;
}

function completeObjectSerialization(anObject, aUID, aContext)
{
    var serializer = types.getSerializer(anObject, aContext);
    aContext.objects[aUID.serializedLocation] = serializer(toObjectSerialization);
}

function UIDForValue(aValue, UIDs)
{
    return Call(MapGet, UIDs, aValue);
}


var UIDCount = 0;

function UIDWrapper(potentialKeyID)
{
    this.serializedLocation = UIDCount;
    this.references = 1;
    this.potentialKeyID = typeof potentialKeyID === "string" && potentialKeyID;
    UIDCount++;
}

UIDWrapper.prototype.toJSON = function()
{
    return this.__UNIQUE_ID;
};

UIDWrapper.prototype.increment = function()
{
    this.references += 1;
    return this;
};

function analyzeUIDs(UIDsMap)
{
    var UIDs = Array.from(UIDsMap.values());

    UIDs.sort(function(a, b)
    {
        return b.references - a.references;
    });

    var offset = 0;

    UIDs.forEach(function(aUID, anIndex)
    {
        var potentialID = anIndex - offset;
        var potentialKeyID = aUID.potentialKeyID;

        var canStoreAsString = typeof potentialKeyID === "string";
        var isShorterAsString = canStoreAsString && MathLog(potentialID) / MathLN10 > potentialKeyID.length + 2;

        if (isShorterAsString)
        {
            aUID.__UNIQUE_ID = potentialKeyID;
            offset++;
        }
        else
            aUID.__UNIQUE_ID = potentialID;
    });

    return UIDs;
}