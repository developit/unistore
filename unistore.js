import { h, Component } from 'preact';


/** Creates a new store, which is a tiny evented state container.
 *  @name createStore
 *  @param {Object} [state={}]		Optional initial state
 *  @returns {store}
 *  @example
 *    let store = createStore();
 *    store.subscribe( state => console.log(state) );
 *    store.setState({ a: 'b' });   // logs { a: 'b' }
 *    store.setState({ c: 'd' });   // logs { a: 'b', c: 'd' }
 */
export function createStore(state) {
	let listeners = new Set();
	state = state || {};

	function unsubscribe(listener) {
		listeners.delete(listener) && (listener = null);
	}

	function setState(update, overwrite) {
		state = overwrite ? update : assign(assign({}, state), update);
		listeners.forEach(listener => listener(state));
	}

	/** An observable state container, returned from {@link createStore}
	 *  @name store
	 */

	return /** @lends store */ {

		/** Create a bound copy of the given action function.
		 *  The bound returned function invokes action() and persists the result back to the store.
		 *  If the return value of `action` is a Promise, the resolved value will be used as state.
		 *  @param {Function} action	An action of the form `action(state, ...args) -> stateUpdate`
		 *  @returns {Function} boundAction()
		 */
		action(action) {
			// Note: perf tests verifying this implementation: https://esbench.com/bench/5a295e6299634800a0349500
			return function() {
				let args = [state];
				for (let i=0; i<arguments.length; i++) args.push(arguments[i]);
				let ret = action.apply(this, args);
				if (ret!=null) {
					if (ret.then) ret.then(setState);
					else setState(ret);
				}
			};
		},
		
		/** Apply a partial state object to the current state, invoking registered listeners.
		 *  @param {Object} update				An object with properties to be merged into state
		 *  @param {Boolean} [overwrite=false]	If `true`, update will replace state instead of being merged into it
		 */
		setState,

		/** Register a listener function to be called whenever state is changed. Returns an `unsubscribe()` function.
		 *  @param {Function} listener	A function to call when state changes. Gets passed the new state.
		 *  @returns {Function} unsubscribe()
		 */
		subscribe(listener) {
			listeners.add(listener);
			return () => { unsubscribe(listener); };
		},

		/** Remove a previously-registered listener function.
		 *  @param {Function} listener	The callback previously passed to `subscribe()` that should be removed.
		 *  @function
		 */
		unsubscribe,

		/** Retrieve the current state object.
		 *  @returns {Object} state
		 */
		getState() {
			return state;
		}
	};
}


/** Wire a component up to the store. Passes state as props, re-renders on change.
 *  @param {Function|Array|String} mapStateToProps  A function mapping of store state to prop values, or an array/CSV of properties to map.
 *  @param {Function|Object} [actions] 				Action functions (pure state mappings), or a factory returning them. Every action function gets current state as the first parameter and any other params next
 *  @returns {Component} ConnectedComponent
 *  @example
 *    const Foo = connect('foo,bar')( ({ foo, bar }) => <div /> )
 *  @example
 *    const actions = { someAction }
 *    const Foo = connect('foo,bar', actions)( ({ foo, bar, someAction }) => <div /> )
 *  @example
 *    @connect( state => ({ foo: state.foo, bar: state.bar }) )
 *    export class Foo { render({ foo, bar }) { } }
 */
export function connect(mapStateToProps, actions) {
	if (typeof mapStateToProps!=='function') {
		mapStateToProps = select(mapStateToProps || []);
	}
	return Child => {
		function Wrapper(props, { store }) {
			let state = mapStateToProps(store ? store.getState() : {}, props);
			let boundActions = actions ? mapActions(actions, store) : { store };
			let update = () => {
				let mapped = mapStateToProps(store ? store.getState() : {}, this.props);
				for (let i in mapped) if (mapped[i]!==state[i]) {
					state = mapped;
					return this.setState(null);
				}
				for (let i in state) if (!(i in mapped)) {
					state = mapped;
					return this.setState(null);
				}
			};
			this.componentDidMount = () => {
				store.subscribe(update);
			};
			this.componentWillUnmount = () => {
				store.unsubscribe(update);
			};
			this.render = props => h(Child, assign(assign(assign({}, boundActions), props), state));
		}
		return (Wrapper.prototype = new Component()).constructor = Wrapper;
	};
}


/** Provider exposes a store (passed as `props.store`) into context.
 *
 *  Generally, an entire application is wrapped in a single `<Provider>` at the root.
 *  @class
 *  @extends Component
 *  @param {Object} props
 *  @param {Store} props.store		A {Store} instance to expose via context.
 */
export function Provider(props) {
	this.getChildContext = () => ({ store: props.store });
}
Provider.prototype.render = props => props.children[0];


// Bind an object/factory of actions to the store and wrap them.
function mapActions(actions, store) {
	if (typeof actions==='function') actions = actions(store);
	let mapped = {};
	for (let i in actions) {
		mapped[i] = store.action(actions[i]);
	}
	return mapped;
}


// select('foo,bar') creates a function of the form: ({ foo, bar }) => ({ foo, bar })
function select(properties) {
	if (typeof properties==='string') properties = properties.split(',');
	return state => {
		let selected = {};
		for (let i=0; i<properties.length; i++) {
			selected[properties[i]] = state[properties[i]];
		}
		return selected;
	};
}


// Lighter Object.assign stand-in
function assign(obj, props) {
	for (let i in props) obj[i] = props[i];
	return obj;
}
