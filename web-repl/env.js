/* vim:fileencoding=utf-8
 * 
 * Copyright (C) 2016 Kovid Goyal <kovid at kovidgoyal.net>
 *
 * Distributed under terms of the BSD license
 */

var namespace = {}, jsSHA = {};

var write_cache = {};

var builtin_modules = {
    'crypto' : {
        'createHash': function create_hash() {
            var ans = new jsSHA.jsSHA('SHA-1', 'TEXT');
            ans.digest = function hex_digest() { return ans.getHash('HEX'); };
            return ans;
        },
    },

    'vm': {
        'createContext': function create_context(ctx) {
            var iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            var win = iframe.contentWindow;
            if(!ctx) ctx = {};
            if (!ctx.sha1sum) ctx.sha1sum = sha1sum;
            if (!ctx.require) ctx.require = require;
            if (!ctx.React) ctx.React = (function() {
                var Fragment = Symbol('React.Fragment');

                function createElement(type, props) {
                    var children = Array.prototype.slice.call(arguments, 2);
                    return {
                        type: type,
                        props: Object.assign({children: children.length === 1 ? children[0] : children}, props)
                    };
                }

                // Minimal hook stubs — enough to run REPL snippets without React DOM.
                function useState(initial) {
                    var state = (typeof initial === 'function') ? initial() : initial;
                    return [state, function(v) { state = (typeof v === 'function') ? v(state) : v; }];
                }

                function useEffect(fn /*, deps */) {
                    var cleanup = fn();
                    // cleanup would be called on unmount; ignored in stub
                }

                function useLayoutEffect(fn /*, deps */) { fn(); }

                function useMemo(fn /*, deps */) { return fn(); }

                function useCallback(fn /*, deps */) { return fn; }

                function useRef(initial) { return { current: initial }; }

                function useContext(ctx) { return ctx && ctx._currentValue !== undefined ? ctx._currentValue : undefined; }

                function useReducer(reducer, initial, init) {
                    var state = (init !== undefined) ? init(initial) : initial;
                    return [state, function(action) { state = reducer(state, action); }];
                }

                function useImperativeHandle(ref, create /*, deps */) {
                    if (ref) ref.current = create();
                }

                function useDebugValue() {}

                function useId() { return ':r' + (Math.random() * 1e9 | 0) + ':'; }

                function useTransition() { return [false, function(fn) { fn(); }]; }

                function useDeferredValue(value) { return value; }

                function useSyncExternalStore(subscribe, getSnapshot) { return getSnapshot(); }

                function useInsertionEffect(fn /*, deps */) { fn(); }

                function createContext(defaultValue) {
                    return { _currentValue: defaultValue, Provider: function(props) { return props.children; }, Consumer: function(props) { return props.children(defaultValue); } };
                }

                function createRef() { return { current: null }; }

                function forwardRef(render) {
                    return function(props) { return render(props, null); };
                }

                function memo(Component /*, compare */) { return Component; }

                function lazy(factory) { return factory; }

                function cloneElement(element, props) {
                    return Object.assign({}, element, { props: Object.assign({}, element.props, props) });
                }

                function isValidElement(obj) {
                    return obj !== null && typeof obj === 'object' && obj.type !== undefined;
                }

                function Component() {}
                Component.prototype.render = function() { return null; };
                Component.prototype.setState = function(update) {
                    var next = (typeof update === 'function') ? update(this.state) : update;
                    this.state = Object.assign({}, this.state, next);
                };

                function PureComponent() {}
                PureComponent.prototype = Object.create(Component.prototype);
                PureComponent.prototype.constructor = PureComponent;

                var StrictMode = { type: Symbol('React.StrictMode') };
                var Suspense = { type: Symbol('React.Suspense') };
                var Profiler = { type: Symbol('React.Profiler') };

                return {
                    Fragment: Fragment,
                    createElement: createElement,
                    useState: useState,
                    useEffect: useEffect,
                    useLayoutEffect: useLayoutEffect,
                    useMemo: useMemo,
                    useCallback: useCallback,
                    useRef: useRef,
                    useContext: useContext,
                    useReducer: useReducer,
                    useImperativeHandle: useImperativeHandle,
                    useDebugValue: useDebugValue,
                    useId: useId,
                    useTransition: useTransition,
                    useDeferredValue: useDeferredValue,
                    useSyncExternalStore: useSyncExternalStore,
                    useInsertionEffect: useInsertionEffect,
                    createContext: createContext,
                    createRef: createRef,
                    forwardRef: forwardRef,
                    memo: memo,
                    lazy: lazy,
                    cloneElement: cloneElement,
                    isValidElement: isValidElement,
                    Component: Component,
                    PureComponent: PureComponent,
                    StrictMode: StrictMode,
                    Suspense: Suspense,
                    Profiler: Profiler,
                };
            })();
            Object.keys(ctx).forEach(function(k) { win[k] = ctx[k]; });
            return win;
        },

        'runInContext': function run_in_context(code, ctx) {
            return ctx.eval(code.replace(/^export ((?:async )?function |let )/gm, '$1'));
        },

        'runInThisContext': eval,
    },
    'path': {
        'join': function path_join() { return Array.prototype.slice.call(arguments).join('/'); },
        'dirname': function path_dirname(path) {
            return path.split('/').slice(0, -1).join('/');
        },
    },
    'inspect': function inspect(x) { return x.toString(); },

    'fs': {
        'readFileSync': function readfile(name) {
            if (namespace.virtual_file_system && namespace.virtual_file_system.read_file_sync) {
                data = namespace.virtual_file_system.read_file_sync(name);
                if (data !== null) return data;
            }
            var data = namespace.file_data[name];
            if (data) return data;
            data = write_cache[name];
            if (data) return data;
            var err = Error();
            err.code = 'ENOENT';
            throw err;
        },

        'writeFileSync': function writefile(name, data) {
            if (namespace.virtual_file_system && namespace.virtual_file_system.write_file_sync) {
                namespace.virtual_file_system.write_file_sync(name, data);
            } else write_cache[name] = data;
        },

    },
};

function require(name) {
    return builtin_modules[name] || {};
}
