import 'raf/polyfill';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import PropTypes from 'prop-types';

import createStore from '../../src';
import { Provider, connect } from '../../src/integrations/react';

import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() });

const sleep = ms => new Promise(r => setTimeout(r, ms));

describe('createStore()', () => {
	it('should be instantiable', () => {
		let store = createStore();
		expect(store).toMatchObject({
			setState: expect.any(Function),
			getState: expect.any(Function),
			subscribe: expect.any(Function),
			unsubscribe: expect.any(Function)
		});
	});
	it('should update state in-place', () => {
		let store = createStore();
		expect(store.getState()).toMatchObject({});
		store.setState({ a: 'b' });
		expect(store.getState()).toMatchObject({ a: 'b' });
		store.setState({ c: 'd' });
		expect(store.getState()).toMatchObject({ a: 'b', c: 'd' });
		store.setState({ a: 'x' });
		expect(store.getState()).toMatchObject({ a: 'x', c: 'd' });
		store.setState({ c: null });
		expect(store.getState()).toMatchObject({ a: 'x', c: null });
		store.setState({ c: undefined });
		expect(store.getState()).toMatchObject({ a: 'x', c: undefined });
	});
	it('should invoke subscriptions', () => {
		let store = createStore();
		let sub1 = jest.fn();
		let sub2 = jest.fn();
		let rval = store.subscribe(sub1);
		expect(rval).toBeInstanceOf(Function);
		store.setState({ a: 'b' });
		expect(sub1).toHaveBeenCalledTimes(1);
		expect(sub1).toHaveBeenCalledWith(store.getState(), undefined);
		store.subscribe(sub2);
		store.setState({ c: 'd' });
		expect(sub1).toHaveBeenCalledTimes(2);
		expect(sub1).toHaveBeenLastCalledWith(store.getState(), undefined);
		expect(sub2).toBeCalledWith(store.getState(), undefined);
	});
	it('should invoke all subscriptions at time of setState, no matter unsubscriptions', () => {
		let store = createStore();
		let called = [];
		let unsub2;
		let sub1 = jest.fn(() => {
			called.push(1);
		});
		let sub2 = jest.fn(() => {
			called.push(2);
			unsub2(); // unsubscribe during a listener callback
		});
		let sub3 = jest.fn(() => {
			called.push(3);
		});
		let unsub1 = store.subscribe(sub1);
		unsub2 = store.subscribe(sub2);
		let unsub3 = store.subscribe(sub3);
		store.setState({ a: 'a' });
		expect(sub1).toHaveBeenCalledTimes(1);
		expect(sub2).toHaveBeenCalledTimes(1);
		expect(sub3).toHaveBeenCalledTimes(1);
		expect(called.sort()).toEqual([1, 2, 3]);
		store.setState({ a: 'b' });
		expect(sub1).toHaveBeenCalledTimes(2);
		expect(sub2).toHaveBeenCalledTimes(1);
		expect(sub3).toHaveBeenCalledTimes(2);
		expect(called.sort()).toEqual([1, 1, 2, 3, 3]);
		unsub1();
		unsub3();
		store.setState({ a: 'c' });
		expect(sub1).toHaveBeenCalledTimes(2);
		expect(sub2).toHaveBeenCalledTimes(1);
		expect(sub3).toHaveBeenCalledTimes(2);
		expect(called.sort()).toEqual([1, 1, 2, 3, 3]);
	});
	it('should unsubscribe', () => {
		let store = createStore();
		let sub1 = jest.fn();
		let sub2 = jest.fn();
		let sub3 = jest.fn();
		store.subscribe(sub1);
		store.subscribe(sub2);
		let unsub3 = store.subscribe(sub3);
		store.setState({ a: 'b' });
		expect(sub1).toBeCalled();
		expect(sub2).toBeCalled();
		expect(sub3).toBeCalled();
		sub1.mockClear();
		sub2.mockClear();
		sub3.mockClear();
		store.unsubscribe(sub2);
		store.setState({ c: 'd' });
		expect(sub1).toBeCalled();
		expect(sub2).not.toBeCalled();
		expect(sub3).toBeCalled();
		sub1.mockClear();
		sub2.mockClear();
		sub3.mockClear();
		store.unsubscribe(sub1);
		store.setState({ e: 'f' });
		expect(sub1).not.toBeCalled();
		expect(sub2).not.toBeCalled();
		expect(sub3).toBeCalled();
		sub3.mockClear();
		unsub3();
		store.setState({ g: 'h' });
		expect(sub1).not.toBeCalled();
		expect(sub2).not.toBeCalled();
		expect(sub3).not.toBeCalled();
	});
});

