import { Store as Repatch, Unsubscribe, Middleware, Reducer } from "repatch"
import { DiffPatch, Delta } from "oj-diff-patch"
import { produce, Draft } from "immer"

export type IReducer<T> = (...args: any[]) => (draft: Draft<T>) => void | Draft<T>

export type IReducers<T> = { [k: string]: IReducer<T> }

export interface IStoreOptions<R, T> {
  history?: boolean | { set: (deltas: Delta[]) => any, get: () => Promise<Delta[]>, ready?: () => any }
  reducers?: R & IReducers<T>,
  middleware?: Array<(store: any) => (next: any) => (reducer: any) => any>
}

export class Store<T extends Object, R>{
  public readonly dispatch: IStoreOptions<R, T>["reducers"] = {} as IStoreOptions<R, T>["reducers"];
  private diffPatch: DiffPatch<T>
  private repatch: Repatch<T>
  private options: IStoreOptions<R, T> = {};

  constructor(initial: T = {} as T, options: IStoreOptions<R, T> = {}) {
    this.options = options
    this.repatch = new Repatch(initial)

    if (this.options.history) {
      this.diffPatch = new DiffPatch()
      this.diffPatch.add(initial)
      const mw = store => next => reducer => {
        const state = store.getState()
        const nextState = reducer(state)
        if (nextState["__ignoreHistory"] !== true) // ignore toevoegen aan T
          this.diffPatch.add(nextState)
        delete nextState["__ignoreHistory"]
        return next(() => nextState)
      }
      this.repatch.addMiddleware(mw)

      if (typeof this.options.history === "object") {
        const h = this.options.history as any
        if (typeof h.get === "function")
          h.get().then(d => {
            this.state(this.diffPatch.load(d))
            if (typeof h.ready === "function")
              h.ready()
          })
        if (typeof h.set === "function")
          this.diffPatch.listen = deltas => h.set(deltas)
      }
    }

    const mw = store => next => reducer => {
      const state = store.getState()
      const nextState = reducer(state)
      if (typeof nextState === "function") {
        const promise = nextState(this)
        if (!(promise instanceof Promise))
          throw new Error(`Async function should return a Promise`)
        promise.then(state => this.repatch.dispatch(() => state))
        return next(() => state)
      }
      return next(() => nextState)
    }
    this.repatch.addMiddleware(mw)

    if (options.middleware)
      this.repatch.addMiddleware(...options.middleware)

    if (options.reducers)
      Object.keys(options.reducers)
        .forEach(k =>
          (this.dispatch as any)[k] = (...args: any[]) =>
            this.repatch.dispatch(state =>
              produce(state, draft => options.reducers[k](...args)(draft) as any)))
  }

  reduce(mutate: (draft: Draft<T>) => void | Draft<T>) {
    this.repatch.dispatch(state =>
      produce(state, draft => mutate(draft) as any))
  }

  canUndo() {
    return this.options.history && this.diffPatch.canUndo()
  }

  canRedo() {
    return this.options.history && this.diffPatch.canRedo()
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
    return this
  }

  state(state?: T) {
    if (state !== undefined)
      this.repatch.dispatch(() => {
        state["__ignoreHistory"] = true
        return state
      })
    return this.repatch.getState()
  }

  subscribe(cb: () => any) {
    return this.repatch.subscribe(cb)
  }

  subscribeOnce(cb: () => any) {
    const unsubscribe = this.repatch.subscribe(() => {
      unsubscribe()
      cb()
    })
    return unsubscribe
  }
}