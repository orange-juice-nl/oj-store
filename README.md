# Store

## Usage

### import
```typescript
import { Store } from "oj-store";
```

### Initialize
```typescript
const initialState = {
  name: "Orange Juice",
  deep: { nested: [ { data: "with immer" } ] }
}
const store = new Store(initialState, {
  history: {
    set: state => localForage.setItem("history", state),
    get: localForage.getItem("history")
  },
  reducers: {
    setName: (name:string) => draft => { draft.name = name },
    pushDeepNested: (data: string) => draft => { draft.deep.nested.push({ data }) },
    reset: () => () => initialState
  }
})
```

### Get state
```typescript
const current = store.state()
/*
{
  name: "Orange Juice",
  deep: { nested: [ { data: "with immer" } ] }
}
*/
```

### Dispatch reducer
```typescript
store.dispatch.setName("new name")
/*
{
  name: "new name",
  deep: { nested: [ { data: "with immer" } ] }
}
*/
```

### Reduce
```typescript
store.reduce(draft => {
  draft.deep.nested[0].data = "awesome"
})
/*
{
  name: "new name",
  deep: { nested: [ { data: "awesome" } ] }
}
*/
```
```typescript
store.reduce(async draft => {
  draft.name = await getName() // "fetched name"
})
/*
{
  name: "fetched name",
  deep: { nested: [ { data: "awesome" } ] }
}
*/
```

### Undo / Redo
```typescript
  button.classList.toggle("disabled", !store.canUndo())
```
```typescript
  button.classList.toggle("disabled", !store.canRedo())
```
```typescript
  store.undo()
/*
{
  name: "new name",
  deep: { nested: [ { data: "awesome" } ] }
}
*/
```
```typescript
  store.redo()
/*
{
  name: "fetched name",
  deep: { nested: [ { data: "awesome" } ] }
}
*/
```
```typescript
  store.undo(2) // undo the last 5 changes
/*
{
  name: "new name",
  deep: { nested: [ { data: "with immer" } ] }
}
*/
```

## Events
Uses the oj-eventaggregator package for handling Events

### Change
The change event is emitted on every state change caused by store.reduce(...), store.dispatch[reducer](...), store.undo(...) or store.redo(...) actions.

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

### IReducers<T>
```typescript
{ [k: string]: IReducer<T> }
```

### IStoreOptions<R, T>
```typescript
{
  history?: boolean | { set: (deltas: Delta[]) => any, get: () => Promise<Delta[]>, ready?: () => any }
  reducers?: R & IReducers<T>,
  middleware?: Array<(store: any) => (next: any) => (reducer: any) => any>
}
```