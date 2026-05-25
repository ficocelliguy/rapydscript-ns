// js-globals-dts.js — Built-in TypeScript declarations for common JS / browser
// API globals (navigator, window, document, location, history, screen,
// localStorage, sessionStorage, console, Object, Array, Promise, Date, Map,
// Set, Math, JSON, performance, fetch, ...).
//
// This file is auto-loaded by the language service at construction time so
// that hovering, identifier completion, and member dot-completion work for
// the standard browser/JS environment without consumers needing to ship
// their own lib.dom.d.ts.
//
// The DTS subset understood by src/monaco-language-service/dts.js is small:
// `declare var`, `declare function`, `interface`, `declare class … extends …`,
// `declare namespace`. Members are simple `name: Type` and `name(...): Type`
// signatures. Nested types inside namespaces/classes are not parsed. Keep all
// type references at the top level.

export const JS_GLOBALS_DTS = `
// ── Console ─────────────────────────────────────────────────────────────────

interface Console {
    /** Output a message at the "log" level. */
    log(...args: any): void;
    /** Output a message at the "info" level. */
    info(...args: any): void;
    /** Output a message at the "warn" level. */
    warn(...args: any): void;
    /** Output a message at the "error" level. */
    error(...args: any): void;
    /** Output a message at the "debug" level. */
    debug(...args: any): void;
    /** Output an interactive listing of the properties of an object. */
    dir(obj: any): void;
    /** Display tabular data as a table. */
    table(data: any, columns?: string[]): void;
    /** Print a stack trace to the console. */
    trace(...args: any): void;
    /** Start a new console group with the given label. */
    group(...args: any): void;
    /** Start a new collapsed console group with the given label. */
    groupCollapsed(...args: any): void;
    /** Exit the current console group. */
    groupEnd(): void;
    /** Start a timer with the given label. */
    time(label?: string): void;
    /** Log the elapsed time of a timer started with console.time. */
    timeEnd(label?: string): void;
    /** Log an intermediate elapsed time for a running timer. */
    timeLog(label?: string, ...args: any): void;
    /** Clear the console output. */
    clear(): void;
    /** Log the number of times this call has been invoked with the given label. */
    count(label?: string): void;
    /** Reset the counter for the given label. */
    countReset(label?: string): void;
    /** Assert that an expression is truthy; log a message if it is not. */
    assert(condition: any, ...args: any): void;
}
/** Global console object for printing to the developer console. */
declare var console: Console;

// ── Math ────────────────────────────────────────────────────────────────────

/**
 * Built-in object that has properties and methods for mathematical constants
 * and functions. Not a function object — Math works with the Number type.
 */
declare namespace Math {
    /** The ratio of a circle's circumference to its diameter. */
    const PI: number;
    /** Euler's constant, the base of natural logarithms. */
    const E: number;
    /** Natural logarithm of 2. */
    const LN2: number;
    /** Natural logarithm of 10. */
    const LN10: number;
    /** Base-2 logarithm of E. */
    const LOG2E: number;
    /** Base-10 logarithm of E. */
    const LOG10E: number;
    /** Square root of 1/2. */
    const SQRT1_2: number;
    /** Square root of 2. */
    const SQRT2: number;
    /** Return the absolute value of x. */
    function abs(x: number): number;
    /** Return the arccosine of x in radians. */
    function acos(x: number): number;
    /** Return the hyperbolic arccosine of x. */
    function acosh(x: number): number;
    /** Return the arcsine of x in radians. */
    function asin(x: number): number;
    /** Return the hyperbolic arcsine of x. */
    function asinh(x: number): number;
    /** Return the arctangent of x in radians. */
    function atan(x: number): number;
    /** Return the arctangent of the quotient of its arguments. */
    function atan2(y: number, x: number): number;
    /** Return the hyperbolic arctangent of x. */
    function atanh(x: number): number;
    /** Return the cube root of x. */
    function cbrt(x: number): number;
    /** Return the smallest integer greater than or equal to x. */
    function ceil(x: number): number;
    /** Return the number of leading zero bits in the 32-bit binary representation of x. */
    function clz32(x: number): number;
    /** Return the cosine of x (x in radians). */
    function cos(x: number): number;
    /** Return the hyperbolic cosine of x. */
    function cosh(x: number): number;
    /** Return e raised to the power of x. */
    function exp(x: number): number;
    /** Return e^x - 1 for very small x. */
    function expm1(x: number): number;
    /** Return the largest integer less than or equal to x. */
    function floor(x: number): number;
    /** Return the nearest single-precision float representation of x. */
    function fround(x: number): number;
    /** Return the square root of the sum of squares of its arguments. */
    function hypot(...values: number[]): number;
    /** Return the result of a 32-bit integer multiplication. */
    function imul(a: number, b: number): number;
    /** Return the natural logarithm (base e) of x. */
    function log(x: number): number;
    /** Return the base-10 logarithm of x. */
    function log10(x: number): number;
    /** Return the natural logarithm of 1 + x. */
    function log1p(x: number): number;
    /** Return the base-2 logarithm of x. */
    function log2(x: number): number;
    /** Return the largest of the given numbers. */
    function max(...values: number[]): number;
    /** Return the smallest of the given numbers. */
    function min(...values: number[]): number;
    /** Return base raised to the exponent power. */
    function pow(base: number, exponent: number): number;
    /** Return a pseudo-random number between 0 (inclusive) and 1 (exclusive). */
    function random(): number;
    /** Return the value of x rounded to the nearest integer. */
    function round(x: number): number;
    /** Return the sign of x: 1, -1, 0, -0, or NaN. */
    function sign(x: number): number;
    /** Return the sine of x (x in radians). */
    function sin(x: number): number;
    /** Return the hyperbolic sine of x. */
    function sinh(x: number): number;
    /** Return the positive square root of x. */
    function sqrt(x: number): number;
    /** Return the tangent of x (x in radians). */
    function tan(x: number): number;
    /** Return the hyperbolic tangent of x. */
    function tanh(x: number): number;
    /** Return the integer part of x, removing any fractional digits. */
    function trunc(x: number): number;
}

// ── JSON ────────────────────────────────────────────────────────────────────

/**
 * The JSON object contains methods for parsing JSON and converting values to JSON.
 */
declare namespace JSON {
    /** Parse a JSON string into a JavaScript value. */
    function parse(text: string, reviver?: any): any;
    /** Convert a JavaScript value to a JSON string. */
    function stringify(value: any, replacer?: any, space?: any): string;
}

// ── Object ──────────────────────────────────────────────────────────────────

interface ObjectConstructor {
    /** Return an array of a given object's own enumerable property names. */
    keys(obj: any): string[];
    /** Return an array of a given object's own enumerable property values. */
    values(obj: any): any[];
    /** Return an array of a given object's own enumerable [key, value] pairs. */
    entries(obj: any): any[];
    /** Create a new object from a list of [key, value] pairs. */
    fromEntries(entries: any): any;
    /** Copy all enumerable own properties from one or more source objects to a target object. */
    assign(target: any, ...sources: any[]): any;
    /** Freeze an object so it cannot be modified. */
    freeze(obj: any): any;
    /** Return true if the object is frozen. */
    isFrozen(obj: any): boolean;
    /** Seal an object so new properties cannot be added. */
    seal(obj: any): any;
    /** Return true if the object is sealed. */
    isSealed(obj: any): boolean;
    /** Create a new object with the specified prototype and properties. */
    create(proto: any, properties?: any): any;
    /** Define a new property on an object. */
    defineProperty(obj: any, key: string, descriptor: any): any;
    /** Define multiple new properties on an object. */
    defineProperties(obj: any, descriptors: any): any;
    /** Return the property descriptor for a named property of an object. */
    getOwnPropertyDescriptor(obj: any, key: string): any;
    /** Return all own property descriptors for an object. */
    getOwnPropertyDescriptors(obj: any): any;
    /** Return an array of all own property names (including non-enumerable). */
    getOwnPropertyNames(obj: any): string[];
    /** Return an array of all own symbol properties. */
    getOwnPropertySymbols(obj: any): any[];
    /** Return the prototype of an object. */
    getPrototypeOf(obj: any): any;
    /** Set the prototype of an object. */
    setPrototypeOf(obj: any, proto: any): any;
    /** Return true if the two values are the same value (similar to ===, with special handling for NaN). */
    is(a: any, b: any): boolean;
    /** Return true if obj has the named property as an own (not inherited) property. */
    hasOwn(obj: any, key: string): boolean;
    /** Prevent extensions to an object. */
    preventExtensions(obj: any): any;
    /** Return true if an object cannot have new properties added. */
    isExtensible(obj: any): boolean;
}
/** Global Object constructor — also provides static helpers like Object.keys. */
declare var Object: ObjectConstructor;

// ── Array ───────────────────────────────────────────────────────────────────

interface ArrayConstructor {
    /** Return true if the value is an Array. */
    isArray(value: any): boolean;
    /** Create a new array from an array-like or iterable. */
    from(iterable: any, mapFn?: any, thisArg?: any): any[];
    /** Create a new array containing the given arguments. */
    of(...items: any[]): any[];
}
/** Global Array constructor — also provides static helpers like Array.isArray. */
declare var Array: ArrayConstructor;

// ── Number ──────────────────────────────────────────────────────────────────

interface NumberConstructor {
    /** Largest representable positive finite numeric value (~1.7976931348623157e+308). */
    MAX_VALUE: number;
    /** Smallest positive representable number greater than 0 (~5e-324). */
    MIN_VALUE: number;
    /** Largest integer that can be safely represented (2^53 - 1). */
    MAX_SAFE_INTEGER: number;
    /** Smallest integer that can be safely represented (-(2^53 - 1)). */
    MIN_SAFE_INTEGER: number;
    /** Difference between 1 and the smallest float greater than 1. */
    EPSILON: number;
    /** Positive infinity value. */
    POSITIVE_INFINITY: number;
    /** Negative infinity value. */
    NEGATIVE_INFINITY: number;
    /** Special "Not a Number" value. */
    NaN: number;
    /** Return true if the value is NaN (no coercion). */
    isNaN(value: any): boolean;
    /** Return true if the value is a finite number (no coercion). */
    isFinite(value: any): boolean;
    /** Return true if the value is an integer. */
    isInteger(value: any): boolean;
    /** Return true if the value is a safe integer. */
    isSafeInteger(value: any): boolean;
    /** Parse a string and return a floating point number. */
    parseFloat(value: string): number;
    /** Parse a string and return an integer in the given radix. */
    parseInt(value: string, radix?: number): number;
}
/** Global Number constructor and namespace of numeric constants/helpers. */
declare var Number: NumberConstructor;

// ── Promise ─────────────────────────────────────────────────────────────────

interface PromiseConstructor {
    /** Return a Promise resolved with the given value. */
    resolve(value?: any): any;
    /** Return a Promise rejected with the given reason. */
    reject(reason?: any): any;
    /** Wait for all promises to resolve, or reject when any rejects. */
    all(promises: any): any;
    /** Resolve or reject as soon as one of the input promises settles. */
    race(promises: any): any;
    /** Resolve when every promise has settled (fulfilled or rejected). */
    allSettled(promises: any): any;
    /** Resolve as soon as any promise fulfils, or reject if all reject. */
    any(promises: any): any;
}
/** Promise constructor — also provides static helpers like Promise.all. */
declare var Promise: PromiseConstructor;

// ── Date ────────────────────────────────────────────────────────────────────

interface DateConstructor {
    /** Return the current time as milliseconds since the Unix epoch. */
    now(): number;
    /** Parse a date string and return milliseconds since the Unix epoch. */
    parse(s: string): number;
    /** Return milliseconds since the Unix epoch for the given UTC components. */
    UTC(year: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): number;
}
/** Date constructor — also provides static helpers like Date.now. */
declare var Date: DateConstructor;

// ── Symbol ──────────────────────────────────────────────────────────────────

interface SymbolConstructor {
    /** Well-known symbol used to define iterator behavior. */
    iterator: any;
    /** Well-known symbol used to define async iterator behavior. */
    asyncIterator: any;
    /** Well-known symbol used by instanceof checks. */
    hasInstance: any;
    /** Well-known symbol used to override default toPrimitive conversion. */
    toPrimitive: any;
    /** Look up a symbol in the global symbol registry. */
    for(key: string): any;
    /** Return the key for a symbol previously registered with Symbol.for. */
    keyFor(sym: any): string;
}
/** Symbol constructor — also exposes well-known symbols like Symbol.iterator. */
declare var Symbol: SymbolConstructor;

// ── Reflect ─────────────────────────────────────────────────────────────────

declare namespace Reflect {
    /** Get a property from an object. */
    function get(target: any, key: any, receiver?: any): any;
    /** Set a property on an object. */
    function set(target: any, key: any, value: any, receiver?: any): boolean;
    /** Return true if the property exists on the object or its prototype chain. */
    function has(target: any, key: any): boolean;
    /** Delete a property from an object. */
    function deleteProperty(target: any, key: any): boolean;
    /** Return an array of the target's own property keys. */
    function ownKeys(target: any): any[];
    /** Invoke a function with the given arguments and this-binding. */
    function apply(target: any, thisArg: any, args: any[]): any;
    /** Call a constructor with the given arguments. */
    function construct(target: any, args: any[], newTarget?: any): any;
    /** Define a property on an object. */
    function defineProperty(target: any, key: any, descriptor: any): boolean;
    /** Get an own property descriptor for a target object. */
    function getOwnPropertyDescriptor(target: any, key: any): any;
    /** Return the prototype of an object. */
    function getPrototypeOf(target: any): any;
    /** Set the prototype of an object. */
    function setPrototypeOf(target: any, proto: any): boolean;
    /** Prevent new properties from being added to an object. */
    function preventExtensions(target: any): boolean;
    /** Return true if new properties can still be added. */
    function isExtensible(target: any): boolean;
}

// ── Map / Set / WeakMap / WeakSet (constructors only — instance methods are
//     resolved through the class hierarchy by Monaco itself) ────────────────

interface MapConstructor {}
/** Map constructor — call as new Map([...entries]). */
declare var Map: MapConstructor;

interface SetConstructor {}
/** Set constructor — call as new Set([...items]). */
declare var Set: SetConstructor;

interface WeakMapConstructor {}
/** WeakMap constructor — call as new WeakMap([...entries]). */
declare var WeakMap: WeakMapConstructor;

interface WeakSetConstructor {}
/** WeakSet constructor — call as new WeakSet([...items]). */
declare var WeakSet: WeakSetConstructor;

// ── Storage (localStorage / sessionStorage) ─────────────────────────────────

interface Storage {
    /** Number of key/value pairs currently stored. */
    length: number;
    /** Return the value associated with the given key. */
    getItem(key: string): string;
    /** Store the value against the given key (replaces existing value). */
    setItem(key: string, value: string): void;
    /** Remove the entry with the given key. */
    removeItem(key: string): void;
    /** Remove all entries from this Storage. */
    clear(): void;
    /** Return the key at the given numeric index, or null. */
    key(index: number): string;
}
/** Persistent per-origin key/value storage (survives reloads). */
declare var localStorage: Storage;
/** Per-tab key/value storage (cleared when the tab is closed). */
declare var sessionStorage: Storage;

// ── Location ────────────────────────────────────────────────────────────────

interface Location {
    /** The entire URL. */
    href: string;
    /** The protocol scheme of the URL including the trailing colon (e.g. "https:"). */
    protocol: string;
    /** The host (hostname + port if present). */
    host: string;
    /** The hostname only (no port). */
    hostname: string;
    /** The port number as a string. */
    port: string;
    /** The path portion of the URL. */
    pathname: string;
    /** The query-string portion of the URL, including the leading "?". */
    search: string;
    /** The fragment portion of the URL, including the leading "#". */
    hash: string;
    /** The origin (scheme + host + port). */
    origin: string;
    /** Load the resource at the given URL. */
    assign(url: string): void;
    /** Replace the current resource with the one at the given URL. */
    replace(url: string): void;
    /** Reload the current page. */
    reload(): void;
    /** Return the string representation of the URL. */
    toString(): string;
}
/** Global Location object representing the current URL. */
declare var location: Location;

// ── History ─────────────────────────────────────────────────────────────────

interface History {
    /** Number of entries in the session history. */
    length: number;
    /** Last value passed to pushState or replaceState. */
    state: any;
    /** Go back one entry in the session history. */
    back(): void;
    /** Go forward one entry in the session history. */
    forward(): void;
    /** Move to a relative position in the session history. */
    go(delta?: number): void;
    /** Push a new entry onto the session history stack. */
    pushState(state: any, title: string, url?: string): void;
    /** Replace the current session history entry. */
    replaceState(state: any, title: string, url?: string): void;
    /** Controls when the browser scroll position is restored ("auto" | "manual"). */
    scrollRestoration: string;
}
/** Global History object for the current document. */
declare var history: History;

// ── Screen ──────────────────────────────────────────────────────────────────

interface Screen {
    /** Width of the screen in CSS pixels. */
    width: number;
    /** Height of the screen in CSS pixels. */
    height: number;
    /** Available width (excluding system UI like the dock or taskbar). */
    availWidth: number;
    /** Available height (excluding system UI like the dock or taskbar). */
    availHeight: number;
    /** Bit depth of the colour palette. */
    colorDepth: number;
    /** Pixel depth of the screen. */
    pixelDepth: number;
    /** Current screen orientation (object with type/angle). */
    orientation: any;
}
/** Global Screen object describing the user's display. */
declare var screen: Screen;

// ── Navigator ───────────────────────────────────────────────────────────────

interface Clipboard {
    /** Read text from the system clipboard. Returns a Promise<string>. */
    readText(): any;
    /** Write text to the system clipboard. Returns a Promise<void>. */
    writeText(text: string): any;
    /** Read clipboard contents as an array of ClipboardItem objects. */
    read(): any;
    /** Write an array of ClipboardItem objects to the clipboard. */
    write(items: any): any;
}

interface Geolocation {
    /** Get the current geographic position. */
    getCurrentPosition(success: any, error?: any, options?: any): void;
    /** Subscribe to position updates. Returns a watch ID. */
    watchPosition(success: any, error?: any, options?: any): number;
    /** Cancel a position watch previously set with watchPosition. */
    clearWatch(id: number): void;
}

interface MediaDevices {
    /** Prompt for permission and return a stream from selected devices. */
    getUserMedia(constraints: any): any;
    /** Prompt for permission and return a stream of the user's screen. */
    getDisplayMedia(constraints?: any): any;
    /** Enumerate available input/output media devices. */
    enumerateDevices(): any;
    /** Return the set of media constraints supported by the user agent. */
    getSupportedConstraints(): any;
}

interface Permissions {
    /** Query the state of a permission. Returns a Promise<PermissionStatus>. */
    query(descriptor: any): any;
}

interface ServiceWorkerContainer {
    /** Register a service worker script. */
    register(scriptURL: string, options?: any): any;
    /** Currently controlling service worker, or null. */
    controller: any;
    /** Resolves with a service worker registration when one is ready. */
    ready: any;
}

interface StorageManager {
    /** Estimate the storage usage and quota for the origin. */
    estimate(): any;
    /** Request persistent storage for the origin. */
    persist(): any;
    /** Return true if storage for the origin is persistent. */
    persisted(): any;
}

interface Navigator {
    /** Identifying string for the user agent. */
    userAgent: string;
    /** Preferred language for the user, as a BCP 47 tag. */
    language: string;
    /** Array of the user's preferred languages, most preferred first. */
    languages: string[];
    /** A string representing the platform the browser is running on. */
    platform: string;
    /** The vendor name of the browser (often "" in modern browsers). */
    vendor: string;
    /** Whether the browser is currently online. */
    onLine: boolean;
    /** Whether cookies are enabled. */
    cookieEnabled: boolean;
    /** Number of logical processors available to the user agent. */
    hardwareConcurrency: number;
    /** Maximum number of simultaneous touch contacts supported by the device. */
    maxTouchPoints: number;
    /** Approximate amount of device memory in gigabytes. */
    deviceMemory: number;
    /** Clipboard API entry point. */
    clipboard: Clipboard;
    /** Geolocation API entry point. */
    geolocation: Geolocation;
    /** Media-device access (getUserMedia, getDisplayMedia, …). */
    mediaDevices: MediaDevices;
    /** Permissions API entry point. */
    permissions: Permissions;
    /** Service-worker container for the document. */
    serviceWorker: ServiceWorkerContainer;
    /** Persistent storage information for the origin. */
    storage: StorageManager;
    /** Asynchronously send a small HTTP request that survives page unload. */
    sendBeacon(url: string, data?: any): boolean;
    /** Cause the device to vibrate (mobile only). */
    vibrate(pattern: any): boolean;
    /** Register a protocol handler. */
    registerProtocolHandler(scheme: string, url: string, title?: string): void;
}
/** Global Navigator object describing the user agent. */
declare var navigator: Navigator;

// ── Document ────────────────────────────────────────────────────────────────

interface Document {
    /** Document title (the contents of <title>). */
    title: string;
    /** The URL of the current document. */
    URL: string;
    /** The document's base URI. */
    baseURI: string;
    /** The character set in use by the document. */
    characterSet: string;
    /** Whether the document is in a hidden tab ("visible" | "hidden"). */
    visibilityState: string;
    /** Whether the document is currently hidden. */
    hidden: boolean;
    /** Cookie string for the document. */
    cookie: string;
    /** Domain of the document. */
    domain: string;
    /** Last-modified date of the document as a string. */
    lastModified: string;
    /** Where the document was loaded from. */
    referrer: string;
    /** The currently focused element, or null. */
    activeElement: any;
    /** The <body> element of the document. */
    body: any;
    /** The <head> element of the document. */
    head: any;
    /** The <html> root element. */
    documentElement: any;
    /** The current full-screen element, or null. */
    fullscreenElement: any;
    /** Return the element with the given id, or null. */
    getElementById(id: string): any;
    /** Return a live list of elements with the given tag name. */
    getElementsByTagName(name: string): any;
    /** Return a live list of elements with the given class name. */
    getElementsByClassName(className: string): any;
    /** Return a live list of elements with the given name attribute. */
    getElementsByName(name: string): any;
    /** Return the first element matching the CSS selector. */
    querySelector(selector: string): any;
    /** Return a static list of all elements matching the CSS selector. */
    querySelectorAll(selector: string): any;
    /** Create a new element with the given tag name. */
    createElement(tagName: string, options?: any): any;
    /** Create a new element in the given XML namespace. */
    createElementNS(namespace: string, qualifiedName: string): any;
    /** Create a new text node containing the given string. */
    createTextNode(data: string): any;
    /** Create a new document fragment. */
    createDocumentFragment(): any;
    /** Create a new comment node. */
    createComment(data: string): any;
    /** Add an event listener for the given event type. */
    addEventListener(type: string, listener: any, options?: any): void;
    /** Remove a previously-added event listener. */
    removeEventListener(type: string, listener: any, options?: any): void;
    /** Synchronously invoke event listeners for the given event. */
    dispatchEvent(event: any): boolean;
    /** Begin a write to the document stream. */
    write(...args: any): void;
    /** Begin a write to the document stream and append a newline. */
    writeln(...args: any): void;
    /** Open the document for writing. */
    open(...args: any): any;
    /** Close the document stream opened with open(). */
    close(): void;
    /** Whether design-mode editing is enabled ("on" | "off"). */
    designMode: string;
    /** Execute a formatting command on the editable region. */
    execCommand(command: string, showUI?: boolean, value?: any): boolean;
    /** Return true if a formatting command can be executed in the current state. */
    queryCommandEnabled(command: string): boolean;
    /** Return true if the formatting command is currently active. */
    queryCommandState(command: string): boolean;
    /** Return the current value of the formatting command. */
    queryCommandValue(command: string): string;
    /** Exit full-screen mode. */
    exitFullscreen(): any;
    /** Adopt a node from another document. */
    adoptNode(node: any): any;
    /** Import a node from another document (copy only). */
    importNode(node: any, deep?: boolean): any;
}
/** Global Document object for the current page. */
declare var document: Document;

// ── Window ──────────────────────────────────────────────────────────────────

interface Window {
    /** Reference to the window itself. */
    window: Window;
    /** Reference to the global object (alias for window). */
    self: Window;
    /** Reference to the topmost window in the window hierarchy. */
    top: Window;
    /** Reference to the parent window, or itself if there is no parent. */
    parent: Window;
    /** Reference to the window that opened the current window. */
    opener: Window;
    /** Reference to a separate object representing the visual viewport. */
    visualViewport: any;
    /** Document object loaded in the window. */
    document: Document;
    /** Location object for the window. */
    location: Location;
    /** Session history object. */
    history: History;
    /** Screen object describing the user's display. */
    screen: Screen;
    /** Navigator object describing the user agent. */
    navigator: Navigator;
    /** Persistent per-origin Storage object. */
    localStorage: Storage;
    /** Per-tab Storage object. */
    sessionStorage: Storage;
    /** Console object. */
    console: Console;
    /** Width of the window's inner viewport, including the vertical scroll bar. */
    innerWidth: number;
    /** Height of the window's inner viewport. */
    innerHeight: number;
    /** Width of the outside of the browser window. */
    outerWidth: number;
    /** Height of the outside of the browser window. */
    outerHeight: number;
    /** Horizontal pixel offset that the document has been scrolled. */
    scrollX: number;
    /** Vertical pixel offset that the document has been scrolled. */
    scrollY: number;
    /** Alias for scrollX. */
    pageXOffset: number;
    /** Alias for scrollY. */
    pageYOffset: number;
    /** Device pixel ratio (CSS pixels per physical pixel). */
    devicePixelRatio: number;
    /** Display a modal alert dialog with the given message. */
    alert(message?: any): void;
    /** Display a modal confirmation dialog; return true if OK was clicked. */
    confirm(message?: string): boolean;
    /** Display a modal prompt dialog; return the user's input or null. */
    prompt(message?: string, defaultValue?: string): string;
    /** Open a new browser window. */
    open(url?: string, target?: string, features?: string): Window;
    /** Close the current window. */
    close(): void;
    /** Focus the window. */
    focus(): void;
    /** Remove focus from the window. */
    blur(): void;
    /** Stop the page from loading. */
    stop(): void;
    /** Open the browser's print dialog. */
    print(): void;
    /** Scroll the window to the given coordinates. */
    scrollTo(x: any, y?: any): void;
    /** Scroll the window by the given offset. */
    scrollBy(x: any, y?: any): void;
    /** Move the window so that its top-left corner is at the given coordinates. */
    moveTo(x: number, y: number): void;
    /** Move the window by the given offset. */
    moveBy(x: number, y: number): void;
    /** Resize the window so that its outer dimensions match the given size. */
    resizeTo(width: number, height: number): void;
    /** Resize the window by the given amount. */
    resizeBy(dx: number, dy: number): void;
    /** Encode a string of binary data into base-64. */
    btoa(data: string): string;
    /** Decode a base-64 encoded string. */
    atob(data: string): string;
    /** Compute the CSS style of an element after styles have been applied. */
    getComputedStyle(element: any, pseudoElement?: string): any;
    /** Get the current Selection (highlighted text) on the page. */
    getSelection(): any;
    /** Schedule a callback to run before the next browser repaint. */
    requestAnimationFrame(callback: any): number;
    /** Cancel an animation-frame callback previously scheduled. */
    cancelAnimationFrame(id: number): void;
    /** Schedule a callback to run when the browser is idle. */
    requestIdleCallback(callback: any, options?: any): number;
    /** Cancel an idle-callback previously scheduled. */
    cancelIdleCallback(id: number): void;
    /** Match a CSS media query against the document. */
    matchMedia(query: string): any;
    /** Send a message to another window. */
    postMessage(message: any, targetOrigin: string, transfer?: any): void;
    /** Add an event listener for the given event type. */
    addEventListener(type: string, listener: any, options?: any): void;
    /** Remove a previously-added event listener. */
    removeEventListener(type: string, listener: any, options?: any): void;
    /** Synchronously invoke event listeners for the given event. */
    dispatchEvent(event: any): boolean;
    /** Fetch a resource from the network. Returns a Promise<Response>. */
    fetch(input: any, init?: any): any;
    /** Set a one-shot timer; returns a numeric handle. */
    setTimeout(handler: any, timeout?: number, ...args: any[]): number;
    /** Cancel a timer previously set with setTimeout. */
    clearTimeout(id: number): void;
    /** Set a repeating timer; returns a numeric handle. */
    setInterval(handler: any, timeout?: number, ...args: any[]): number;
    /** Cancel a timer previously set with setInterval. */
    clearInterval(id: number): void;
    /** Schedule a callback to run as soon as possible (non-standard / Node-only). */
    setImmediate(handler: any, ...args: any[]): number;
    /** Cancel a callback scheduled with setImmediate. */
    clearImmediate(id: number): void;
    /** Schedule a microtask to run after the current task completes. */
    queueMicrotask(callback: any): void;
    /** Create a structured-clone copy of the value. */
    structuredClone(value: any, options?: any): any;
    /** Generate a UUID v4 string (modern browsers). */
    crypto: any;
    /** Performance object exposing timing-related information. */
    performance: any;
}
/** The browser's global window object. In RapydScript it is also the implicit "this" at module scope. */
declare var window: Window;

// ── globalThis ──────────────────────────────────────────────────────────────

/** The universal global object — refers to window in browsers, global in Node, self in workers. */
declare var globalThis: any;

// ── Performance ─────────────────────────────────────────────────────────────

interface Performance {
    /** Return a high-resolution timestamp (milliseconds with sub-millisecond precision). */
    now(): number;
    /** Begin a performance mark with the given name. */
    mark(name: string, options?: any): any;
    /** Record a measurement between two marks. */
    measure(name: string, startMark?: any, endMark?: any): any;
    /** Return all performance entries matching a name. */
    getEntriesByName(name: string, type?: string): any[];
    /** Return all performance entries of a given type. */
    getEntriesByType(type: string): any[];
    /** Return all recorded performance entries. */
    getEntries(): any[];
    /** Clear all performance marks (or only those with the given name). */
    clearMarks(name?: string): void;
    /** Clear all performance measures (or only those with the given name). */
    clearMeasures(name?: string): void;
    /** Time at which the performance monitor started, in ms since the Unix epoch. */
    timeOrigin: number;
}
/** Global Performance object exposing timing data and high-resolution timers. */
declare var performance: Performance;

// ── Crypto ──────────────────────────────────────────────────────────────────

interface SubtleCrypto {
    /** Sign data using the given key. */
    sign(algorithm: any, key: any, data: any): any;
    /** Verify a signature using the given key. */
    verify(algorithm: any, key: any, signature: any, data: any): any;
    /** Compute a digest of the given data. */
    digest(algorithm: any, data: any): any;
    /** Encrypt data using the given key. */
    encrypt(algorithm: any, key: any, data: any): any;
    /** Decrypt data using the given key. */
    decrypt(algorithm: any, key: any, data: any): any;
    /** Generate a new key pair or symmetric key. */
    generateKey(algorithm: any, extractable: boolean, keyUsages: string[]): any;
    /** Derive a key from another key. */
    deriveKey(algorithm: any, baseKey: any, derivedAlgorithm: any, extractable: boolean, keyUsages: string[]): any;
    /** Derive bits from a key. */
    deriveBits(algorithm: any, baseKey: any, length: number): any;
    /** Import key material from an external format. */
    importKey(format: string, keyData: any, algorithm: any, extractable: boolean, keyUsages: string[]): any;
    /** Export a key to an external format. */
    exportKey(format: string, key: any): any;
    /** Wrap (encrypt) a key for safe transmission. */
    wrapKey(format: string, key: any, wrappingKey: any, wrapAlgorithm: any): any;
    /** Unwrap a previously wrapped key. */
    unwrapKey(format: string, wrappedKey: any, unwrappingKey: any, unwrapAlgorithm: any, unwrappedKeyAlgorithm: any, extractable: boolean, keyUsages: string[]): any;
}

interface Crypto {
    /** SubtleCrypto interface providing low-level cryptographic primitives. */
    subtle: SubtleCrypto;
    /** Fill the typed array with cryptographically strong random values. */
    getRandomValues(array: any): any;
    /** Generate a new random UUID v4 string. */
    randomUUID(): string;
}
/** Global Crypto object providing cryptographic primitives and RNG. */
declare var crypto: Crypto;

// ── URL / URLSearchParams ───────────────────────────────────────────────────

interface URLConstructor {
    /** Return true if the given string parses as a valid URL. */
    canParse(url: string, base?: string): boolean;
    /** Create a blob: URL referencing the given Blob/File/MediaSource. */
    createObjectURL(obj: any): string;
    /** Revoke a blob: URL previously returned by createObjectURL. */
    revokeObjectURL(url: string): void;
    /** Parse a URL and return a URL object, or null if invalid. */
    parse(url: string, base?: string): any;
}
/** URL constructor — also exposes static helpers like URL.createObjectURL. */
declare var URL: URLConstructor;

// ── Top-level functions ─────────────────────────────────────────────────────

/** Fetch a resource from the network. Returns a Promise<Response>. */
declare function fetch(input: any, init?: any): any;
/** Encode a string of binary data into base-64. */
declare function btoa(data: string): string;
/** Decode a base-64 encoded string. */
declare function atob(data: string): string;
/** Schedule a callback to run before the next browser repaint. */
declare function requestAnimationFrame(callback: any): number;
/** Cancel a previously scheduled animation-frame callback. */
declare function cancelAnimationFrame(id: number): void;
/** Schedule a callback to run when the browser is idle. */
declare function requestIdleCallback(callback: any, options?: any): number;
/** Cancel a previously scheduled idle callback. */
declare function cancelIdleCallback(id: number): void;
/** Schedule a microtask to run after the current task completes. */
declare function queueMicrotask(callback: any): void;
/** Create a structured-clone copy of the value. */
declare function structuredClone(value: any, options?: any): any;
/** Match a CSS media query against the document. */
declare function matchMedia(query: string): any;
/** Compute the CSS style of an element after styles have been applied. */
declare function getComputedStyle(element: any, pseudoElement?: string): any;
/** Display a modal alert dialog with the given message. */
declare function alert(message?: any): void;
/** Display a modal confirmation dialog; return true if OK was clicked. */
declare function confirm(message?: string): boolean;
/** Display a modal prompt dialog; return the user's input or null. */
declare function prompt(message?: string, defaultValue?: string): string;
`;