describe('<Provider>', () => {
	const createChild = (storeKey = 'store') => {
		class Child extends Component {
			render() {
				return <div />;
			}
		}

		Child.contextTypes = {
			[storeKey]: PropTypes.object.isRequired
		};

		return Child;
	};
	const Child = createChild();

	it('should provide props into context', () => {
		const store = createStore(() => ({}));

		const spy = jest.spyOn(console, 'error');
		const tree = TestUtils.renderIntoDocument(
			<Provider store={store}>
				<Child />
			</Provider>
		);
		expect(spy).not.toHaveBeenCalled();

		const child = TestUtils.findRenderedComponentWithType(tree, Child);
		expect(child.context.store).toBe(store);
	});

	it('should pass mapped state as props', () => {
		let state = { a: 'b' };
		const store = { subscribe: jest.fn(), getState: () => state };
		const ConnectedChild = connect(Object)(Child);

		const mountedProvider = mount(
			<Provider store={store}>
				<ConnectedChild />
			</Provider>
		);

		const child = mountedProvider.find(Child).first();
		expect(child.props()).toEqual({
			a: 'b',
			store
		});
		expect(store.subscribe).toBeCalled();
	});

	it('should transform string selector', () => {
		let state = { a: 'b', b: 'c', c: 'd' };
		const store = { subscribe: jest.fn(), getState: () => state };
		const ConnectedChild = connect('a, b')(Child);
		const mountedProvider = mount(
			<Provider store={store}>
				<ConnectedChild />
			</Provider>
		);

		const child = mountedProvider.find(Child).first();
		expect(child.props()).toEqual({
			a: 'b',
			b: 'c',
			store
		});
		expect(store.subscribe).toBeCalled();
	});

	it('should subscribe to store', async () => {
		const store = createStore();
		jest.spyOn(store, 'subscribe');
		jest.spyOn(store, 'unsubscribe');

		const ConnectedChild = connect(Object)(Child);

		expect(store.subscribe).not.toHaveBeenCalled();
		const mountedProvider = mount(
			<Provider store={store}>
				<ConnectedChild />
			</Provider>
		);

		expect(store.subscribe).toBeCalledWith(expect.any(Function));

		let child = mountedProvider
			.find('Child')
			.first()
			.instance();
		expect(child.props).toEqual({ store });

		store.setState({ a: 'b' });
		await sleep(1);

		child = mountedProvider
			.find('Child')
			.first()
			.instance();
		expect(child.props).toEqual({ a: 'b', store });

		expect(store.unsubscribe).not.toHaveBeenCalled();
		mountedProvider.unmount();
		expect(store.unsubscribe).toBeCalled();
	});

	it('should run mapStateToProps and update when outer props change', async () => {
		let state = {};
		const store = { subscribe: jest.fn(), getState: () => state };
		const Child = jest.fn(() => null).mockName('<Child>');
		let mappings = 0;

		// Jest mock return values are broken :(
		const mapStateToProps = jest.fn((state, props) => ({ mappings: ++mappings, ...props }));

		let root;
		class Outer extends Component {
			constructor() {
				super();
				this.state = {};
				root = this;
				root.setProps = props => this.setState({ props });
			}
			render() {
				root = this;
				return (
					<Provider store={store}>
						<ConnectedChild {...(this.state.props || this.props)} />
					</Provider>
				);
			}
		}

		const ConnectedChild = connect(mapStateToProps)(Child);
		const mountedProvider = mount(<Outer />);

		expect(mapStateToProps).toHaveBeenCalledTimes(1);
		expect(mapStateToProps).toHaveBeenCalledWith({}, { });
		// first render calls mapStateToProps
		expect(Child).toHaveBeenCalledWith(
			{ mappings: 1, store },
			expect.anything()
		);

		mapStateToProps.mockClear();
		Child.mockClear();

		// root.setState({ a: 'b' });
		mountedProvider.setProps({ a: 'b' });

		// await sleep(100);

		expect(mapStateToProps).toHaveBeenCalledTimes(1);
		expect(mapStateToProps).toHaveBeenCalledWith({}, {});
		// outer props were changed
		expect(Child).toHaveBeenCalledWith(
			{ mappings: 2, a: 'b', store },
			expect.anything()
		);

		mapStateToProps.mockClear();
		Child.mockClear();

		mountedProvider.setProps({ });

		await sleep(1);

		// re-rendered, but outer props were not changed
		expect(Child).toHaveBeenCalledWith(
			{ mappings: 3, a: 'b', store },
			expect.anything()
		);
	});
});
