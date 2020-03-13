import { Store as Repatch, Middleware, Reducer } from "repatch"
import { DiffPatch, Delta } from "oj-diff-patch"
import { produce, Draft, setAutoFreeze } from "immer"
import { EventAggregator } from "oj-eventaggregator"

setAutoFreeze(false)

export { Delta, Draft }

export type IReducer<T> = (...args: any[]) => (draft: Draft<T>) => void | Draft<T>
export type IReducerAsync<T> = (...args: any[]) => Promise<(draft: Draft<T>) => void | Draft<T>>
export type IReducers<R, T> = R & { [k: string]: IReducer<T> | IReducerAsync<T> }

export interface IStoreOptionsHistory<T> {
  set: (deltas: Delta[]) => any,
  get: () => Promise<Delta[]> | Delta[] | void,
  ready?: (state: () => T) => any
}

export type IMiddleware<T> = (state: () => T) => (next: (state: T) => void) => (reducer: any) => any

export interface IStoreOptions<R, T> {
  history?: boolean | IStoreOptionsHistory<T>
  reducers?: IReducers<R, T>,
  middleware?: IMiddleware<T>[]
}

export class Store<T extends Object, R> extends EventAggregator<"change" | "undo" | "redo" | "load"> {
  public dispatch: IStoreOptions<R, T>["reducers"] = {} as IStoreOptions<R, T>["reducers"];
  private diffPatch: DiffPatch<T>
  private repatch: Repatch<T>
  private options: IStoreOptions<R, T> = {};

  constructor(initial: T = {} as T, options: IStoreOptions<R, T> = {}) {
    super()
    this.options = options
    this.repatch = new Repatch(initial)

    this.initHistory(initial)

    this.initMiddleware()

    if (options.middleware)
      this.repatch.addMiddleware(...options.middleware.map(x => store => x(store.getState) as any))

    this.initReducers(options.reducers)
  }

  reduce(mutate: (draft: Draft<T>) => void | Draft<T>) {
    this.repatch.dispatch(state =>
      produce(state, draft =>
        mutate(draft) as any))
    this.emit("change", () => this.state())
    return this
  }

  canUndo() {
    return this.options.history
      && this.diffPatch.canUndo()
  }

  canRedo() {
    return this.options.history
      && this.diffPatch.canRedo()
  }

  undo(steps: number = 1) {
    if (!this.options.history)
      throw new Error(`options.history not enabled`)

    for (let i = 0; i < steps; i++) {
      if (!this.diffPatch.canUndo())
        break
      this.repatch.dispatch(() => ({
        ...this.diffPatch.undo(),
        __ignoreHistory: true,
      }))
    }
    this.emit("undo", () => this.state())
    this.emit("change", () => this.state())
    return this
  }

  redo(steps: number = 1) {
    if (!this.options.history)
      throw new Error(`options.history not enabled`)
    for (let i = 0; i < steps; i++) {
      if (!this.diffPatch.canRedo())
        break
      this.repatch.dispatch(() => ({
        ...this.diffPatch.redo(),
        __ignoreHistory: true,
      }))
    }
    this.emit("redo", () => this.state())
    this.emit("change", () => this.state())
    return this
  }

  state() {
    return this.repatch.getState()
  }

  private async initHistory(initial: T) {
    if (!this.options.history) {
      setTimeout(() => this.emit("load", () => this.state()), 0)
      return
    }

    this.diffPatch = new DiffPatch()
    this.diffPatch.add(initial)

    const mw = store => next => reducer => {
      const state = store.getState()
      const nextState = reducer(state)
      if (nextState["__ignoreHistory"] !== true)
        this.diffPatch.add(nextState)
      delete nextState["__ignoreHistory"]
      return next(() => nextState)
    }
    this.repatch.addMiddleware(mw)

    if (typeof this.options.history === "object") {
      await this.initHistoryGetSet()
      this.emit("load", () => this.state())
    }
    else
      setTimeout(() => this.emit("load", () => this.state()), 0)
  }

  private restoreDeltas(deltas: Delta[]) {
    const state = this.diffPatch.load(deltas)
    if (!state)
      return

    this.repatch.dispatch(() => {
      state["__ignoreHistory"] = true
      return state
    })
  }

  private async initHistoryGetSet() {
    const h = this.options.history as IStoreOptionsHistory<T>

    if (typeof h.get === "function") {
      const res = h.get()
      if (res) {
        if (Array.isArray(res))
          this.restoreDeltas(res)
        else
          this.restoreDeltas(await res)
      }
    }

    if (typeof h.set === "function") {
      this.diffPatch.listen = deltas => h.set(deltas)
    }

    if (typeof h.ready === "function")
      h.ready(() => this.state())
  }

  private initMiddleware() {
    const mw = store => next => reducer => {
      const state = store.getState()
      const nextState = reducer(state)
      if (typeof nextState === "function") {
        const promise = nextState(this)
        if (!(promise instanceof Promise))
          throw new Error(`Async function should return a Promise`)
        promise.then(state => this.repatch.dispatch(() => state))
        // return next(() => state)
      }
      return next(() => nextState)
    }
    this.repatch.addMiddleware(mw)
  }

  private initReducers(reducers?: IReducers<R, T>) {
    if (!reducers)
      return

    Object.keys(reducers)
      .forEach(k =>
        (this.dispatch as any)[k] = (...args: any[]) => {
          const reducer = reducers[k](...args)
          if (reducer instanceof Promise)
            reducer.then(r => this.reduce(draft => r(draft)))
          else
            this.reduce(draft => reducer(draft))
          return this
        })
  }
}