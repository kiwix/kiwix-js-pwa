/* Polyfill service v3.111.0
 * For detailed credits and licence information see https://github.com/financial-times/polyfill-service.
 * 
 * Features requested: Map
 * 
 * - _ESAbstract.Call, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey", "_ESAbstract.ToString", "_ESAbstract.ToPrimitive", "_ESAbstract.OrdinaryToPrimitive")
 * - _ESAbstract.CreateDataProperty, License: CC0 (required by "Map", "_ESAbstract.CreateIterResultObject")
 * - _ESAbstract.CreateMethodProperty, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyNames", "Array.prototype.includes")
 * - _ESAbstract.Get, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey", "_ESAbstract.ToString", "_ESAbstract.ToPrimitive", "_ESAbstract.OrdinaryToPrimitive")
 * - _ESAbstract.HasOwnProperty, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor")
 * - _ESAbstract.IsCallable, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey", "_ESAbstract.ToString", "_ESAbstract.ToPrimitive", "_ESAbstract.OrdinaryToPrimitive")
 * - _ESAbstract.SameValueNonNumber, License: CC0 (required by "Map", "_ESAbstract.SameValueZero")
 * - _ESAbstract.ToBoolean, License: CC0 (required by "Map", "_ESAbstract.IteratorComplete")
 * - _ESAbstract.ToObject, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyNames", "Array.prototype.includes")
 * - _ESAbstract.GetV, License: CC0 (required by "Map", "_ESAbstract.GetIterator")
 * - _ESAbstract.GetMethod, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey", "_ESAbstract.ToString", "_ESAbstract.ToPrimitive")
 * - _ESAbstract.Type, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey", "_ESAbstract.ToString", "_ESAbstract.ToPrimitive", "_ESAbstract.OrdinaryToPrimitive")
 * - _ESAbstract.CreateIterResultObject, License: CC0 (required by "Map")
 * - _ESAbstract.GetPrototypeFromConstructor, License: CC0 (required by "Map", "_ESAbstract.OrdinaryCreateFromConstructor")
 * - _ESAbstract.OrdinaryCreateFromConstructor, License: CC0 (required by "Map")
 * - _ESAbstract.IteratorClose, License: CC0 (required by "Map")
 * - _ESAbstract.IteratorComplete, License: CC0 (required by "Map", "_ESAbstract.IteratorStep")
 * - _ESAbstract.IteratorNext, License: CC0 (required by "Map", "_ESAbstract.IteratorStep")
 * - _ESAbstract.IteratorStep, License: CC0 (required by "Map")
 * - _ESAbstract.IteratorValue, License: CC0 (required by "Map")
 * - _ESAbstract.OrdinaryToPrimitive, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey", "_ESAbstract.ToString", "_ESAbstract.ToPrimitive")
 * - _ESAbstract.SameValueZero, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyNames", "Array.prototype.includes")
 * - _ESAbstract.ToInteger, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyNames", "Array.prototype.includes", "_ESAbstract.ToLength")
 * - _ESAbstract.ToLength, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyNames", "Array.prototype.includes")
 * - _ESAbstract.ToPrimitive, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey", "_ESAbstract.ToString")
 * - _ESAbstract.ToString, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor", "_ESAbstract.ToPropertyKey")
 * - _ESAbstract.ToPropertyKey, License: CC0 (required by "Map", "Symbol", "Object.getOwnPropertyDescriptor")
 * - Array.prototype.includes, License: MIT (required by "Map", "Symbol", "Object.getOwnPropertyNames")
 * - Object.getOwnPropertyDescriptor, License: CC0 (required by "Map", "Symbol")
 * - Object.isExtensible, License: CC0 (required by "Map")
 * - Object.keys, License: MIT (required by "Map", "Symbol", "Object.getOwnPropertyNames")
 * - Object.getOwnPropertyNames, License: CC0 (required by "Map", "Symbol")
 * - Symbol, License: MIT (required by "Map", "Symbol.species")
 * - Symbol.iterator, License: MIT (required by "Map", "_ESAbstract.GetIterator")
 * - _ESAbstract.GetIterator, License: CC0 (required by "Map")
 * - Symbol.species, License: MIT (required by "Map")
 * - Map, License: CC0 */

