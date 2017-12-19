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
			let { store } = context;
			let state = mapStateToProps(store ? store.getState() : {}, props);
			let boundActions = actions ? mapActions(actions, store) : { store };
			let update = () => {
				let mapped = mapStateToProps(store ? store.getState() : {}, this.props);
				for (let i in mapped) if (mapped[i]!==state[i]) {
					state = mapped;
					return this.forceUpdate();
				}
				for (let i in state) if (!(i in mapped)) {
					state = mapped;
					return this.forceUpdate();
				}
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
		return (Wrapper.prototype = Object.create(Component)).constructor = Wrapper;
	};
	// return Child => (
	// 	class Wrapper extends Component {
	// 		constructor(props, context) {
	// 			super(props, context);
	// 			let { store } = context;
	// 			this._state = mapStateToProps(store ? store.getState() : {}, props);
	// 			this.boundActions = actions ? mapActions(actions, store) : { store };
	// 			this.update = () => {
	// 				let mapped = mapStateToProps(store ? store.getState() : {}, this.props);
	// 				for (let i in mapped) if (mapped[i]!==this._state[i]) {
	// 					this._state = mapped;
	// 					return this.setState(null);
	// 				}
	// 				for (let i in this._state) if (!(i in mapped)) {
	// 					this._state = mapped;
	// 					return this.setState(null);
	// 				}
	// 			};
	// 		}
	// 		componentDidMount() {
	// 			this.context.store.subscribe(this.update);
	// 		}
	// 		componentWillUnmount() {
	// 			this.context.store.unsubscribe(this.update);
	// 		}
	// 		render() {
	// 			return createElement(Child, assign(assign(assign({}, this.boundActions), this.props), this._state));
	// 		}
	// 	}
	// );
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
