import { Delta } from "oj-diff-patch";
import { Draft } from "immer";
import { EventAggregator } from "oj-eventaggregator";
export declare type IReducer<T> = (...args: any[]) => (draft: Draft<T>) => void | Draft<T>;
export declare type IReducers<T> = {
    [k: string]: IReducer<T>;
};
export interface IStoreOptions<R, T> {
    history?: boolean | {
        set: (deltas: Delta[]) => any;
        get: () => Promise<Delta[]>;
        ready?: () => any;
    };
    reducers?: R & IReducers<T>;
    middleware?: Array<(store: any) => (next: any) => (reducer: any) => any>;
}
export declare class Store<T extends Object, R> extends EventAggregator<"change" | "undo" | "redo"> {
    readonly dispatch: IStoreOptions<R, T>["reducers"];
    private readonly diffPatch;
    private readonly repatch;
    private options;
    constructor(initial?: T, options?: IStoreOptions<R, T>);
    reduce(mutate: (draft: Draft<T>) => void | Draft<T>): this;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(steps?: number): this;
    redo(steps?: number): this;
    state(): T;
}
