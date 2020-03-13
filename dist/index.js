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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
        _this.initHistory(initial);
        _this.initMiddleware();
        if (options.middleware)
            (_a = _this.repatch).addMiddleware.apply(_a, options.middleware.map(function (x) { return function (store) { return x(store.getState); }; }));
        _this.initReducers(options.reducers);
        return _this;
    }
    Store.prototype.reduce = function (mutate) {
        var _this = this;
        this.repatch.dispatch(function (state) {
            return immer_1.produce(state, function (draft) {
                return mutate(draft);
            });
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
    Store.prototype.initHistory = function (initial) {
        return __awaiter(this, void 0, void 0, function () {
            var mw;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.options.history) {
                            setTimeout(function () { return _this.emit("load", function () { return _this.state(); }); }, 0);
                            return [2 /*return*/];
                        }
                        this.diffPatch = new oj_diff_patch_1.DiffPatch();
                        this.diffPatch.add(initial);
                        mw = function (store) { return function (next) { return function (reducer) {
                            var state = store.getState();
                            var nextState = reducer(state);
                            if (nextState["__ignoreHistory"] !== true)
                                _this.diffPatch.add(nextState);
                            delete nextState["__ignoreHistory"];
                            return next(function () { return nextState; });
                        }; }; };
                        this.repatch.addMiddleware(mw);
                        if (!(typeof this.options.history === "object")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initHistoryGetSet()];
                    case 1:
                        _a.sent();
                        this.emit("load", function () { return _this.state(); });
                        return [3 /*break*/, 3];
                    case 2:
                        setTimeout(function () { return _this.emit("load", function () { return _this.state(); }); }, 0);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Store.prototype.restoreDeltas = function (deltas) {
        var state = this.diffPatch.load(deltas);
        if (!state)
            return;
        this.repatch.dispatch(function () {
            state["__ignoreHistory"] = true;
            return state;
        });
    };
    Store.prototype.initHistoryGetSet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var h, res, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        h = this.options.history;
                        if (!(typeof h.get === "function")) return [3 /*break*/, 3];
                        res = h.get();
                        if (!res) return [3 /*break*/, 3];
                        if (!Array.isArray(res)) return [3 /*break*/, 1];
                        this.restoreDeltas(res);
                        return [3 /*break*/, 3];
                    case 1:
                        _a = this.restoreDeltas;
                        return [4 /*yield*/, res];
                    case 2:
                        _a.apply(this, [_b.sent()]);
                        _b.label = 3;
                    case 3:
                        if (typeof h.set === "function") {
                            this.diffPatch.listen = function (deltas) { return h.set(deltas); };
                        }
                        if (typeof h.ready === "function")
                            h.ready(function () { return _this.state(); });
                        return [2 /*return*/];
                }
            });
        });
    };
    Store.prototype.initMiddleware = function () {
        var _this = this;
        var mw = function (store) { return function (next) { return function (reducer) {
            var state = store.getState();
            var nextState = reducer(state);
            if (typeof nextState === "function") {
                var promise = nextState(_this);
                if (!(promise instanceof Promise))
                    throw new Error("Async function should return a Promise");
                promise.then(function (state) { return _this.repatch.dispatch(function () { return state; }); });
                // return next(() => state)
            }
            return next(function () { return nextState; });
        }; }; };
        this.repatch.addMiddleware(mw);
    };
    Store.prototype.initReducers = function (reducers) {
        var _this = this;
        if (!reducers)
            return;
        Object.keys(reducers)
            .forEach(function (k) {
            return _this.dispatch[k] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var reducer = reducers[k].apply(reducers, args);
                if (reducer instanceof Promise)
                    reducer.then(function (r) { return _this.reduce(function (draft) { return r(draft); }); });
                else
                    _this.reduce(function (draft) { return reducer(draft); });
                return _this;
            };
        });
    };
    return Store;
}(oj_eventaggregator_1.EventAggregator));
exports.Store = Store;
