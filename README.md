# Store
A complete state / store solution
Get the benefits of immutable data with the ease of mutable data.
History (undo / redo, persistent) support with deltas (only the diffs are stored).
Support for async (Promise) reducers.
Subscribe to store events.

## Usage

### import
```typescript
import { Store } from "oj-store";
```

### Initialize
```typescript
const initialState = {
  name: "Orange Juice",
  deep: { nested: [{ data: "is easy" }] }
}
const store = new Store(initialState)
```

#### Reducers
```typescript
const reducers = {
  setName: (name: string) => draft => { draft.name = name },
  pushDeepNested: (data: { data: string }) => draft => { draft.deep.nested.push(data) },
  setNameFromApi: () => 
    fetch("url/user")
      .then(x => x.json())
      .then(x => draft => { draft.name = x.name})
}
const store = new Store(initialState, { reducers })
```

#### History
The history option can be true, false or an object with a getter and setter.
You can use the getter and setter for persistency, for example with the localForage package.

```typescript
const history = {
  set: deltas => localForage.setItem("history", deltas),
  get: () => localForage.getItem("history")
}
const store = new Store(initialState, { history, reducers })
```

#### Middleware
```typescript
const middleware = [
    state => next => reducer => {
      const s = state()
      const nextState = reducer(s)
      console.log("logger", s, nextState)
      next(() => nextState)
    }
]

const store = new Store(initialState, { history, reducers, middleware })
```

### Get state
```typescript
const current = store.state()
/*
{
  name: "Orange Juice",
  deep: { nested: [ { data: "is easy" } ] }
}
*/
```

### Dispatch reducer
```typescript
store.dispatch.setName("Awesome")
store.dispatch.pushDeepNested({ data: "super easy" })
/*
{
  name: "Awesome",
  deep: { nested: [{ data: "is easy" }, { data: "super easy" }] }
}
*/
```

### Reduce
```typescript
store.reduce(d => { d.name = "Awesome" })
store.reduce(d => { d.deep.nested.push({ data: "super easy" }) })
store.reduce(d => ({ name: "Reset", deep: { nested: [] })) // set full state

console.log(store.state())
/*
{
  name: "Awesome",
  deep: { nested: [{ data: "is easy" }, { data: "super easy" }] }
}
*/
```

### Undo / Redo
check if undo/redo is possible

```typescript
  button.classList.toggle("disabled", !store.canUndo())
  button.classList.toggle("disabled", !store.canRedo())
```

undo / redo

```typescript
  store.undo() // undo last change

  store.redo() // redo last undo

  store.undo(4) // undo last 4 changes
```

## Events
Uses the oj-eventaggregator package for handling Events

### Change
The change event is emitted after every state change caused by store.reduce(...), store.dispatch[reducer](...), store.undo(...) or store.redo(...) actions.
```typescript
store.on("change", getState => {
  console.log(getState())
})
```

### Undo
The undo event is emitted after store.undo() changed the state.

```typescript
store.on("undo", getState => {
  console.log(getState())
})
```

### Redo
The redo event is emitted after store.redo() changed the state.

```typescript
store.on("redo", getState => {
  console.log(getState())
})
```

### Load
The load event is emitted when the store is initialized and the history is fully restored (if any).

```typescript
store.on("change", getState => {
  console.log(getState())
})
```

## Types

### Store
```typescript
Store<T, R>
```
T is the initial state object
R is the store reducers object

### IReducer<T>
```typescript
(...args: any[]) => (draft: Draft<T>) => void | Draft<T>
```

### IReducerAsync<T>
```typescript
(...args: any[]) => Promise<(draft: Draft<T>) => void | Draft<T>>
```

### IReducers<R, T>
```typescript
{ [k: string]: IReducer<T> | IReducerAsync<T> }
```

### IMiddleware<T>
```typescript
(state: () => T) => (next: (state: T) => void) => (reducer: any) => any
```

### IStoreOptionsHistory<T>
```typescript
{
  set: (deltas: Delta[]) => any,
  get: () => Promise<Delta[]> | Delta[] | void,
  ready?: (getState: () => T) => any
}
```

### IStoreOptions<R, T>
```typescript
{
  history?: boolean | IStoreOptionsHistory<T>
  reducers?: IReducers<R, T>,
  middleware?: IMiddleware<T>[]
}
```