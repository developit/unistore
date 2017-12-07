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
	let listeners = [];
	let middleware = [];
	state = state || {};

	/** An observable state container, returned from {@link createStore}
   *  @name store
   */

	return /** @lends store */ {
		/** Apply a partial state object to the current state, invoking registered listeners.
		 *  @param {Object} update				An object with properties to be merged into state
		 *  @param {Boolean} [overwrite=false]	If `true`, update will replace state instead of being merged into it
		 */
		setState(update, overwrite) {
			let afterProcessingUpdate = applyMiddlewareToState(update, middleware);
			state = overwrite
				? afterProcessingUpdate
				: assign(assign({}, state), afterProcessingUpdate);
			for (let i = 0; i < listeners.length; i++) listeners[i](state);
		},

		/** Register a listener function to be called whenever state is changed.
		 *  @param {Function} listener
		 */
		subscribe(listener) {
			listeners.push(listener);
		},

		/** Remove a previously-registered listener function.
		 *  @param {Function} listener
		 */
		unsubscribe(listener) {
			let i = listeners.indexOf(listener);
			listeners.splice(i, !!~i);
		},

		/** Retrieve the current state object.
		 *  @returns {Object} state
		 */
		getState() {
			return state;
		},

		/**
		 * Add a middleware to process state data.You can use middleware for global data processing.
         * @param {Function} middlewareFunction
		 * @example
		 *  // before
		 * 	store.setState({a:1})
		 * 	store.getState() // {a:1}
		 * 	// after
		 * 	store.addMiddleware((state)=> ({...state, dataFromMiddleware1: true})
		 * 	store.addMiddleware((state)=> ({...state, dataFromMiddleware2: true})
		 * 	store.getState() // {a:1, dataFromMiddleware1: true, dataFromMiddleware2: true}
         */
		addMiddleware(middlewareFunction) {
			if (!middlewareFunction) {
				return;
			}
			else if (typeof middlewareFunction !== 'function') {
				throw new Error('Need a function type parameter');
			}
			else {
				middleware.push(middlewareFunction);
			}
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
	if (typeof mapStateToProps !== 'function') {
		mapStateToProps = select(mapStateToProps || []);
	}
	return Child => {
		function Wrapper(props, { store }) {
			let state = mapStateToProps(store ? store.getState() : {}, props);
			let boundActions = actions ? mapActions(actions, store) : { store };
			let update = () => {
				let mapped = mapStateToProps(store ? store.getState() : {}, this.props);
				if (!shallowEqual(mapped, state)) {
					state = mapped;
					this.setState(null);
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
		return ((Wrapper.prototype = new Component()).constructor = Wrapper);
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
export function Provider() {}
Provider.prototype.getChildContext = function() {
	return { store: this.props.store };
};
Provider.prototype.render = function(props) {
	return props.children[0];
};

// Bind an object/factory of actions to the store and wrap them.
function mapActions(actions, store) {
	if (typeof actions === 'function') actions = actions(store);
	let mapped = {};
	for (let i in actions) {
		mapped[i] = createAction(store, actions[i]);
	}
	return mapped;
}

// Bind a single action to the store and sequester its return value.
function createAction(store, action) {
	let args = [store.getState()];
	for (let i = 0; i < arguments.length; i++) args.push(arguments[i]);
	let ret = action.apply(store, args);
	if (ret != null) {
		if (ret.then) ret.then(store.setState);
		else store.setState(ret);
	}
}

// select('foo,bar') creates a function of the form: ({ foo, bar }) => ({ foo, bar })
function select(properties) {
	if (typeof properties === 'string') properties = properties.split(',');
	return state => {
		let selected = {};
		for (let i = properties.length; i--; ) {
			selected[properties[i]] = state[properties[i]];
		}
		return selected;
	};
}

// Returns a boolean indicating if all keys and values match between two objects.
function shallowEqual(a, b) {
	for (let i in a) if (a[i] !== b[i]) return false;
	for (let i in b) if (!(i in a)) return false;
	return true;
}

// Lighter Object.assign stand-in
function assign(obj, props) {
	for (let i in props) obj[i] = props[i];
	return obj;
}

// Reduce middleware array to process state data.
function applyMiddlewareToState(state, middlewares) {
	return middlewares.reduce((last, current) => {
		const data = current(last);
		if (last && !data){
			console.warn('Middleware return void to state, but it should be the new state value.');
		}
		return data;
	}, state);
}
