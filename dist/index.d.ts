import { Delta } from "oj-diff-patch";
import { Draft } from "immer";
import { EventAggregator } from "oj-eventaggregator";
export { Delta, Draft };
export declare type IReducer<T> = (...args: any[]) => (draft: Draft<T>) => void | Draft<T>;
export declare type IReducerAsync<T> = (...args: any[]) => Promise<(draft: Draft<T>) => void | Draft<T>>;
export declare type IReducers<R, T> = R & {
    [k: string]: IReducer<T> | IReducerAsync<T>;
};
export interface IStoreOptionsHistory<T> {
    set: (deltas: Delta[]) => any;
    get: () => Promise<Delta[]> | Delta[] | void;
    ready?: (state: () => T) => any;
}
export declare type IMiddleware<T> = (state: () => T) => (next: (state: T) => void) => (reducer: any) => any;
export interface IStoreOptions<R, T> {
    history?: boolean | IStoreOptionsHistory<T>;
    reducers?: IReducers<R, T>;
    middleware?: IMiddleware<T>[];
}
export declare class Store<T extends Object, R> extends EventAggregator<"change" | "undo" | "redo" | "load"> {
    dispatch: IStoreOptions<R, T>["reducers"];
    private diffPatch;
    private repatch;
    private options;
    constructor(initial?: T, options?: IStoreOptions<R, T>);
    reduce(mutate: (draft: Draft<T>) => void | Draft<T>): this;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(steps?: number): this;
    redo(steps?: number): this;
    state(): T;
    private initHistory;
    private restoreDeltas;
    private initHistoryGetSet;
    private initMiddleware;
    private initReducers;
}
