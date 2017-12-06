import { h, Component } from 'preact';

function assign(obj, props) {
	for (let i in props) obj[i] = props[i];
	return obj;
}


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
		setState(update, overwrite) {
			state = overwrite ? update : { ...state, ...update };
			for (let i=0; i<listeners.length; i++) {
				listeners[i](state);
			}
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


/** Wire a component up to the store. Passes state as props, re-renders on change.
 *  @param {Function|Array|String} mapStateToProps  A function mapping of store state to prop values, or an array/CSV of properties to map.
 *  @param {Function|Object} [actions] 				Action functions (pure state mappings), or a factory returning them.
 *  @example
 *    const Foo = connect('foo,bar')( ({ foo, bar }) => <div /> )
 *  @example
 *    @connect( state => ({ foo: state.foo, bar: state.bar }) )
 *    export class Foo { render({ foo, bar }) { } }
 */
export function connect(mapStateToProps, actions) {
	if (typeof mapStateToProps!=='function') mapStateToProps = select(mapStateToProps || []);
	return Child => (
		class Wrapper extends Component {
			constructor(props, { store }) {
				super();
				this.state.s = mapStateToProps(store ? store.getState() : {}, props);
				this.actions = actions ? mapActions(actions, store) : { store };
				this.update = () => {
					let mapped = mapStateToProps(store ? store.getState() : {}, this.props);
					if (!shallowEqual(mapped, this.state.s)) {
						this.setState({ s: mapped });
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
				return <Child {...this.actions} {...props} {...state.s} />;
			}
		}
	);
}


/** Provider exposes a store (passed as `props.store`) into context.
 *  Generally, an entire application is wrapped in a single `<Provider>` at the root.
 *  @constructor
 *  @extends Component
 *  @param {Object} props
 *  @param {Store} props.store		A {Store} instance to expose via context.
 */
export function Provider(){}
Provider.prototype.getChildContext = function() {
	return { store: this.props.store };
};
Provider.prototype.render = function(props) {
	return props.children[0];
};


function mapActions(actions, store) {
	let mapped = {};
	if (typeof actions==='function') actions = actions(store);
	for (let i in actions) {
		mapped[i] = (...args) => {
			let ret = actions[i](store.getState(), ...args);
			if (ret!=null) store.setState(ret);
		};
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


// Returns a boolean indicating if all keys and values match between two objects.
function shallowEqual(a, b) {
	for (let i in a) if (a[i]!==b[i]) return false;
	for (let i in b) if (!(i in a)) return false;
	return true;
}