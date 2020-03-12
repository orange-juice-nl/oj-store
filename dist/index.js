"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var oj_eventaggregator_1 = require("oj-eventaggregator");
immer_1.setAutoFreeze(false);
var Store = /** @class */ (function (_super) {
    __extends(Store, _super);
    function Store(initial, options) {
        var _a;
        if (initial === void 0) { initial = {}; }
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.dispatch = {};
        _this.options = {};
        _this.options = options;
        _this.repatch = new repatch_1.Store(initial);
        if (_this.options.history) {
            _this.diffPatch = new oj_diff_patch_1.DiffPatch();
            _this.diffPatch.add(initial);
            var mw_1 = function (store) { return function (next) { return function (reducer) {
                var state = store.getState();
                var nextState = reducer(state);
                if (nextState["__ignoreHistory"] !== true)
                    _this.diffPatch.add(nextState);
                delete nextState["__ignoreHistory"];
                return next(function () { return nextState; });
            }; }; };
            _this.repatch.addMiddleware(mw_1);
            if (typeof _this.options.history === "object") {
                var h_1 = _this.options.history;
                if (typeof h_1.get === "function")
                    h_1.get().then(function (d) {
                        var state = _this.diffPatch.load(d);
                        _this.repatch.dispatch(function () {
                            state["__ignoreHistory"] = true;
                            return state;
                        });
                        if (typeof h_1.ready === "function")
                            h_1.ready();
                    });
                if (typeof h_1.set === "function")
                    _this.diffPatch.listen = function (deltas) { return h_1.set(deltas); };
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
        _this.repatch.addMiddleware(mw);
        if (options.middleware)
            (_a = _this.repatch).addMiddleware.apply(_a, options.middleware);
        if (options.reducers)
            Object.keys(options.reducers)
                .forEach(function (k) {
                return _this.dispatch[k] = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    _this.repatch.dispatch(function (state) {
                        return immer_1.produce(state, function (draft) {
                            var _a;
                            return (_a = options.reducers)[k].apply(_a, args)(draft);
                        });
                    });
                    _this.emit("change", function () { return _this.state(); });
                    return _this;
                };
            });
        return _this;
    }
    Store.prototype.reduce = function (mutate) {
        var _this = this;
        this.repatch.dispatch(function (state) {
            return immer_1.produce(state, function (draft) { return mutate(draft); });
        });
        this.emit("change", function () { return _this.state(); });
        return this;
    };
    Store.prototype.canUndo = function () {
        return this.options.history
            && this.diffPatch.canUndo();
    };
    Store.prototype.canRedo = function () {
        return this.options.history
            && this.diffPatch.canRedo();
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
        this.emit("undo", function () { return _this.state(); });
        this.emit("change", function () { return _this.state(); });
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
        this.emit("redo", function () { return _this.state(); });
        this.emit("change", function () { return _this.state(); });
        return this;
    };
    Store.prototype.state = function () {
        return this.repatch.getState();
    };
    return Store;
}(oj_eventaggregator_1.EventAggregator));
exports.Store = Store;
