import { h, render } from 'preact';
import createStore from '../../src';
import { Provider, connect } from '../../src/integrations/preact';

const sleep = ms => new Promise( r => setTimeout(r, ms) );

const NO_CHILDREN = global.IS_PREACT_8 ? expect.anything() : undefined;

describe(`integrations/preact${global.IS_PREACT_8 ? '-8' : ''}`, () => {
	describe('<Provider>', () => {
		afterEach(() => {
			render(null, document.body);
		});

		it('should provide props into context', () => {
			const Child = jest.fn();

			render(
				<Provider store="a">
					<Child />
				</Provider>,
				document.body
			);
			expect(Child).toHaveBeenCalledWith(expect.anything(), { store: 'a' });

			render(null, document.body);

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
		afterEach(() => {
			render(null, document.body);
		});

		it('should pass mapped state as props', () => {
			let state = { a: 'b' };
			const store = { subscribe: jest.fn(), unsubscribe: jest.fn(), getState: () => state };
			const Child = jest.fn();
			const ConnectedChild = connect(Object)(Child);
			render(
				<Provider store={store}>
					<ConnectedChild />
				</Provider>,
				document.body
			);
			expect(Child).toHaveBeenCalledWith(
				{ a: 'b', store, children: NO_CHILDREN },
				expect.anything()
			);
			expect(store.subscribe).toBeCalled();
		});

		it('should transform string selector', () => {
			let state = { a: 'b', b: 'c', c: 'd' };
			const store = { subscribe: jest.fn(), unsubscribe: jest.fn(), getState: () => state };
			const Child = jest.fn();
			const ConnectedChild = connect('a, b')(Child);
			render(
				<Provider store={store}>
					<ConnectedChild />
				</Provider>,
				document.body
			);
			expect(Child).toHaveBeenCalledWith(
				{ a: 'b', b: 'c', store, children: NO_CHILDREN },
				expect.anything()
			);
			expect(store.subscribe).toBeCalled();
		});

		it('should subscribe to store on mount', async () => {
			const store = { subscribe: jest.fn(), unsubscribe: jest.fn(), getState: () => ({}) };
			jest.spyOn(store, 'subscribe');
			const ConnectedChild = connect(Object)(() => null);

			render(
				<Provider store={store}>
					<ConnectedChild />
				</Provider>,
				document.body
			);

			expect(store.subscribe).toBeCalledWith(expect.any(Function));
		});

		it('should unsubscribe from store when unmounted', async () => {
			const store = createStore();
			jest.spyOn(store, 'unsubscribe');
			const ConnectedChild = connect(Object)(() => null);
			render(
				<Provider store={store}>
					<ConnectedChild />
				</Provider>,
				document.body
			);
			await sleep(1);
			render(null, document.body);
			expect(store.unsubscribe).toBeCalled();
		});

		it('should subscribe to store', async () => {
			const store = createStore();
			const Child = jest.fn();
			jest.spyOn(store, 'subscribe');
			jest.spyOn(store, 'unsubscribe');
			const ConnectedChild = connect(Object)(Child);

			render(
				<Provider store={store}>
					<ConnectedChild />
				</Provider>,
				document.body
			);

			expect(store.subscribe).toBeCalledWith(expect.any(Function));
			expect(Child).toHaveBeenCalledWith(
				{ store, children: NO_CHILDREN },
				expect.anything()
			);

			Child.mockClear();

			store.setState({ a: 'b' });
			await sleep(1);
			expect(Child).toHaveBeenCalledWith(
				{ a: 'b', store, children: NO_CHILDREN },
				expect.anything()
			);

			render(null, document.body);
			expect(store.unsubscribe).toBeCalled();

			Child.mockClear();

			store.setState({ c: 'd' });
			await sleep(1);
			expect(Child).not.toHaveBeenCalled();
		});

		it('should run mapStateToProps and update when outer props change', async () => {
			let state = {};
			const store = { subscribe: jest.fn(), unsubscribe: () => {}, getState: () => state };
			const Child = jest.fn().mockName('<Child>').mockReturnValue(42);
			let mappings = 0;

			// Jest mock return values are broken :(
			const mapStateToProps = jest.fn((state, props) => ({
				mappings: ++mappings,
				...props
			}));

			const ConnectedChild = connect(mapStateToProps)(Child);
			render(
				<Provider store={store}>
					<ConnectedChild />
				</Provider>,
				document.body
			);

			expect(mapStateToProps).toHaveBeenCalledTimes(1);
			expect(mapStateToProps).toHaveBeenCalledWith({}, { children: NO_CHILDREN });
			// first render calls mapStateToProps
			expect(Child).toHaveBeenCalledWith(
				{ mappings: 1, store, children: NO_CHILDREN },
				expect.anything()
			);

			mapStateToProps.mockClear();
			Child.mockClear();

			render(
				<Provider store={store}>
					<ConnectedChild a="b" />
				</Provider>,
				document.body
			);

			expect(mapStateToProps).toHaveBeenCalledTimes(1);
			expect(mapStateToProps).toHaveBeenCalledWith({ }, { a: 'b', children: NO_CHILDREN });
			// outer props were changed
			expect(Child).toHaveBeenCalledWith(
				{ mappings: 2, a: 'b', store, children: NO_CHILDREN },
				expect.anything()
			);

			mapStateToProps.mockClear();
			Child.mockClear();

			render(
				<Provider store={store}>
					<ConnectedChild a="b" />
				</Provider>,
				document.body
			);

			expect(mapStateToProps).toHaveBeenCalledTimes(1);
			expect(mapStateToProps).toHaveBeenCalledWith({ }, { a: 'b', children: NO_CHILDREN });

			// re-rendered, but outer props were not changed
			expect(Child).toHaveBeenCalledWith(
				{ mappings: 3, a: 'b', store, children: NO_CHILDREN },
				expect.anything()
			);
		});
	});
});
