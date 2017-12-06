# unistore

A tiny store + connect implementation for [Preact].

### Usage

```js
import { Provider, createStore, connect } from 'unistore'

let store = createStore({ count: 0 })

let actions = store => ({
	increment() {
		store.setState({ count: store.getState().count+1 })
	}
})

const App = connect('counter', actions)(
	({ count, increment }) => (
		<div>
			<p>Count: {count}</p>
			<button onClick={increment}>Increment</button>
		</div>
	)
)

export default () => (
	<Provider store={store}>
		<App />
	</Provider>
)
```

### License

MIT

[Preact]: https://github.com/developit/preact
