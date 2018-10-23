import { createContext, createElement, Component } from 'react';
import { assign, mapActions, select } from '../util';

const UnistoreContext = createContext();

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
	return Child => props => createElement(
		UnistoreContext.Consumer,
		null,
		({ store, ...state }) => {
			let boundActions = actions ? mapActions(actions, store) : { store };
			let mappedState = mapStateToProps(state, props);
			return createElement(Child, assign(assign(assign({}, boundActions), props), mappedState));
		}
	);
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
	constructor(props) {
		super(props);
		this.state = assign(assign({},
			{ store: this.props.store }),
		this.props.store.getState()
		);

		this.update = () => {
			this.setState(this.props.store.getState());
		};
	}

	componentDidMount() {
		this.props.store.subscribe(this.update);
	}

	componentWillUnmount() {
		this.props.store.unsubscribe(this.update);
	}

	render() {
		return createElement(UnistoreContext.Provider, { children: this.props.children, value: this.state });
	}
}