(function(self, undefined) {

    // _ESAbstract.Call
    /* global IsCallable */
    // 7.3.12. Call ( F, V [ , argumentsList ] )
    function Call(F, V /* [, argumentsList] */) { // eslint-disable-line no-unused-vars
        // 1. If argumentsList is not present, set argumentsList to a new empty List.
        var argumentsList = arguments.length > 2 ? arguments[2] : [];
        // 2. If IsCallable(F) is false, throw a TypeError exception.
        if (IsCallable(F) === false) {
            throw new TypeError(Object.prototype.toString.call(F) + 'is not a function.');
        }
        // 3. Return ? F.[[Call]](V, argumentsList).
        return F.apply(V, argumentsList);
    }
    
    // _ESAbstract.CreateDataProperty
    // 7.3.4. CreateDataProperty ( O, P, V )
    // NOTE
    // This abstract operation creates a property whose attributes are set to the same defaults used for properties created by the ECMAScript language assignment operator.
    // Normally, the property will not already exist. If it does exist and is not configurable or if O is not extensible, [[DefineOwnProperty]] will return false.
    function CreateDataProperty(O, P, V) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(O) is Object.
        // 2. Assert: IsPropertyKey(P) is true.
        // 3. Let newDesc be the PropertyDescriptor{ [[Value]]: V, [[Writable]]: true, [[Enumerable]]: true, [[Configurable]]: true }.
        var newDesc = {
            value: V,
            writable: true,
            enumerable: true,
            configurable: true
        };
        // 4. Return ? O.[[DefineOwnProperty]](P, newDesc).
        try {
            Object.defineProperty(O, P, newDesc);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // _ESAbstract.CreateMethodProperty
    // 7.3.5. CreateMethodProperty ( O, P, V )
    function CreateMethodProperty(O, P, V) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(O) is Object.
        // 2. Assert: IsPropertyKey(P) is true.
        // 3. Let newDesc be the PropertyDescriptor{[[Value]]: V, [[Writable]]: true, [[Enumerable]]: false, [[Configurable]]: true}.
        var newDesc = {
            value: V,
            writable: true,
            enumerable: false,
            configurable: true
        };
        // 4. Return ? O.[[DefineOwnProperty]](P, newDesc).
        Object.defineProperty(O, P, newDesc);
    }
    
    // _ESAbstract.Get
    // 7.3.1. Get ( O, P )
    function Get(O, P) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(O) is Object.
        // 2. Assert: IsPropertyKey(P) is true.
        // 3. Return ? O.[[Get]](P, O).
        return O[P];
    }
    
    // _ESAbstract.HasOwnProperty
    // 7.3.11 HasOwnProperty (O, P)
    function HasOwnProperty(o, p) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(O) is Object.
        // 2. Assert: IsPropertyKey(P) is true.
        // 3. Let desc be ? O.[[GetOwnProperty]](P).
        // 4. If desc is undefined, return false.
        // 5. Return true.
        // Polyfill.io - As we expect user agents to support ES3 fully we can skip the above steps and use Object.prototype.hasOwnProperty to do them for us.
        return Object.prototype.hasOwnProperty.call(o, p);
    }
    
    // _ESAbstract.IsCallable
    // 7.2.3. IsCallable ( argument )
    function IsCallable(argument) { // eslint-disable-line no-unused-vars
        // 1. If Type(argument) is not Object, return false.
        // 2. If argument has a [[Call]] internal method, return true.
        // 3. Return false.
    
        // Polyfill.io - Only function objects have a [[Call]] internal method. This means we can simplify this function to check that the argument has a type of function.
        return typeof argument === 'function';
    }
    
    // _ESAbstract.SameValueNonNumber
    // 7.2.12. SameValueNonNumber ( x, y )
    function SameValueNonNumber(x, y) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(x) is not Number.
        // 2. Assert: Type(x) is the same as Type(y).
        // 3. If Type(x) is Undefined, return true.
        // 4. If Type(x) is Null, return true.
        // 5. If Type(x) is String, then
            // a. If x and y are exactly the same sequence of code units (same length and same code units at corresponding indices), return true; otherwise, return false.
        // 6. If Type(x) is Boolean, then
            // a. If x and y are both true or both false, return true; otherwise, return false.
        // 7. If Type(x) is Symbol, then
            // a. If x and y are both the same Symbol value, return true; otherwise, return false.
        // 8. If x and y are the same Object value, return true. Otherwise, return false.
    
        // Polyfill.io - We can skip all above steps because the === operator does it all for us.
        return x === y;
    }
    
    // _ESAbstract.ToBoolean
    // 7.1.2. ToBoolean ( argument )
    // The abstract operation ToBoolean converts argument to a value of type Boolean according to Table 9:
    /*
    --------------------------------------------------------------------------------------------------------------
    | Argument Type | Result                                                                                     |
    --------------------------------------------------------------------------------------------------------------
    | Undefined     | Return false.                                                                              |
    | Null          | Return false.                                                                              |
    | Boolean       | Return argument.                                                                           |
    | Number        | If argument is +0, -0, or NaN, return false; otherwise return true.                        |
    | String        | If argument is the empty String (its length is zero), return false; otherwise return true. |
    | Symbol        | Return true.                                                                               |
    | Object        | Return true.                                                                               |
    --------------------------------------------------------------------------------------------------------------
    */
    function ToBoolean(argument) { // eslint-disable-line no-unused-vars
        return Boolean(argument);
    }
    
    // _ESAbstract.ToObject
    // 7.1.13 ToObject ( argument )
    // The abstract operation ToObject converts argument to a value of type Object according to Table 12:
    // Table 12: ToObject Conversions
    /*
    |----------------------------------------------------------------------------------------------------------------------------------------------------|
    | Argument Type | Result                                                                                                                             |
    |----------------------------------------------------------------------------------------------------------------------------------------------------|
    | Undefined     | Throw a TypeError exception.                                                                                                       |
    | Null          | Throw a TypeError exception.                                                                                                       |
    | Boolean       | Return a new Boolean object whose [[BooleanData]] internal slot is set to argument. See 19.3 for a description of Boolean objects. |
    | Number        | Return a new Number object whose [[NumberData]] internal slot is set to argument. See 20.1 for a description of Number objects.    |
    | String        | Return a new String object whose [[StringData]] internal slot is set to argument. See 21.1 for a description of String objects.    |
    | Symbol        | Return a new Symbol object whose [[SymbolData]] internal slot is set to argument. See 19.4 for a description of Symbol objects.    |
    | Object        | Return argument.                                                                                                                   |
    |----------------------------------------------------------------------------------------------------------------------------------------------------|
    */
    function ToObject(argument) { // eslint-disable-line no-unused-vars
        if (argument === null || argument === undefined) {
            throw TypeError();
        }
        return Object(argument);
    }
    
    // _ESAbstract.GetV
    /* global ToObject */
    // 7.3.2 GetV (V, P)
    function GetV(v, p) { // eslint-disable-line no-unused-vars
        // 1. Assert: IsPropertyKey(P) is true.
        // 2. Let O be ? ToObject(V).
        var o = ToObject(v);
        // 3. Return ? O.[[Get]](P, V).
        return o[p];
    }
    
    // _ESAbstract.GetMethod
    /* global GetV, IsCallable */
    // 7.3.9. GetMethod ( V, P )
    function GetMethod(V, P) { // eslint-disable-line no-unused-vars
        // 1. Assert: IsPropertyKey(P) is true.
        // 2. Let func be ? GetV(V, P).
        var func = GetV(V, P);
        // 3. If func is either undefined or null, return undefined.
        if (func === null || func === undefined) {
            return undefined;
        }
        // 4. If IsCallable(func) is false, throw a TypeError exception.
        if (IsCallable(func) === false) {
            throw new TypeError('Method not callable: ' + P);
        }
        // 5. Return func.
        return func;
    }
    
    // _ESAbstract.Type
    // "Type(x)" is used as shorthand for "the type of x"...
    function Type(x) { // eslint-disable-line no-unused-vars
        switch (typeof x) {
            case 'undefined':
                return 'undefined';
            case 'boolean':
                return 'boolean';
            case 'number':
                return 'number';
            case 'string':
                return 'string';
            case 'symbol':
                return 'symbol';
            default:
                // typeof null is 'object'
                if (x === null) return 'null';
                // Polyfill.io - This is here because a Symbol polyfill will have a typeof `object`.
                if ('Symbol' in self && (x instanceof self.Symbol || x.constructor === self.Symbol)) return 'symbol';
    
                return 'object';
        }
    }
    
    // _ESAbstract.CreateIterResultObject
    /* global Type, CreateDataProperty */
    // 7.4.7. CreateIterResultObject ( value, done )
    function CreateIterResultObject(value, done) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(done) is Boolean.
        if (Type(done) !== 'boolean') {
            throw new Error();
        }
        // 2. Let obj be ObjectCreate(%ObjectPrototype%).
        var obj = {};
        // 3. Perform CreateDataProperty(obj, "value", value).
        CreateDataProperty(obj, "value", value);
        // 4. Perform CreateDataProperty(obj, "done", done).
        CreateDataProperty(obj, "done", done);
        // 5. Return obj.
        return obj;
    }
    
    // _ESAbstract.GetPrototypeFromConstructor
    /* global Get, Type */
    // 9.1.14. GetPrototypeFromConstructor ( constructor, intrinsicDefaultProto )
    function GetPrototypeFromConstructor(constructor, intrinsicDefaultProto) { // eslint-disable-line no-unused-vars
        // 1. Assert: intrinsicDefaultProto is a String value that is this specification's name of an intrinsic object. The corresponding object must be an intrinsic that is intended to be used as the [[Prototype]] value of an object.
        // 2. Assert: IsCallable(constructor) is true.
        // 3. Let proto be ? Get(constructor, "prototype").
        var proto = Get(constructor, "prototype");
        // 4. If Type(proto) is not Object, then
        if (Type(proto) !== 'object') {
            // a. Let realm be ? GetFunctionRealm(constructor).
            // b. Set proto to realm's intrinsic object named intrinsicDefaultProto.
            proto = intrinsicDefaultProto;
        }
        // 5. Return proto.
        return proto;
    }
    
    // _ESAbstract.OrdinaryCreateFromConstructor
    /* global GetPrototypeFromConstructor */
    // 9.1.13. OrdinaryCreateFromConstructor ( constructor, intrinsicDefaultProto [ , internalSlotsList ] )
    function OrdinaryCreateFromConstructor(constructor, intrinsicDefaultProto) { // eslint-disable-line no-unused-vars
        var internalSlotsList = arguments[2] || {};
        // 1. Assert: intrinsicDefaultProto is a String value that is this specification's name of an intrinsic object.
        // The corresponding object must be an intrinsic that is intended to be used as the[[Prototype]] value of an object.
    
        // 2. Let proto be ? GetPrototypeFromConstructor(constructor, intrinsicDefaultProto).
        var proto = GetPrototypeFromConstructor(constructor, intrinsicDefaultProto);
    
        // 3. Return ObjectCreate(proto, internalSlotsList).
        // Polyfill.io - We do not pass internalSlotsList to Object.create because Object.create does not use the default ordinary object definitions specified in 9.1.
        var obj = Object.create(proto);
        for (var name in internalSlotsList) {
            if (Object.prototype.hasOwnProperty.call(internalSlotsList, name)) {
                Object.defineProperty(obj, name, {
                    configurable: true,
                    enumerable: false,
                    writable: true,
                    value: internalSlotsList[name]
                });
            }
        }
        return obj;
    }
    
    // _ESAbstract.IteratorClose
    /* global GetMethod, Type, Call */
    // 7.4.6. IteratorClose ( iteratorRecord, completion )
    function IteratorClose(iteratorRecord, completion) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(iteratorRecord.[[Iterator]]) is Object.
        if (Type(iteratorRecord['[[Iterator]]']) !== 'object') {
            throw new Error(Object.prototype.toString.call(iteratorRecord['[[Iterator]]']) + 'is not an Object.');
        }
        // 2. Assert: completion is a Completion Record.
        // Polyfill.io - Ignoring this step as there is no way to check if something is a Completion Record in userland JavaScript.
    
        // 3. Let iterator be iteratorRecord.[[Iterator]].
        var iterator = iteratorRecord['[[Iterator]]'];
        // 4. Let return be ? GetMethod(iterator, "return").
        // Polyfill.io - We name it  returnMethod because return is a keyword and can not be used as an identifier (E.G. variable name, function name etc).
        var returnMethod = GetMethod(iterator, "return");
        // 5. If return is undefined, return Completion(completion).
        if (returnMethod === undefined) {
            return completion;
        }
        // 6. Let innerResult be Call(return, iterator, « »).
        try {
            var innerResult = Call(returnMethod, iterator);
        } catch (error) {
            var innerException = error;
        }
        // 7. If completion.[[Type]] is throw, return Completion(completion).
        if (completion) {
            return completion;
        }
        // 8. If innerResult.[[Type]] is throw, return Completion(innerResult).
        if (innerException) {
            throw innerException;
        }
        // 9. If Type(innerResult.[[Value]]) is not Object, throw a TypeError exception.
        if (Type(innerResult) !== 'object') {
            throw new TypeError("Iterator's return method returned a non-object.");
        }
        // 10. Return Completion(completion).
        return completion;
    }
    
    // _ESAbstract.IteratorComplete
    /* global Type, ToBoolean, Get */
    // 7.4.3 IteratorComplete ( iterResult )
    function IteratorComplete(iterResult) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(iterResult) is Object.
        if (Type(iterResult) !== 'object') {
            throw new Error(Object.prototype.toString.call(iterResult) + 'is not an Object.');
        }
        // 2. Return ToBoolean(? Get(iterResult, "done")).
        return ToBoolean(Get(iterResult, "done"));
    }
    
    // _ESAbstract.IteratorNext
    /* global Call, Type */
    // 7.4.2. IteratorNext ( iteratorRecord [ , value ] )
    function IteratorNext(iteratorRecord /* [, value] */) { // eslint-disable-line no-unused-vars
        // 1. If value is not present, then
        if (arguments.length < 2) {
            // a. Let result be ? Call(iteratorRecord.[[NextMethod]], iteratorRecord.[[Iterator]], « »).
            var result = Call(iteratorRecord['[[NextMethod]]'], iteratorRecord['[[Iterator]]']);
        // 2. Else,
        } else {
            // a. Let result be ? Call(iteratorRecord.[[NextMethod]], iteratorRecord.[[Iterator]], « value »).
            result = Call(iteratorRecord['[[NextMethod]]'], iteratorRecord['[[Iterator]]'], [arguments[1]]);
        }
        // 3. If Type(result) is not Object, throw a TypeError exception.
        if (Type(result) !== 'object') {
            throw new TypeError('bad iterator');
        }
        // 4. Return result.
        return result;
    }
    
    // _ESAbstract.IteratorStep
    /* global IteratorNext, IteratorComplete */
    // 7.4.5. IteratorStep ( iteratorRecord )
    function IteratorStep(iteratorRecord) { // eslint-disable-line no-unused-vars
        // 1. Let result be ? IteratorNext(iteratorRecord).
        var result = IteratorNext(iteratorRecord);
        // 2. Let done be ? IteratorComplete(result).
        var done = IteratorComplete(result);
        // 3. If done is true, return false.
        if (done === true) {
            return false;
        }
        // 4. Return result.
        return result;
    }
    
    // _ESAbstract.IteratorValue
    /* global Type, Get */
    // 7.4.4 IteratorValue ( iterResult )
    function IteratorValue(iterResult) { // eslint-disable-line no-unused-vars
        // Assert: Type(iterResult) is Object.
        if (Type(iterResult) !== 'object') {
            throw new Error(Object.prototype.toString.call(iterResult) + 'is not an Object.');
        }
        // Return ? Get(iterResult, "value").
        return Get(iterResult, "value");
    }
    
    // _ESAbstract.OrdinaryToPrimitive
    /* global Get, IsCallable, Call, Type */
    // 7.1.1.1. OrdinaryToPrimitive ( O, hint )
    function OrdinaryToPrimitive(O, hint) { // eslint-disable-line no-unused-vars
        // 1. Assert: Type(O) is Object.
        // 2. Assert: Type(hint) is String and its value is either "string" or "number".
        // 3. If hint is "string", then
        if (hint === 'string') {
            // a. Let methodNames be « "toString", "valueOf" ».
            var methodNames = ['toString', 'valueOf'];
            // 4. Else,
        } else {
            // a. Let methodNames be « "valueOf", "toString" ».
            methodNames = ['valueOf', 'toString'];
        }
        // 5. For each name in methodNames in List order, do
        for (var i = 0; i < methodNames.length; ++i) {
            var name = methodNames[i];
            // a. Let method be ? Get(O, name).
            var method = Get(O, name);
            // b. If IsCallable(method) is true, then
            if (IsCallable(method)) {
                // i. Let result be ? Call(method, O).
                var result = Call(method, O);
                // ii. If Type(result) is not Object, return result.
                if (Type(result) !== 'object') {
                    return result;
                }
            }
        }
        // 6. Throw a TypeError exception.
        throw new TypeError('Cannot convert to primitive.');
    }
    
    // _ESAbstract.SameValueZero
    /* global Type, SameValueNonNumber */
    // 7.2.11. SameValueZero ( x, y )
    function SameValueZero (x, y) { // eslint-disable-line no-unused-vars
        // 1. If Type(x) is different from Type(y), return false.
        if (Type(x) !== Type(y)) {
            return false;
        }
        // 2. If Type(x) is Number, then
        if (Type(x) === 'number') {
            // a. If x is NaN and y is NaN, return true.
            if (isNaN(x) && isNaN(y)) {
                return true;
            }
            // b. If x is +0 and y is -0, return true.
            if (1/x === Infinity && 1/y === -Infinity) {
                return true;
            }
            // c. If x is -0 and y is +0, return true.
            if (1/x === -Infinity && 1/y === Infinity) {
                return true;
            }
            // d. If x is the same Number value as y, return true.
            if (x === y) {
                return true;
            }
            // e. Return false.
            return false;
        }
        // 3. Return SameValueNonNumber(x, y).
        return SameValueNonNumber(x, y);
    }
    
    // _ESAbstract.ToInteger
    /* global Type */
    // 7.1.4. ToInteger ( argument )
    function ToInteger(argument) { // eslint-disable-line no-unused-vars
        if (Type(argument) === 'symbol') {
            throw new TypeError('Cannot convert a Symbol value to a number');
        }
    
        // 1. Let number be ? ToNumber(argument).
        var number = Number(argument);
        // 2. If number is NaN, return +0.
        if (isNaN(number)) {
            return 0;
        }
        // 3. If number is +0, -0, +∞, or -∞, return number.
        if (1/number === Infinity || 1/number === -Infinity || number === Infinity || number === -Infinity) {
            return number;
        }
        // 4. Return the number value that is the same sign as number and whose magnitude is floor(abs(number)).
        return ((number < 0) ? -1 : 1) * Math.floor(Math.abs(number));
    }
    
    // _ESAbstract.ToLength
    /* global ToInteger */
    // 7.1.15. ToLength ( argument )
    function ToLength(argument) { // eslint-disable-line no-unused-vars
        // 1. Let len be ? ToInteger(argument).
        var len = ToInteger(argument);
        // 2. If len ≤ +0, return +0.
        if (len <= 0) {
            return 0;
        }
        // 3. Return min(len, 253-1).
        return Math.min(len, Math.pow(2, 53) -1);
    }
    
    // _ESAbstract.ToPrimitive
    /* global Type, GetMethod, Call, OrdinaryToPrimitive */
    // 7.1.1. ToPrimitive ( input [ , PreferredType ] )
    function ToPrimitive(input /* [, PreferredType] */) { // eslint-disable-line no-unused-vars
        var PreferredType = arguments.length > 1 ? arguments[1] : undefined;
        // 1. Assert: input is an ECMAScript language value.
        // 2. If Type(input) is Object, then
        if (Type(input) === 'object') {
            // a. If PreferredType is not present, let hint be "default".
            if (arguments.length < 2) {
                var hint = 'default';
                // b. Else if PreferredType is hint String, let hint be "string".
            } else if (PreferredType === String) {
                hint = 'string';
                // c. Else PreferredType is hint Number, let hint be "number".
            } else if (PreferredType === Number) {
                hint = 'number';
            }
            // d. Let exoticToPrim be ? GetMethod(input, @@toPrimitive).
            var exoticToPrim = typeof self.Symbol === 'function' && typeof self.Symbol.toPrimitive === 'symbol' ? GetMethod(input, self.Symbol.toPrimitive) : undefined;
            // e. If exoticToPrim is not undefined, then
            if (exoticToPrim !== undefined) {
                // i. Let result be ? Call(exoticToPrim, input, « hint »).
                var result = Call(exoticToPrim, input, [hint]);
                // ii. If Type(result) is not Object, return result.
                if (Type(result) !== 'object') {
                    return result;
                }
                // iii. Throw a TypeError exception.
                throw new TypeError('Cannot convert exotic object to primitive.');
            }
            // f. If hint is "default", set hint to "number".
            if (hint === 'default') {
                hint = 'number';
            }
            // g. Return ? OrdinaryToPrimitive(input, hint).
            return OrdinaryToPrimitive(input, hint);
        }
        // 3. Return input
        return input;
    }
    
    // _ESAbstract.ToString
    /* global Type, ToPrimitive */
    // 7.1.12. ToString ( argument )
    // The abstract operation ToString converts argument to a value of type String according to Table 11:
    // Table 11: ToString Conversions
    /*
    |---------------|--------------------------------------------------------|
    | Argument Type | Result                                                 |
    |---------------|--------------------------------------------------------|
    | Undefined     | Return "undefined".                                    |
    |---------------|--------------------------------------------------------|
    | Null	        | Return "null".                                         |
    |---------------|--------------------------------------------------------|
    | Boolean       | If argument is true, return "true".                    |
    |               | If argument is false, return "false".                  |
    |---------------|--------------------------------------------------------|
    | Number        | Return NumberToString(argument).                       |
    |---------------|--------------------------------------------------------|
    | String        | Return argument.                                       |
    |---------------|--------------------------------------------------------|
    | Symbol        | Throw a TypeError exception.                           |
    |---------------|--------------------------------------------------------|
    | Object        | Apply the following steps:                             |
    |               | Let primValue be ? ToPrimitive(argument, hint String). |
    |               | Return ? ToString(primValue).                          |
    |---------------|--------------------------------------------------------|
    */
    function ToString(argument) { // eslint-disable-line no-unused-vars
        switch(Type(argument)) {
            case 'symbol':
                throw new TypeError('Cannot convert a Symbol value to a string');
            case 'object':
                var primValue = ToPrimitive(argument, String);
                return ToString(primValue); // eslint-disable-line no-unused-vars
            default:
                return String(argument);
        }
    }
    
    // _ESAbstract.ToPropertyKey
    /* globals ToPrimitive, Type, ToString */
    // 7.1.14. ToPropertyKey ( argument )
    function ToPropertyKey(argument) { // eslint-disable-line no-unused-vars
        // 1. Let key be ? ToPrimitive(argument, hint String).
        var key = ToPrimitive(argument, String);
        // 2. If Type(key) is Symbol, then
        if (Type(key) === 'symbol') {
            // a. Return key.
            return key;
        }
        // 3. Return ! ToString(key).
        return ToString(key);
    }
    
    // Array.prototype.includes
    /* global CreateMethodProperty, Get, SameValueZero, ToInteger, ToLength, ToObject, ToString */
    // 22.1.3.11. Array.prototype.includes ( searchElement [ , fromIndex ] )
    CreateMethodProperty(Array.prototype, 'includes', function includes(searchElement /* [ , fromIndex ] */) {
        'use strict';
        // 1. Let O be ? ToObject(this value).
        var O = ToObject(this);
        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = ToLength(Get(O, "length"));
        // 3. If len is 0, return false.
        if (len === 0) {
            return false;
        }
        // 4. Let n be ? ToInteger(fromIndex). (If fromIndex is undefined, this step produces the value 0.)
        var n = ToInteger(arguments[1]);
        // 5. If n ≥ 0, then
        if (n >= 0) {
            // a. Let k be n.
            var k = n;
            // 6. Else n < 0,
        } else {
            // a. Let k be len + n.
            k = len + n;
            // b. If k < 0, let k be 0.
            if (k < 0) {
                k = 0;
            }
        }
        // 7. Repeat, while k < len
        while (k < len) {
            // a. Let elementK be the result of ? Get(O, ! ToString(k)).
            var elementK = Get(O, ToString(k));
            // b. If SameValueZero(searchElement, elementK) is true, return true.
            if (SameValueZero(searchElement, elementK)) {
                return true;
            }
            // c. Increase k by 1.
            k = k + 1;
        }
        // 8. Return false.
        return false;
    });
    
    // Object.getOwnPropertyDescriptor
    /* global CreateMethodProperty, ToObject, ToPropertyKey, HasOwnProperty, Type */
    (function () {
        var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    
        var supportsDOMDescriptors = (function () {
            try {
                return Object.defineProperty(document.createElement('div'), 'one', {
                    get: function () {
                        return 1;
                    }
                }).one === 1;
            } catch (e) {
                return false;
            }
        });
    
        var toString = ({}).toString;
        var split = ''.split;
    
        // 19.1.2.8 Object.getOwnPropertyDescriptor ( O, P )
        CreateMethodProperty(Object, 'getOwnPropertyDescriptor', function getOwnPropertyDescriptor(O, P) {
            // 1. Let obj be ? ToObject(O).
            var obj = ToObject(O);
            // Polyfill.io fallback for non-array-like strings which exist in some ES3 user-agents (IE 8)
            obj = (Type(obj) === 'string' || obj instanceof String) && toString.call(O) == '[object String]' ? split.call(O, '') : Object(O);
    
            // 2. Let key be ? ToPropertyKey(P).
            var key = ToPropertyKey(P);
    
            // 3. Let desc be ? obj.[[GetOwnProperty]](key).
            // 4. Return FromPropertyDescriptor(desc).
            // Polyfill.io Internet Explorer 8 natively supports property descriptors only on DOM objects.
            // We will fallback to the polyfill implementation if the native implementation throws an error.
            if (supportsDOMDescriptors) {
                try {
                    return nativeGetOwnPropertyDescriptor(obj, key);
                // eslint-disable-next-line no-empty
                } catch (error) {}
            }
            if (HasOwnProperty(obj, key)) {
                return {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: obj[key]
                };
            }
        });
    }());
    
    // Object.isExtensible
    /* global CreateMethodProperty, Type */
    
    (function (nativeIsExtensible) {
        // 19.1.2.13 Object.isExtensible ( O )
        CreateMethodProperty(Object, 'isExtensible', function isExtensible(O) {
            // 1. If Type(O) is not Object, return false.
            if (Type(O) !== "object") {
                return false;
            }
            // 2. Return ? IsExtensible(O).
            return nativeIsExtensible ? nativeIsExtensible(O) : true;
        });
    }(Object.isExtensible));
    
    // Object.keys
    /* global CreateMethodProperty */
    CreateMethodProperty(Object, "keys", (function() {
        'use strict';
    
        // modified from https://github.com/es-shims/object-keys
    
        var has = Object.prototype.hasOwnProperty;
        var toStr = Object.prototype.toString;
        var isEnumerable = Object.prototype.propertyIsEnumerable;
        var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
        var hasPrototypeEnumBug = isEnumerable.call(function () { }, 'prototype');
        function hasProtoEnumBug() {
            // Object.create polyfill creates an enumerable __proto__
            var createdObj;
            try {
                createdObj = Object.create({});
            } catch (e) {
                // If this fails the polyfil isn't loaded yet, but will be.
                // Can't add it to depedencies because of it would create a circular depedency.
                return true;
            }
    
            return isEnumerable.call(createdObj, '__proto__')
        }
    
        var dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ];
        var equalsConstructorPrototype = function (o) {
            var ctor = o.constructor;
            return ctor && ctor.prototype === o;
        };
        var excludedKeys = {
            $console: true,
            $external: true,
            $frame: true,
            $frameElement: true,
            $frames: true,
            $innerHeight: true,
            $innerWidth: true,
            $outerHeight: true,
            $outerWidth: true,
            $pageXOffset: true,
            $pageYOffset: true,
            $parent: true,
            $scrollLeft: true,
            $scrollTop: true,
            $scrollX: true,
            $scrollY: true,
            $self: true,
            $webkitIndexedDB: true,
            $webkitStorageInfo: true,
            $window: true
        };
        var hasAutomationEqualityBug = (function () {
            if (typeof window === 'undefined') { return false; }
            for (var k in window) {
                try {
                    if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
                        try {
                            equalsConstructorPrototype(window[k]);
                        } catch (e) {
                            return true;
                        }
                    }
                } catch (e) {
                    return true;
                }
            }
            return false;
        }());
        var equalsConstructorPrototypeIfNotBuggy = function (o) {
            if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
                return equalsConstructorPrototype(o);
            }
            try {
                return equalsConstructorPrototype(o);
            } catch (e) {
                return false;
            }
        };
    
        function isArgumentsObject(value) {
            var str = toStr.call(value);
            var isArgs = str === '[object Arguments]';
            if (!isArgs) {
                isArgs = str !== '[object Array]' &&
                    value !== null &&
                    typeof value === 'object' &&
                    typeof value.length === 'number' &&
                    value.length >= 0 &&
                    toStr.call(value.callee) === '[object Function]';
            }
            return isArgs;
        }
    
        return function keys(object) {
            var isFunction = toStr.call(object) === '[object Function]';
            var isArguments = isArgumentsObject(object);
            var isString = toStr.call(object) === '[object String]';
            var theKeys = [];
    
            if (object === undefined || object === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
    
            var skipPrototype = hasPrototypeEnumBug && isFunction;
            if (isString && object.length > 0 && !has.call(object, 0)) {
                for (var i = 0; i < object.length; ++i) {
                    theKeys.push(String(i));
                }
            }
    
            if (isArguments && object.length > 0) {
                for (var j = 0; j < object.length; ++j) {
                    theKeys.push(String(j));
                }
            } else {
                for (var name in object) {
                    if (!(hasProtoEnumBug() && name === '__proto__') && !(skipPrototype && name === 'prototype') && has.call(object, name)) {
                        theKeys.push(String(name));
                    }
                }
            }
    
            if (hasDontEnumBug) {
                var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
    
                for (var k = 0; k < dontEnums.length; ++k) {
                    if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
                        theKeys.push(dontEnums[k]);
                    }
                }
            }
            return theKeys;
        };
    }()));
    
    // Object.getOwnPropertyNames
    /* global CreateMethodProperty, ToObject */
    (function() {
        var toString = {}.toString;
        var split = "".split;
        var concat = [].concat;
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var nativeGetOwnPropertyNames = Object.getOwnPropertyNames || Object.keys;
        var cachedWindowNames =
            typeof self === "object" ? nativeGetOwnPropertyNames(self) : [];
    
        // 19.1.2.10 Object.getOwnPropertyNames ( O )
        CreateMethodProperty(
            Object,
            "getOwnPropertyNames",
            function getOwnPropertyNames(O) {
                var object = ToObject(O);
    
                if (toString.call(object) === "[object Window]") {
                    try {
                        return nativeGetOwnPropertyNames(object);
                    } catch (e) {
                        // IE bug where layout engine calls userland Object.getOwnPropertyNames for cross-domain `window` objects
                        return concat.call([], cachedWindowNames);
                    }
                }
    
                // Polyfill.io fallback for non-array-like strings which exist in some ES3 user-agents (IE 8)
                object =
                    toString.call(object) == "[object String]"
                        ? split.call(object, "")
                        : Object(object);
    
                var result = nativeGetOwnPropertyNames(object);
                var extraNonEnumerableKeys = ["length", "prototype"];
                for (var i = 0; i < extraNonEnumerableKeys.length; i++) {
                    var key = extraNonEnumerableKeys[i];
                    if (hasOwnProperty.call(object, key) && !result.includes(key)) {
                        result.push(key);
                    }
                }
    
                if (result.includes("__proto__")) {
                    var index = result.indexOf("__proto__");
                    result.splice(index, 1);
                }
    
                return result;
            }
        );
    })();
    
    // Symbol
    // A modification of https://github.com/WebReflection/get-own-property-symbols
    // (C) Andrea Giammarchi - MIT Licensed
    
    /* global Type */
    (function (Object,  GOPS, global) {
        'use strict'; //so that ({}).toString.call(null) returns the correct [object Null] rather than [object Window]
    
        var supportsGetters = (function () {
            // supports getters
            try {
                var a = {};
                Object.defineProperty(a, "t", {
                    configurable: true,
                    enumerable: false,
                    get: function () {
                        return true;
                    },
                    set: undefined
                });
                return !!a.t;
            } catch (e) {
                return false;
            }
        }());
    
        var	setDescriptor;
        var id = 0;
        var random = '' + Math.random();
        var prefix = '__\x01symbol:';
        var prefixLength = prefix.length;
        var internalSymbol = '__\x01symbol@@' + random;
        var emptySymbolLookup = {};
        var DP = 'defineProperty';
        var DPies = 'defineProperties';
        var GOPN = 'getOwnPropertyNames';
        var GOPD = 'getOwnPropertyDescriptor';
        var PIE = 'propertyIsEnumerable';
        var ObjectProto = Object.prototype;
        var hOP = ObjectProto.hasOwnProperty;
        var pIE = ObjectProto[PIE];
        var toString = ObjectProto.toString;
        var concat = Array.prototype.concat;
        var cachedWindowNames = Object.getOwnPropertyNames ? Object.getOwnPropertyNames(self) : [];
        var nGOPN = Object[GOPN];
        var gOPN = function getOwnPropertyNames (obj) {
            if (toString.call(obj) === '[object Window]') {
                try {
                    return nGOPN(obj);
                } catch (e) {
                    // IE bug where layout engine calls userland gOPN for cross-domain `window` objects
                    return concat.call([], cachedWindowNames);
                }
            }
            return nGOPN(obj);
        };
        var gOPD = Object[GOPD];
        var objectCreate = Object.create;
        var objectKeys = Object.keys;
        var freeze = Object.freeze || Object;
        var objectDefineProperty = Object[DP];
        var $defineProperties = Object[DPies];
        var descriptor = gOPD(Object, GOPN);
        var addInternalIfNeeded = function (o, uid, enumerable) {
            if (!hOP.call(o, internalSymbol)) {
                try {
                    objectDefineProperty(o, internalSymbol, {
                        enumerable: false,
                        configurable: false,
                        writable: false,
                        value: {}
                    });
                } catch (e) {
                    o[internalSymbol] = {};
                }
            }
            o[internalSymbol]['@@' + uid] = enumerable;
        };
        var createWithSymbols = function (proto, descriptors) {
            var self = objectCreate(proto);
            gOPN(descriptors).forEach(function (key) {
                if (propertyIsEnumerable.call(descriptors, key)) {
                    $defineProperty(self, key, descriptors[key]);
                }
            });
            return self;
        };
        var copyAsNonEnumerable = function (descriptor) {
            var newDescriptor = objectCreate(descriptor);
            newDescriptor.enumerable = false;
            return newDescriptor;
        };
        var get = function get(){};
        var onlyNonSymbols = function (name) {
            return name != internalSymbol &&
                !hOP.call(source, name);
        };
        var onlySymbols = function (name) {
            return name != internalSymbol &&
                hOP.call(source, name);
        };
        var propertyIsEnumerable = function propertyIsEnumerable(key) {
            var uid = '' + key;
            return onlySymbols(uid) ? (
                hOP.call(this, uid) &&
                this[internalSymbol] && this[internalSymbol]['@@' + uid]
            ) : pIE.call(this, key);
        };
        var setAndGetSymbol = function (uid) {
            var descriptor = {
                enumerable: false,
                configurable: true,
                get: get,
                set: function (value) {
                setDescriptor(this, uid, {
                    enumerable: false,
                    configurable: true,
                    writable: true,
                    value: value
                });
                addInternalIfNeeded(this, uid, true);
                }
            };
            try {
                objectDefineProperty(ObjectProto, uid, descriptor);
            } catch (e) {
                ObjectProto[uid] = descriptor.value;
            }
            source[uid] = objectDefineProperty(
                Object(uid),
                'constructor',
                sourceConstructor
            );
            var description = gOPD(Symbol.prototype, 'description');
            if (description) {
                objectDefineProperty(
                    source[uid],
                    'description',
                    description
                );
            }
            return freeze(source[uid]);
        };
    
        var symbolDescription = function (s) {
            var sym = thisSymbolValue(s);
    
            // 3. Return sym.[[Description]].
            if (supportsInferredNames) {
                var name = getInferredName(sym);
                if (name !== "") {
                    return name.slice(1, -1); // name.slice('['.length, -']'.length);
                }
            }
    
            if (emptySymbolLookup[sym] !== undefined) {
                return emptySymbolLookup[sym];
            }
    
            var string = sym.toString();
            var randomStartIndex = string.lastIndexOf("0.");
            string = string.slice(10, randomStartIndex);
    
            if (string === "") {
                return undefined;
            }
            return string;
        };
    
        var Symbol = function Symbol() {
            var description = arguments[0];
            if (this instanceof Symbol) {
                throw new TypeError('Symbol is not a constructor');
            }
    
            var uid = prefix.concat(description || '', random, ++id);
    
            if (description !== undefined && (description === null || isNaN(description) || String(description) === "")) {
                emptySymbolLookup[uid] = String(description);
            }
    
            var that = setAndGetSymbol(uid);
    
            if (!supportsGetters) {
                Object.defineProperty(that, "description", {
                    configurable: true,
                    enumerable: false,
                    value: symbolDescription(that)
                });
            }
    
            return that;
        };
    
        var source = objectCreate(null);
        var sourceConstructor = {value: Symbol};
        var sourceMap = function (uid) {
            return source[uid];
            };
        var $defineProperty = function defineProperty(o, key, descriptor) {
            var uid = '' + key;
            if (onlySymbols(uid)) {
                setDescriptor(o, uid, descriptor.enumerable ?
                    copyAsNonEnumerable(descriptor) : descriptor);
                addInternalIfNeeded(o, uid, !!descriptor.enumerable);
            } else {
                objectDefineProperty(o, key, descriptor);
            }
            return o;
        };
    
        var onlyInternalSymbols = function (obj) {
            return function (name) {
                return hOP.call(obj, internalSymbol) && hOP.call(obj[internalSymbol], '@@' + name);
            };
        };
        var $getOwnPropertySymbols = function getOwnPropertySymbols(o) {
            return gOPN(o).filter(o === ObjectProto ? onlyInternalSymbols(o) : onlySymbols).map(sourceMap);
            }
        ;
    
        descriptor.value = $defineProperty;
        objectDefineProperty(Object, DP, descriptor);
    
        descriptor.value = $getOwnPropertySymbols;
        objectDefineProperty(Object, GOPS, descriptor);
    
        descriptor.value = function getOwnPropertyNames(o) {
            return gOPN(o).filter(onlyNonSymbols);
        };
        objectDefineProperty(Object, GOPN, descriptor);
    
        descriptor.value = function defineProperties(o, descriptors) {
            var symbols = $getOwnPropertySymbols(descriptors);
            if (symbols.length) {
            objectKeys(descriptors).concat(symbols).forEach(function (uid) {
                if (propertyIsEnumerable.call(descriptors, uid)) {
                $defineProperty(o, uid, descriptors[uid]);
                }
            });
            } else {
            $defineProperties(o, descriptors);
            }
            return o;
        };
        objectDefineProperty(Object, DPies, descriptor);
    
        descriptor.value = propertyIsEnumerable;
        objectDefineProperty(ObjectProto, PIE, descriptor);
    
        descriptor.value = Symbol;
        objectDefineProperty(global, 'Symbol', descriptor);
    
        // defining `Symbol.for(key)`
        descriptor.value = function (key) {
            var uid = prefix.concat(prefix, key, random);
            return uid in ObjectProto ? source[uid] : setAndGetSymbol(uid);
        };
        objectDefineProperty(Symbol, 'for', descriptor);
    
        // defining `Symbol.keyFor(symbol)`
        descriptor.value = function (symbol) {
            if (onlyNonSymbols(symbol))
            throw new TypeError(symbol + ' is not a symbol');
            return hOP.call(source, symbol) ?
            symbol.slice(prefixLength * 2, -random.length) :
            void 0
            ;
        };
        objectDefineProperty(Symbol, 'keyFor', descriptor);
    
        descriptor.value = function getOwnPropertyDescriptor(o, key) {
            var descriptor = gOPD(o, key);
            if (descriptor && onlySymbols(key)) {
            descriptor.enumerable = propertyIsEnumerable.call(o, key);
            }
            return descriptor;
        };
        objectDefineProperty(Object, GOPD, descriptor);
    
        descriptor.value = function create(proto, descriptors) {
            return arguments.length === 1 || typeof descriptors === "undefined" ?
            objectCreate(proto) :
            createWithSymbols(proto, descriptors);
        };
    
        objectDefineProperty(Object, 'create', descriptor);
    
        var strictModeSupported = (function(){ 'use strict'; return this; }).call(null) === null;
        if (strictModeSupported) {
            descriptor.value = function () {
                var str = toString.call(this);
                return (str === '[object String]' && onlySymbols(this)) ? '[object Symbol]' : str;
            };
        } else {
            descriptor.value = function () {
                // https://github.com/Financial-Times/polyfill-library/issues/164#issuecomment-486965300
                // Polyfill.io this code is here for the situation where a browser does not
                // support strict mode and is executing `Object.prototype.toString.call(null)`.
                // This code ensures that we return the correct result in that situation however,
                // this code also introduces a bug where it will return the incorrect result for
                // `Object.prototype.toString.call(window)`. We can't have the correct result for
                // both `window` and `null`, so we have opted for `null` as we believe this is the more
                // common situation.
                if (this === window) {
                    return '[object Null]';
                }
    
                var str = toString.call(this);
                return (str === '[object String]' && onlySymbols(this)) ? '[object Symbol]' : str;
            };
        }
        objectDefineProperty(ObjectProto, 'toString', descriptor);
    
        setDescriptor = function (o, key, descriptor) {
            var protoDescriptor = gOPD(ObjectProto, key);
            delete ObjectProto[key];
            objectDefineProperty(o, key, descriptor);
            if (o !== ObjectProto) {
                objectDefineProperty(ObjectProto, key, protoDescriptor);
            }
        };
    
        // The abstract operation thisSymbolValue(value) performs the following steps:
        function thisSymbolValue(value) {
            // 1. If Type(value) is Symbol, return value.
            if (Type(value) === "symbol") {
                return value;
            }
            // 2. If Type(value) is Object and value has a [[SymbolData]] internal slot, then
            // a. Let s be value.[[SymbolData]].
            // b. Assert: Type(s) is Symbol.
            // c. Return s.
            // 3. Throw a TypeError exception.
            throw TypeError(value + " is not a symbol");
        }
    
        // Symbol.prototype.description
        if (function () {
            // supports getters
            try {
                var a = {};
                Object.defineProperty(a, "t", {
                    configurable: true,
                    enumerable: false,
                    get: function() {
                        return true;
                    },
                    set: undefined
                });
                return !!a.t;
            } catch (e) {
                return false;
            }
        }()) {
            var getInferredName;
            try {
                // eslint-disable-next-line no-new-func
                getInferredName = Function("s", "var v = s.valueOf(); return { [v]() {} }[v].name;");
                // eslint-disable-next-line no-empty
            } catch (e) { }
    
            var inferred = function () { };
            var supportsInferredNames = getInferredName && inferred.name === "inferred" ? getInferredName : null;
    
    
            // 19.4.3.2 get Symbol.prototype.description
            Object.defineProperty(global.Symbol.prototype, "description", {
                configurable: true,
                enumerable: false,
                get: function () {
                    // 1. Let s be the this value.
                    var s = this;
                    return symbolDescription(s);
                }
            });
        }
    
    }(Object, 'getOwnPropertySymbols', self));
    
    // Symbol.iterator
    Object.defineProperty(self.Symbol, 'iterator', { value: self.Symbol('iterator') });
    
    // _ESAbstract.GetIterator
    /* global GetMethod, Symbol, Call, Type, GetV */
    // 7.4.1. GetIterator ( obj [ , method ] )
    // The abstract operation GetIterator with argument obj and optional argument method performs the following steps:
    function GetIterator(obj /*, method */) { // eslint-disable-line no-unused-vars
        // 1. If method is not present, then
            // a. Set method to ? GetMethod(obj, @@iterator).
        var method = arguments.length > 1 ? arguments[1] : GetMethod(obj, Symbol.iterator);
        // 2. Let iterator be ? Call(method, obj).
        var iterator = Call(method, obj);
        // 3. If Type(iterator) is not Object, throw a TypeError exception.
        if (Type(iterator) !== 'object') {
            throw new TypeError('bad iterator');
        }
        // 4. Let nextMethod be ? GetV(iterator, "next").
        var nextMethod = GetV(iterator, "next");
        // 5. Let iteratorRecord be Record {[[Iterator]]: iterator, [[NextMethod]]: nextMethod, [[Done]]: false}.
        var iteratorRecord = Object.create(null);
        iteratorRecord['[[Iterator]]'] = iterator;
        iteratorRecord['[[NextMethod]]'] = nextMethod;
        iteratorRecord['[[Done]]'] = false;
        // 6. Return iteratorRecord.
        return iteratorRecord;
    }
    
    // Symbol.species
    /* global Symbol */
    Object.defineProperty(Symbol, 'species', { value: Symbol('species') });
    
    // Map
    /* global CreateIterResultObject, CreateMethodProperty, GetIterator, IsCallable, IteratorClose, IteratorStep, IteratorValue, OrdinaryCreateFromConstructor, SameValueZero, Type, Symbol */
    (function (global) {
        var supportsGetters = (function () {
            try {
                var a = {};
                Object.defineProperty(a, 't', {
                    configurable: true,
                    enumerable: false,
                    get: function () {
                        return true;
                    },
                    set: undefined
                });
                return !!a.t;
            } catch (e) {
                return false;
            }
        }());
    
        // Need an internal counter to assign unique IDs to a key map
        var _uniqueHashId = 0;
        // Create a unique key name for storing meta data on functions and objects to enable lookups in hash table
        var _metaKey = Symbol('meta_' + ((Math.random() * 100000000) + '').replace('.', ''));
    
        /**
         * hashKey()
         * Function that given a key of `any` type, returns a string key value to enable hash map optimization for accessing Map data structure
         * @param {string|integer|function|object} recordKey - Record key to normalize to string accessor for hash map
         * @returns {string|false} - Returns a hashed string value or false if non extensible object key
         */
        var hashKey = function(recordKey) {
            // Check to see if we are dealing with object or function type.
            if (typeof recordKey === 'object' ? recordKey !== null : typeof recordKey === 'function') {
                // Check to see if we are dealing with a non extensible object
                if (!Object.isExtensible(recordKey)) {
                    // Return `false`
                    return false;
                }
                if (!Object.prototype.hasOwnProperty.call(recordKey, _metaKey)) {
                    var uniqueHashKey = typeof(recordKey)+'-'+(++_uniqueHashId);
                    Object.defineProperty(recordKey, _metaKey, {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: uniqueHashKey
                    });
                }
                // Return previously defined hashed key
                return recordKey[_metaKey];
            }
            // If this is just a primitive, we can cast it to a string and return it
            return ''+recordKey;
        };
    
        /**
         * getRecordIndex()
         * Function that given a Map and a key of `any` type, returns an index number that coorelates with a record found in `this._keys[index]` and `this._values[index]`
         * @param {Map} map - Map structure
         * @param {string|number|function|object} recordKey - Record key to normalize to string accessor for hash map
         * @returns {number|false} - Returns either a index to access map._keys and map._values, or false if not found
         */
        var getRecordIndex = function(map, recordKey) {
            var hashedKey = hashKey(recordKey); // Casts key to unique string (unless already string or number)
            if (hashedKey === false) {
                // We have to iterate through our Map structure because `recordKey` is non-primitive and not extensible
                return getRecordIndexSlow(map, recordKey);
            }
            var recordIndex = map._table[hashedKey]; // O(1) access to record
            return recordIndex !== undefined ? recordIndex : false;
        };
    
        /**
         * getRecordIndexSlow()
         * Alternative (and slower) function to `getRecordIndex()`.  Necessary for looking up non-extensible object keys.
         * @param {Map} map - Map structure
         * @param {string|number|function|object} recordKey - Record key to normalize to string accessor for hash map
         * @returns {number|false} - Returns either a index to access map._keys and map._values, or false if not found
         */
        var getRecordIndexSlow = function(map, recordKey) {
            // We have to iterate through our Map structure because `recordKey` is non-primitive and not extensible
            for (var i = 0; i < map._keys.length; i++) {
                var _recordKey = map._keys[i];
                if (_recordKey !== undefMarker && SameValueZero(_recordKey, recordKey)) {
                    return i;
                }
            }
            return false;
        };
    
        /**
         * setHashIndex()
         * Function that given a map, key of `any` type, and a value, creates a new entry in Map hash table
         * @param {Map} map
         * @param {string|number|function|object} recordKey - Key to translate into normalized key for hash map
         * @param {number|bool} recordIndex - new record index for the hashedKey or `false` to delete the record index for the hashedKey
         * @returns {bool} - indicates success of operation
         */
        var setHashIndex = function(map, recordKey, recordIndex) {
            var hashedKey = hashKey(recordKey);
            if (hashedKey === false) {
                // If hashed key is false, the recordKey is an object which is not extensible.
                // That indicates we cannot use the hash map for it, so this operation becomes no-op.
                return false;
            }
            if (recordIndex === false) {
                delete map._table[hashedKey];
            } else {
                map._table[hashedKey] = recordIndex;
            }
            return true;
        };
    
        // Deleted map items mess with iterator pointers, so rather than removing them mark them as deleted. Can't use undefined or null since those both valid keys so use a private symbol.
        var undefMarker = Symbol('undef');
        // 23.1.1.1 Map ( [ iterable ] )
        var Map = function Map(/* iterable */) {
            // 1. If NewTarget is undefined, throw a TypeError exception.
            if (!(this instanceof Map)) {
                throw new TypeError('Constructor Map requires "new"');
            }
            // 2. Let map be ? OrdinaryCreateFromConstructor(NewTarget, "%MapPrototype%", « [[MapData]] »).
            var map = OrdinaryCreateFromConstructor(this, Map.prototype, {
                _table: {}, // O(1) access table for retrieving records
                _keys: [],
                _values: [],
                _size: 0,
                _es6Map: true
            });
    
            // 3. Set map.[[MapData]] to a new empty List.
            // Polyfill.io - This step was done as part of step two.
    
            // Some old engines do not support ES5 getters/setters.  Since Map only requires these for the size property, we can fall back to setting the size property statically each time the size of the map changes.
            if (!supportsGetters) {
                Object.defineProperty(map, 'size', {
                    configurable: true,
                    enumerable: false,
                    writable: true,
                    value: 0
                });
            }
    
            // 4. If iterable is not present, let iterable be undefined.
            var iterable = arguments.length > 0 ? arguments[0] : undefined;
    
            // 5. If iterable is either undefined or null, return map.
            if (iterable === null || iterable === undefined) {
                return map;
            }
    
            // 6. Let adder be ? Get(map, "set").
            var adder = map.set;
    
            // 7. If IsCallable(adder) is false, throw a TypeError exception.
            if (!IsCallable(adder)) {
                throw new TypeError("Map.prototype.set is not a function");
            }
    
            // 8. Let iteratorRecord be ? GetIterator(iterable).
            try {
                var iteratorRecord = GetIterator(iterable);
                // 9. Repeat,
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    // a. Let next be ? IteratorStep(iteratorRecord).
                    var next = IteratorStep(iteratorRecord);
                    // b. If next is false, return map.
                    if (next === false) {
                        return map;
                    }
                    // c. Let nextItem be ? IteratorValue(next).
                    var nextItem = IteratorValue(next);
                    // d. If Type(nextItem) is not Object, then
                    if (Type(nextItem) !== 'object') {
                        // i. Let error be Completion{[[Type]]: throw, [[Value]]: a newly created TypeError object, [[Target]]: empty}.
                        try {
                            throw new TypeError('Iterator value ' + nextItem + ' is not an entry object');
                        } catch (error) {
                            // ii. Return ? IteratorClose(iteratorRecord, error).
                            return IteratorClose(iteratorRecord, error);
                        }
                    }
                    try {
                        // Polyfill.io - The try catch accounts for steps: f, h, and j.
    
                        // e. Let k be Get(nextItem, "0").
                        var k = nextItem[0];
                        // f. If k is an abrupt completion, return ? IteratorClose(iteratorRecord, k).
                        // g. Let v be Get(nextItem, "1").
                        var v = nextItem[1];
                        // h. If v is an abrupt completion, return ? IteratorClose(iteratorRecord, v).
                        // i. Let status be Call(adder, map, « k.[[Value]], v.[[Value]] »).
                        adder.call(map, k, v);
                    } catch (e) {
                        // j. If status is an abrupt completion, return ? IteratorClose(iteratorRecord, status).
                        return IteratorClose(iteratorRecord, e);
                    }
                }
            } catch (e) {
                // Polyfill.io - For user agents which do not have iteration methods on argument objects or arrays, we can special case those.
                if (Array.isArray(iterable) ||
                    Object.prototype.toString.call(iterable) === '[object Arguments]' ||
                    // IE 7 & IE 8 return '[object Object]' for the arguments object, we can detect by checking for the existence of the callee property
                    (!!iterable.callee)) {
                    var index;
                    var length = iterable.length;
                    for (index = 0; index < length; index++) {
                        adder.call(map, iterable[index][0], iterable[index][1]);
                    }
                }
            }
            return map;
        };
    
        // 23.1.2.1. Map.prototype
        // The initial value of Map.prototype is the intrinsic object %MapPrototype%.
        // This property has the attributes { [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: false }.
        Object.defineProperty(Map, 'prototype', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: {}
        });
    
        // 23.1.2.2 get Map [ @@species ]
        if (supportsGetters) {
            Object.defineProperty(Map, Symbol.species, {
                configurable: true,
                enumerable: false,
                get: function () {
                    // 1. Return the this value.
                    return this;
                },
                set: undefined
            });
        } else {
            CreateMethodProperty(Map, Symbol.species, Map);
        }
    
        // 23.1.3.1 Map.prototype.clear ( )
        CreateMethodProperty(Map.prototype, 'clear', function clear() {
                // 1. Let M be the this value.
                var M = this;
                // 2. If Type(M) is not Object, throw a TypeError exception.
                if (Type(M) !== 'object') {
                    throw new TypeError('Method Map.prototype.clear called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 3. If M does not have a [[MapData]] internal slot, throw a TypeError exception.
                if (M._es6Map !== true) {
                    throw new TypeError('Method Map.prototype.clear called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 4. Let entries be the List that is M.[[MapData]].
                var entries = M._keys;
                // 5. For each Record {[[Key]], [[Value]]} p that is an element of entries, do
                for (var i = 0; i < entries.length; i++) {
                    // 5.a. Set p.[[Key]] to empty.
                    M._keys[i] = undefMarker;
                    // 5.b. Set p.[[Value]] to empty.
                    M._values[i] = undefMarker;
                }
                this._size = 0;
                if (!supportsGetters) {
                    this.size = this._size;
                }
                // 5a. Clear lookup table
                this._table = {};
                // 6. Return undefined.
                return undefined;
            }
        );
    
        // 23.1.3.2. Map.prototype.constructor
        CreateMethodProperty(Map.prototype, 'constructor', Map);
    
        // 23.1.3.3. Map.prototype.delete ( key )
        CreateMethodProperty(Map.prototype, 'delete', function (key) {
                // 1. Let M be the this value.
                var M = this;
                // 2. If Type(M) is not Object, throw a TypeError exception.
                if (Type(M) !== 'object') {
                    throw new TypeError('Method Map.prototype.clear called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 3. If M does not have a [[MapData]] internal slot, throw a TypeError exception.
                if (M._es6Map !== true) {
                    throw new TypeError('Method Map.prototype.clear called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 4. Let entries be the List that is M.[[MapData]].
                // 5. For each Record {[[Key]], [[Value]]} p that is an element of entries, do
                    // 5a. If p.[[Key]] is not empty and SameValueZero(p.[[Key]], key) is true, then
                        // i. Set p.[[Key]] to empty.
                        // ii. Set p.[[Value]] to empty.
                        // ii-a. Remove key from lookup table
                        // iii. Return true.
                // 6. Return false.
    
                // Implement steps 4-6 with a more optimal algo
    
                // Steps 4-5: Access record
                var recordIndex = getRecordIndex(M, key); // O(1) access to record index
    
                if (recordIndex !== false) {
                    // Get record's `key` (could be `any` type);
                    var recordKey = M._keys[recordIndex];
                    // 5a. If p.[[Key]] is not empty and SameValueZero(p.[[Key]], key) is true, then
                    if (recordKey !== undefMarker && SameValueZero(recordKey, key)) {
                        // i. Set p.[[Key]] to empty.
                        this._keys[recordIndex] = undefMarker;
                        // ii. Set p.[[Value]] to empty.
                        this._values[recordIndex] = undefMarker;
                        this._size = --this._size;
                        if (!supportsGetters) {
                            this.size = this._size;
                        }
                        // iia. Remove key from lookup table
                        setHashIndex(this, key, false);
                        // iii. Return true.
                        return true;
                    }
                }
    
                // 6. Return false.
                return false;
            }
        );
    
        // 23.1.3.4. Map.prototype.entries ( )
        CreateMethodProperty(Map.prototype, 'entries', function entries () {
                // 1. Let M be the this value.
                var M = this;
                // 2. Return ? CreateMapIterator(M, "key+value").
                return CreateMapIterator(M, 'key+value');
            }
        );
    
        // 23.1.3.5. Map.prototype.forEach ( callbackfn [ , thisArg ] )
        CreateMethodProperty(Map.prototype, 'forEach', function (callbackFn) {
                // 1. Let M be the this value.
                var M = this;
                // 2. If Type(M) is not Object, throw a TypeError exception.
                if (Type(M) !== 'object') {
                    throw new TypeError('Method Map.prototype.forEach called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 3. If M does not have a [[MapData]] internal slot, throw a TypeError exception.
                if (M._es6Map !== true) {
                    throw new TypeError('Method Map.prototype.forEach called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 4. If IsCallable(callbackfn) is false, throw a TypeError exception.
                if (!IsCallable(callbackFn)) {
                    throw new TypeError(Object.prototype.toString.call(callbackFn) + ' is not a function.');
                }
                // 5. If thisArg is present, let T be thisArg; else let T be undefined.
                if (arguments[1]) {
                    var T = arguments[1];
                }
                // 6. Let entries be the List that is M.[[MapData]].
                var entries = M._keys;
                // 7. For each Record {[[Key]], [[Value]]} e that is an element of entries, in original key insertion order, do
                for (var i = 0; i < entries.length; i++) {
                    // a. If e.[[Key]] is not empty, then
                    if (M._keys[i] !== undefMarker && M._values[i] !== undefMarker ) {
                        // i. Perform ? Call(callbackfn, T, « e.[[Value]], e.[[Key]], M »).
                        callbackFn.call(T, M._values[i], M._keys[i], M);
                    }
                }
                // 8. Return undefined.
                return undefined;
            }
        );
    
        // 23.1.3.6. Map.prototype.get ( key )
        CreateMethodProperty(Map.prototype, 'get', function get(key) {
                // 1. Let M be the this value.
                var M = this;
                // 2. If Type(M) is not Object, throw a TypeError exception.
                if (Type(M) !== 'object') {
                    throw new TypeError('Method Map.prototype.get called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 3. If M does not have a [[MapData]] internal slot, throw a TypeError exception.
                if (M._es6Map !== true) {
                    throw new TypeError('Method Map.prototype.get called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 4. Let entries be the List that is M.[[MapData]].
                // 5. For each Record {[[Key]], [[Value]]} p that is an element of entries, do
                    // a. If p.[[Key]] is not empty and SameValueZero(p.[[Key]], key) is true, return p.[[Value]].
                // 6. Return undefined.
    
                // Implement steps 4-6 with a more optimal algo
                var recordIndex = getRecordIndex(M, key); // O(1) access to record index
                if (recordIndex !== false) {
                    var recordKey = M._keys[recordIndex];
                    if (recordKey !== undefMarker && SameValueZero(recordKey, key)) {
                        return M._values[recordIndex];
                    }
                }
    
                return undefined;
            });
    
        // 23.1.3.7. Map.prototype.has ( key )
        CreateMethodProperty(Map.prototype, 'has', function has (key) {
                // 1. Let M be the this value.
                var M = this;
                // 2. If Type(M) is not Object, throw a TypeError exception.
                if (typeof M !== 'object') {
                    throw new TypeError('Method Map.prototype.has called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 3. If M does not have a [[MapData]] internal slot, throw a TypeError exception.
                if (M._es6Map !== true) {
                    throw new TypeError('Method Map.prototype.has called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 4. Let entries be the List that is M.[[MapData]].
                // 5. For each Record {[[Key]], [[Value]]} p that is an element of entries, do
                    // a. If p.[[Key]] is not empty and SameValueZero(p.[[Key]], key) is true, return true.
                // 6. Return false.
    
                // Implement steps 4-6 with a more optimal algo
                var recordIndex = getRecordIndex(M, key); // O(1) access to record index
                if (recordIndex !== false) {
                    var recordKey = M._keys[recordIndex];
                    if (recordKey !== undefMarker && SameValueZero(recordKey, key)) {
                        return true;
                    }
                }
    
                return false;
            });
    
        // 23.1.3.8. Map.prototype.keys ( )
        CreateMethodProperty(Map.prototype, 'keys', function keys () {
                // 1. Let M be the this value.
                var M = this;
                // 2. Return ? CreateMapIterator(M, "key").
                return CreateMapIterator(M, "key");
            });
    
        // 23.1.3.9. Map.prototype.set ( key, value )
        CreateMethodProperty(Map.prototype, 'set', function set(key, value) {
                // 1. Let M be the this value.
                var M = this;
                // 2. If Type(M) is not Object, throw a TypeError exception.
                if (Type(M) !== 'object') {
                    throw new TypeError('Method Map.prototype.set called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 3. If M does not have a [[MapData]] internal slot, throw a TypeError exception.
                if (M._es6Map !== true) {
                    throw new TypeError('Method Map.prototype.set called on incompatible receiver ' + Object.prototype.toString.call(M));
                }
                // 4. Let entries be the List that is M.[[MapData]].
                // 5. For each Record {[[Key]], [[Value]]} p that is an element of entries, do
                // 6. If key is -0, let key be +0.
                // 7. Let p be the Record {[[Key]]: key, [[Value]]: value}.
                // 8. Append p as the last element of entries.
                // 9. Return M.
    
                // Strictly following the above steps 4-9 will lead to an inefficient algorithm.
                // Step 8 also doesn't seem to be required if an entry already exists
                var recordIndex = getRecordIndex(M, key); // O(1) access to record index
                if (recordIndex !== false) {
                    // update path
                    M._values[recordIndex] = value;
                } else {
                    // eslint-disable-next-line no-compare-neg-zero
                    if (key === -0) {
                        key = 0;
                    }
                    var p = {
                        '[[Key]]': key,
                        '[[Value]]': value
                    };
                    M._keys.push(p['[[Key]]']);
                    M._values.push(p['[[Value]]']);
                    setHashIndex(M, key, M._keys.length - 1); // update lookup table
                    ++M._size;
                    if (!supportsGetters) {
                        M.size = M._size;
                    }
                }
                return M;
            });
    
        // 23.1.3.10. get Map.prototype.size
        if (supportsGetters) {
            Object.defineProperty(Map.prototype, 'size', {
                configurable: true,
                enumerable: false,
                get: function () {
                    // 1. Let M be the this value.
                    var M = this;
                    // 2. If Type(M) is not Object, throw a TypeError exception.
                    if (Type(M) !== 'object') {
                        throw new TypeError('Method Map.prototype.size called on incompatible receiver ' + Object.prototype.toString.call(M));
                    }
                    // 3. If M does not have a [[MapData]] internal slot, throw a TypeError exception.
                    if (M._es6Map !== true) {
                        throw new TypeError('Method Map.prototype.size called on incompatible receiver ' + Object.prototype.toString.call(M));
                    }
                    // 4. Let entries be the List that is M.[[MapData]].
                    // 5. Let count be 0.
                    // 6. For each Record {[[Key]], [[Value]]} p that is an element of entries, do
                        // 6a. If p.[[Key]] is not empty, set count to count+1.
                    // 7. Return count.
    
                    // Implement 4-7 more efficently by returning pre-computed property
                    return this._size;
                },
                set: undefined
            });
        }
    
        // 23.1.3.11. Map.prototype.values ( )
        CreateMethodProperty(Map.prototype, 'values', function values () {
                // 1. Let M be the this value.
                var M = this;
                // 2. Return ? CreateMapIterator(M, "value").
                return CreateMapIterator(M, 'value');
            }
        );
    
        // 23.1.3.12. Map.prototype [ @@iterator ] ( )
        // The initial value of the @@iterator property is the same function object as the initial value of the entries property.
        CreateMethodProperty(Map.prototype, Symbol.iterator, Map.prototype.entries);
    
        // 23.1.3.13. Map.prototype [ @@toStringTag ]
        // The initial value of the @@toStringTag property is the String value "Map".
        // This property has the attributes { [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: true }.
    
        // Polyfill.io - Safari 8 implements Map.name but as a non-configurable property, which means it would throw an error if we try and configure it here.
        if (!('name' in Map)) {
            // 19.2.4.2 name
            Object.defineProperty(Map, 'name', {
                configurable: true,
                enumerable: false,
                writable: false,
                value: 'Map'
            });
        }
    
        // 23.1.5.1. CreateMapIterator ( map, kind )
        function CreateMapIterator(map, kind) {
            // 1. If Type(map) is not Object, throw a TypeError exception.
            if (Type(map) !== 'object') {
                throw new TypeError('createMapIterator called on incompatible receiver ' + Object.prototype.toString.call(map));
            }
            // 2. If map does not have a [[MapData]] internal slot, throw a TypeError exception.
            if (map._es6Map !== true) {
                throw new TypeError('createMapIterator called on incompatible receiver ' + Object.prototype.toString.call(map));
            }
            // 3. Let iterator be ObjectCreate(%MapIteratorPrototype%, « [[Map]], [[MapNextIndex]], [[MapIterationKind]] »).
            var iterator = Object.create(MapIteratorPrototype);
            // 4. Set iterator.[[Map]] to map.
            Object.defineProperty(iterator, '[[Map]]', {
                configurable: true,
                enumerable: false,
                writable: true,
                value: map
            });
            // 5. Set iterator.[[MapNextIndex]] to 0.
            Object.defineProperty(iterator, '[[MapNextIndex]]', {
                configurable: true,
                enumerable: false,
                writable: true,
                value: 0
            });
            // 6. Set iterator.[[MapIterationKind]] to kind.
            Object.defineProperty(iterator, '[[MapIterationKind]]', {
                configurable: true,
                enumerable: false,
                writable: true,
                value: kind
            });
            // 7. Return iterator.
            return iterator;
        }
    
        // 23.1.5.2. The %MapIteratorPrototype% Object
        var MapIteratorPrototype = {};
        // Polyfill.io - We use this as a quick way to check if an object is a Map Iterator instance.
        Object.defineProperty(MapIteratorPrototype, 'isMapIterator', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true
        });
    
        // 23.1.5.2.1. %MapIteratorPrototype%.next ( )
        CreateMethodProperty(MapIteratorPrototype, 'next', function next() {
                // 1. Let O be the this value.
                var O = this;
                // 2. If Type(O) is not Object, throw a TypeError exception.
                if (Type(O) !== 'object') {
                    throw new TypeError('Method %MapIteratorPrototype%.next called on incompatible receiver ' + Object.prototype.toString.call(O));
                }
                // 3. If O does not have all of the internal slots of a Map Iterator Instance (23.1.5.3), throw a TypeError exception.
                if (!O.isMapIterator) {
                    throw new TypeError('Method %MapIteratorPrototype%.next called on incompatible receiver ' + Object.prototype.toString.call(O));
                }
                // 4. Let m be O.[[Map]].
                var m = O['[[Map]]'];
                // 5. Let index be O.[[MapNextIndex]].
                var index = O['[[MapNextIndex]]'];
                // 6. Let itemKind be O.[[MapIterationKind]].
                var itemKind = O['[[MapIterationKind]]'];
                // 7. If m is undefined, return CreateIterResultObject(undefined, true).
                if (m === undefined) {
                    return CreateIterResultObject(undefined, true);
                }
                // 8. Assert: m has a [[MapData]] internal slot.
                if (!m._es6Map) {
                    throw new Error(Object.prototype.toString.call(m) + ' has a [[MapData]] internal slot.');
                }
                // 9. Let entries be the List that is m.[[MapData]].
                var entries = m._keys;
                // 10. Let numEntries be the number of elements of entries.
                var numEntries = entries.length;
                // 11. NOTE: numEntries must be redetermined each time this method is evaluated.
                // 12. Repeat, while index is less than numEntries,
                while (index < numEntries) {
                    // a. Let e be the Record {[[Key]], [[Value]]} that is the value of entries[index].
                    var e = Object.create(null);
                    e['[[Key]]'] = m._keys[index];
                    e['[[Value]]'] = m._values[index];
                    // b. Set index to index+1.
                    index = index + 1;
                    // c. Set O.[[MapNextIndex]] to index.
                    O['[[MapNextIndex]]'] = index;
                    // d. If e.[[Key]] is not empty, then
                    if (e['[[Key]]'] !== undefMarker) {
                        // i. If itemKind is "key", let result be e.[[Key]].
                        if (itemKind === 'key') {
                            var result = e['[[Key]]'];
                            // ii. Else if itemKind is "value", let result be e.[[Value]].
                        } else if (itemKind === 'value') {
                            result = e['[[Value]]'];
                            // iii. Else,
                        } else {
                            // 1. Assert: itemKind is "key+value".
                            if (itemKind !== 'key+value') {
                                throw new Error();
                            }
                            // 2. Let result be CreateArrayFromList(« e.[[Key]], e.[[Value]] »).
                            result = [
                                e['[[Key]]'],
                                e['[[Value]]']
                            ];
                        }
                        // iv. Return CreateIterResultObject(result, false).
                        return CreateIterResultObject(result, false);
                    }
                }
                // 13. Set O.[[Map]] to undefined.
                O['[[Map]]'] = undefined;
                // 14. Return CreateIterResultObject(undefined, true).
                return CreateIterResultObject(undefined, true);
            }
        );
    
        // 23.1.5.2.2 %MapIteratorPrototype% [ @@toStringTag ]
        // The initial value of the @@toStringTag property is the String value "Map Iterator".
        // This property has the attributes { [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: true }.
    
        CreateMethodProperty(MapIteratorPrototype, Symbol.iterator, function iterator() {
                return this;
            }
        );
    
        // Export the object
        try {
            CreateMethodProperty(global, 'Map', Map);
        } catch (e) {
            // IE8 throws an error here if we set enumerable to false.
            // More info on table 2: https://msdn.microsoft.com/en-us/library/dd229916(v=vs.85).aspx
            global.Map = Map;
        }
    }(self));
    })
    ('object' === typeof window && window || 'object' === typeof self && self || 'object' === typeof global && global || {});
    