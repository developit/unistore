import { assign } from './util';

/**
 * Creates a new store, which is a tiny evented state container.
 * @name createStore
 * @param {Object} [state={}]		Optional initial state
 * @returns {store}
 * @example
 * let store = createStore();
 * store.subscribe( state => console.log(state) );
 * store.setState({ a: 'b' });   // logs { a: 'b' }
 * store.setState({ c: 'd' });   // logs { a: 'b', c: 'd' }
 */
export default function createStore(state) {
	let listeners = [];
	state = state || {};

	function unsubscribe(listener) {
		let out = [];
		for (let i=0; i<listeners.length; i++) {
			if (listeners[i]===listener) {
				listener = null;
			}
			else {
				out.push(listeners[i]);
			}
		}
		listeners = out;
	}

	function dispatch(action) {
		function apply(result) {
			setState(result, false, action);
		}
		let ret = (action.action || action)(getState, dispatch);
		if (ret != null) {
			if (ret.then) return ret.then(apply);
			return apply(ret);
		}
	}

	function getState() {
		return state;
	}

	function setState(update, overwrite, action) {
		state = overwrite ? update : assign(assign({}, state), update);
		let currentListeners = listeners;
		for (let i=0; i<currentListeners.length; i++) currentListeners[i](state, action, update);
	}

	/**
	 * An observable state container, returned from {@link createStore}
	 * @name store
	 */

	return /** @lends store */ {

		/**
		 * Create a bound copy of the given action function.
		 * The bound returned function invokes action() and persists the result back to the store.
		 * If the return value of `action` is a Promise, the resolved value will be used as state.
		 * @param {Function} action	An action of the form `action(state, ...args) -> stateUpdate`
		 * @returns {Function} boundAction()
		 */
		dispatch,

		/**
		 * Apply a partial state object to the current state, invoking registered listeners.
		 * @param {Object} update				An object with properties to be merged into state
		 * @param {Boolean} [overwrite=false]	If `true`, update will replace state instead of being merged into it
		 */
		setState,

		/**
		 * Register a listener function to be called whenever state is changed. Returns an `unsubscribe()` function.
		 * @param {Function} listener	A function to call when state changes. Gets passed the new state.
		 * @returns {Function} unsubscribe()
		 */
		subscribe(listener) {
			listeners.push(listener);
			return () => { unsubscribe(listener); };
		},

		/**
		 * Remove a previously-registered listener function.
		 * @param {Function} listener	The callback previously passed to `subscribe()` that should be removed.
		 * @function
		 */
		unsubscribe,

		/**
		 * Retrieve the current state object.
		 * @returns {Object} state
		 */
		getState
	};
}
