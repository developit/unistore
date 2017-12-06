import { h, Component } from 'preact';


/** Creates a new store, which is a tiny evented state container.
 *  @example
 *    let store = createStore();
 *    store.subscribe( state => console.log(state) );
 *    store.setState({ a: 'b' });   // logs { a: 'b' }
 *    store.setState({ c: 'd' });   // logs { c: 'd' }
 */
export function createStore(state={}) {
	let listeners = [];

	return {
		setState(update) {
			state = { ...state, ...update };
			listeners.forEach( f => { f(state); });
		},
		subscribe(f) {
			listeners.push(f);
		},
		unsubscribe(f) {
			let i = listeners.indexOf(f);
			listeners.splice(i, !!~i);
		},
		getState() {
			return state;
		}
	};
}


/** Provides its props into the tree as context.
 *  @example
 *    let store = createStore();
 *    <Provider store={store}><App /></Provider>
 */
export class Provider extends Component {
	getChildContext() {
		let context = { ...this.props };
		delete context.children;
		return context;
	}
	render({ children }) {
		return children[0];
	}
}


/** Wire a component up to the store. Passes state as props, re-renders on change.
 *  @param {Function|Array|String} mapStateToProps  A function (or any `select()` argument) mapping of store state to prop values.
 *  @example
 *    const Foo = connect('foo,bar')( ({ foo, bar }) => <div /> )
 *  @example
 *    @connect( state => ({ foo: state.foo, bar: state.bar }) )
 *    export class Foo { render({ foo, bar }) { } }
 */
export function connect(mapToProps, actions) {
	if (typeof mapToProps!=='function') mapToProps = select(mapToProps);
	return Child => (
		class Wrapper extends Component {
			constructor(props, { store }) {
				super();
				this.state = mapToProps(store ? store.getState() : {}, props);
				this.actions = actions ? actions(store) : { store };
				this.update = () => {
					let mapped = mapToProps(store ? store.getState() : {}, this.props);
					if (!shallowEqual(mapped, this.state)) {
						this.setState(mapped);
					}
				};
			}
			componentDidMount() {
				this.context.store.subscribe(this.update);
			}
			componentWillUnmount() {
				this.context.store.unsubscribe(this.update);
			}
			render(props, state) {
				return <Child {...this.actions} {...props} {...state} />;
			}
		}
	);
}


/** select('foo,bar') creates a function of the form: ({ foo, bar }) => ({ foo, bar }) */
export function select(properties) {
	if (typeof properties==='string') properties = properties.split(',');
	return state => {
		let selected = {};
		for (let i=0; i<properties.length; i++) {
			selected[properties[i]] = state[properties[i]];
		}
		return selected;
	};
}


// eslint-disable-next-line
function assign(obj) {
	for (let i=1; i<arguments.length; i++) {
		let props = arguments[i];
		for (let j in props) obj[j] = props[j];
	}
	return obj;
}


/** Returns a boolean indicating if all keys and values match between two objects. */
function shallowEqual(a, b) {
	for (let i in a) if (a[i]!==b[i]) return false;
	for (let i in b) if (!(i in a)) return false;
	return true;
}