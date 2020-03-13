import { createElement, Children, Component } from 'react';
import { assign, mapActions, select } from '../util';

const CONTEXT_TYPES = {
	store: () => {}
};

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
		function Wrapper(props, context) {
			Component.call(this, props, context);
			const store = context.store;
			let state = mapStateToProps(store ? store.getState() : {}, props);
			const boundActions = actions ? mapActions(actions, store) : { store };
			let update = () => {
				let mapped = mapStateToProps(store ? store.getState() : {}, props);
				for (let i in mapped) if (mapped[i]!==state[i]) {
					state = mapped;
					return this.forceUpdate();
				}
				for (let i in state) if (!(i in mapped)) {
					state = mapped;
					return this.forceUpdate();
				}
			};
			this.UNSAFE_componentWillReceiveProps = p => {
				props = p;
				update();
			};
			this.componentDidMount = () => {
				store.subscribe(update);
			};
			this.componentWillUnmount = () => {
				store.unsubscribe(update);
			};
			this.render = () => createElement(Child, assign(assign(assign({}, boundActions), this.props), state));
		}
		Wrapper.contextTypes = CONTEXT_TYPES;
		return (Wrapper.prototype = Object.create(Component.prototype)).constructor = Wrapper;
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
export class Provider extends Component {
	getChildContext() {
		return { store: this.props.store };
	}
	render() {
		return Children.only(this.props.children);
	}
}
Provider.childContextTypes = CONTEXT_TYPES;
