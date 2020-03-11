import { Unsubscribe } from "repatch";
import { Delta } from "oj-diff-patch";
import { Draft } from "immer";
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
export declare class Store<T extends Object, R> {
    readonly dispatch: IStoreOptions<R, T>["reducers"];
    private diffPatch;
    private repatch;
    private options;
    constructor(initial?: T, options?: IStoreOptions<R, T>);
    reduce(mutate: (draft: Draft<T>) => void | Draft<T>): void;
    canUndo(): boolean;
    canRedo(): boolean;
    undo(steps?: number): this;
    redo(steps?: number): this;
    state(state?: T): T;
    subscribe(cb: () => any): Unsubscribe;
    subscribeOnce(cb: () => any): Unsubscribe;
}
