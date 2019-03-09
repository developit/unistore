import { h, render } from 'preact';
import createStore from '../../src';
import { Provider, connect } from '../../src/integrations/preact';

const sleep = ms => new Promise( r => setTimeout(r, ms) );

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
		let action;

		let rval = store.subscribe(sub1);
		expect(rval).toBeInstanceOf(Function);

		store.setState({ a: 'b' });
		expect(sub1).toBeCalledWith(store.getState(), action);

		store.subscribe(sub2);
		store.setState({ c: 'd' });

		expect(sub1).toHaveBeenCalledTimes(2);
		expect(sub1).toHaveBeenLastCalledWith(store.getState(), action);
		expect(sub2).toBeCalledWith(store.getState(), action);
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
	it('should provide props into context', () => {
		const Child = jest.fn();

		render(
			<Provider store="a">
				<Child />
			</Provider>,
			document.body
		);
		expect(Child).toHaveBeenCalledWith(expect.anything(), { store: 'a' });

		let store = { name: 'obj' };
		render(
			<Provider store={store}>
				<Child />
			</Provider>,
			document.body
		);
		expect(Child).toHaveBeenCalledWith(expect.anything(), { store });
	});
});

describe('connect()', () => {
	it('should pass mapped state as props', () => {
		let state = { a: 'b' };
		const store = { subscribe: jest.fn(), getState: () => state };
		const Child = jest.fn();
		const ConnectedChild = connect(Object)(Child);
		render(
			<Provider store={store}>
				<ConnectedChild />
			</Provider>,
			document.body
		);
		expect(Child).toHaveBeenCalledWith(
			{ a: 'b', store, children: expect.anything() },
			expect.anything()
		);
		expect(store.subscribe).toBeCalled();
	});

	it('should transform string selector', () => {
		let state = { a: 'b', b: 'c', c: 'd' };
		const store = { subscribe: jest.fn(), getState: () => state };
		const Child = jest.fn();
		const ConnectedChild = connect('a, b')(Child);
		render(
			<Provider store={store}>
				<ConnectedChild />
			</Provider>,
			document.body
		);
		expect(Child).toHaveBeenCalledWith(
			{ a: 'b', b: 'c', store, children: expect.anything() },
			expect.anything()
		);
		expect(store.subscribe).toBeCalled();
	});

	it('should subscribe to store', async () => {
		const store = createStore();
		const Child = jest.fn();
		jest.spyOn(store, 'subscribe');
		jest.spyOn(store, 'unsubscribe');
		const ConnectedChild = connect(Object)(Child);

		let root = render(
			<Provider store={store}>
				<ConnectedChild />
			</Provider>,
			document.body
		);

		expect(store.subscribe).toBeCalledWith(expect.any(Function));
		expect(Child).toHaveBeenCalledWith(
			{ store, children: expect.anything() },
			expect.anything()
		);

		Child.mockClear();

		store.setState({ a: 'b' });
		await sleep(1);
		expect(Child).toHaveBeenCalledWith(
			{ a: 'b', store, children: expect.anything() },
			expect.anything()
		);

		render(null, document.body, root);
		expect(store.unsubscribe).toBeCalled();

		Child.mockClear();

		store.setState({ c: 'd' });
		await sleep(1);
		expect(Child).not.toHaveBeenCalled();
	});

	it('should run mapStateToProps and update when outer props change', () => {
		let state = {};
		const store = { subscribe: jest.fn(), getState: () => state };
		const Child = jest.fn().mockName('<Child>');
		let mappings = 0;

		// Jest mock return values are broken :(
		const mapStateToProps = jest.fn((state, props) => ({ mappings: ++mappings, ...props }));

		// const mapper = jest.fn();
		// const mapStateToProps = (state, props) => {
		// 	mapper(state, props);
		// 	mappings++;
		// 	return { mappings, ...props };
		// };

		const ConnectedChild = connect(mapStateToProps)(Child);
		let root = render(
			<Provider store={store}>
				<ConnectedChild />
			</Provider>,
			document.body
		);

		expect(mapStateToProps).toHaveBeenCalledTimes(1);
		expect(mapStateToProps).toHaveBeenCalledWith({}, { children: expect.anything() });
		// first render calls mapStateToProps
		expect(Child).toHaveBeenCalledWith(
			{ mappings: 1, store, children: expect.anything() },
			expect.anything()
		);

		mapStateToProps.mockClear();
		Child.mockClear();

		render(
			<Provider store={store}>
				<ConnectedChild a="b" />
			</Provider>,
			document.body,
			root
		);

		expect(mapStateToProps).toHaveBeenCalledTimes(1);
		expect(mapStateToProps).toHaveBeenCalledWith({ }, { a: 'b', children: expect.anything() });
		// outer props were changed
		expect(Child).toHaveBeenCalledWith(
			{ mappings: 2, a: 'b', store, children: expect.anything() },
			expect.anything()
		);

		mapStateToProps.mockClear();
		Child.mockClear();

		render(
			<Provider store={store}>
				<ConnectedChild a="b" />
			</Provider>,
			document.body,
			root
		);

		// re-rendered, but outer props were not changed
		expect(Child).toHaveBeenCalledWith(
			{ mappings: 3, a: 'b', store, children: expect.anything() },
			expect.anything()
		);
	});
});
