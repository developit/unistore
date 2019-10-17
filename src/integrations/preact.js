import { h, Component } from 'preact';
import { assign, mapActions, select } from '../util';

/**
 * Wire a component up to the store. Passes state as props, re-renders on change.
 * @param {Function|Array|String} mapStateToProps  A function mapping of store state to prop values, or an array/CSV of properties to map.
 * @param {Function|Object} [actions] 				Action functions (pure state mappings), or a factory returning them. Every action function gets current state as the first parameter and any other params next
 * @returns {Component} ConnectedComponent
 * @example
 * const Foo = connect('foo,bar')( ({ foo, bar }) => <div /> )
 * @example
 * const actions = { someAction }
 * const Foo = connect('foo,bar', actions)( ({ foo, bar, someAction }) => <div /> )
 * @example
 * @connect( state => ({ foo: state.foo, bar: state.bar }) )
 * export class Foo { render({ foo, bar }) { } }
 */
export function connect(mapStateToProps, actions) {
	if (typeof mapStateToProps!='function') {
		mapStateToProps = select(mapStateToProps || {});
	}
	return Child => {
		function Wrapper(props, context) {
			const store = context.store;
			let state = mapStateToProps(store ? store.getState() : {}, props);
			const boundActions = actions ? mapActions(actions, store) : { store };
			let update = () => {
				let mapped = mapStateToProps(store ? store.getState() : {}, props);
				for (let i in mapped) if (mapped[i]!==state[i]) {
					state = mapped;
					return this.setState({});
				}
				for (let i in state) if (!(i in mapped)) {
					state = mapped;
					return this.setState({});
				}
			};
			this.componentWillReceiveProps = p => {
				props = p;
				update();
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


/**
 * Provider exposes a store (passed as `props.store`) into context.
 *
 * Generally, an entire application is wrapped in a single `<Provider>` at the root.
 * @class
 * @extends Component
 * @param {Object} props
 * @param {Store} props.store	A {Store} instance to expose via context.
 */
export function Provider(props) {
	this.getChildContext = () => ({ store: props.store });
}
Provider.prototype.render = props => props.children && props.children[0] || props.children;
