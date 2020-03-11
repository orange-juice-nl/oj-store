"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var repatch_1 = require("repatch");
var oj_diff_patch_1 = require("oj-diff-patch");
var immer_1 = require("immer");
var Store = /** @class */ (function () {
    function Store(initial, options) {
        var _a;
        var _this = this;
        if (initial === void 0) { initial = {}; }
        if (options === void 0) { options = {}; }
        this.dispatch = {};
        this.options = {};
        this.options = options;
        this.repatch = new repatch_1.Store(initial);
        if (this.options.history) {
            this.diffPatch = new oj_diff_patch_1.DiffPatch();
            this.diffPatch.add(initial);
            var mw_1 = function (store) { return function (next) { return function (reducer) {
                var state = store.getState();
                var nextState = reducer(state);
                if (nextState["__ignoreHistory"] !== true) // ignore toevoegen aan T
                    _this.diffPatch.add(nextState);
                delete nextState["__ignoreHistory"];
                return next(function () { return nextState; });
            }; }; };
            this.repatch.addMiddleware(mw_1);
            if (typeof this.options.history === "object") {
                var h_1 = this.options.history;
                if (typeof h_1.get === "function")
                    h_1.get().then(function (d) {
                        _this.state(_this.diffPatch.load(d));
                        if (typeof h_1.ready === "function")
                            h_1.ready();
                    });
                if (typeof h_1.set === "function")
                    this.diffPatch.onAdd = function (deltas) { return h_1.set(deltas); };
            }
        }
        var mw = function (store) { return function (next) { return function (reducer) {
            var state = store.getState();
            var nextState = reducer(state);
            if (typeof nextState === "function") {
                var promise = nextState(_this);
                if (!(promise instanceof Promise))
                    throw new Error("Async function should return a Promise");
                promise.then(function (state) { return _this.repatch.dispatch(function () { return state; }); });
                return next(function () { return state; });
            }
            return next(function () { return nextState; });
        }; }; };
        this.repatch.addMiddleware(mw);
        if (options.middleware)
            (_a = this.repatch).addMiddleware.apply(_a, options.middleware);
        if (options.reducers)
            Object.keys(options.reducers)
                .forEach(function (k) {
                return _this.dispatch[k] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return _this.repatch.dispatch(function (state) {
                        return immer_1.produce(state, function (draft) {
                            var _a;
                            return (_a = options.reducers)[k].apply(_a, args)(draft);
                        });
                    });
                };
            });
    }
    Store.prototype.reduce = function (mutate) {
        this.repatch.dispatch(function (state) {
            return immer_1.produce(state, function (draft) { return mutate(draft); });
        });
    };
    Store.prototype.canUndo = function () {
        return this.options.history && this.diffPatch.canUndo();
    };
    Store.prototype.canRedo = function () {
        return this.options.history && this.diffPatch.canRedo();
    };
    Store.prototype.undo = function (steps) {
        var _this = this;
        if (steps === void 0) { steps = 1; }
        if (!this.options.history)
            throw new Error("options.history not enabled");
        for (var i = 0; i < steps; i++) {
            if (!this.diffPatch.canUndo())
                break;
            this.repatch.dispatch(function () { return (__assign(__assign({}, _this.diffPatch.undo()), { __ignoreHistory: true })); });
        }
        return this;
    };
    Store.prototype.redo = function (steps) {
        var _this = this;
        if (steps === void 0) { steps = 1; }
        if (!this.options.history)
            throw new Error("options.history not enabled");
        for (var i = 0; i < steps; i++) {
            if (!this.diffPatch.canRedo())
                break;
            this.repatch.dispatch(function () { return (__assign(__assign({}, _this.diffPatch.redo()), { __ignoreHistory: true })); });
        }
        return this;
    };
    Store.prototype.state = function (state) {
        if (state !== undefined)
            this.repatch.dispatch(function () {
                state["__ignoreHistory"] = true;
                return state;
            });
        return this.repatch.getState();
    };
    Store.prototype.subscribe = function (cb) {
        return this.repatch.subscribe(cb);
    };
    Store.prototype.subscribeOnce = function (cb) {
        var unsubscribe = this.repatch.subscribe(function () {
            unsubscribe();
            cb();
        });
        return unsubscribe;
    };
    return Store;
}());
exports.Store = Store;
