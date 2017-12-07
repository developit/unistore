import { h, render } from 'preact';
import { createStore, Provider, connect } from './unistore';

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

		let rval = store.subscribe(sub1);
		expect(rval).toBe(undefined);

		store.setState({ a: 'b' });
		expect(sub1).toBeCalledWith(store.getState());

		store.subscribe(sub2);
		store.setState({ c: 'd' });

		expect(sub1).toHaveBeenCalledTimes(2);
		expect(sub1).toHaveBeenLastCalledWith(store.getState());
		expect(sub2).toBeCalledWith(store.getState());
	});

	it('should unsubscribe', () => {
		let store = createStore();

		let sub1 = jest.fn();
		let sub2 = jest.fn();

		store.subscribe(sub1);
		store.subscribe(sub2);

		store.setState({ a: 'b' });
		expect(sub1).toBeCalled();
		expect(sub2).toBeCalled();

		sub1.mockReset();
		sub2.mockReset();

		store.unsubscribe(sub2);

		store.setState({ c: 'd' });
		expect(sub1).toBeCalled();
		expect(sub2).not.toBeCalled();

		sub1.mockReset();
		sub2.mockReset();

		store.unsubscribe(sub1);

		store.setState({ e: 'f' });
		expect(sub1).not.toBeCalled();
		expect(sub2).not.toBeCalled();
	});

	it('should process data in middleware', () => {
		let store = createStore();
		let mockMiddleware = jest.fn();
		store.addMiddleware(state => ({ ...state, middleware: true }));
		store.addMiddleware(state => {
			mockMiddleware();
			return state;
		});
		expect(store.getState()).toMatchObject({});
		store.setState({ a: 'b' });
		expect(mockMiddleware).toBeCalled();
		expect(store.getState()).toMatchObject({ a: 'b', middleware: true });
	});
});

describe('<Provider>', () => {
	it('should provide props into context', () => {
		const Child = jest.fn();

		render(<Provider store="a"><Child /></Provider>, document.body);
		expect(Child).toHaveBeenCalledWith(expect.anything(), { store: 'a' });

		let store = { name: 'obj' };
		render(<Provider store={store}><Child /></Provider>, document.body);
		expect(Child).toHaveBeenCalledWith(expect.anything(), { store });
	});
});

describe('connect()', () => {
	it('should pass mapped state as props', () => {
		let state = { a: 'b' };
		const store = { subscribe: jest.fn(), getState: () => state };
		const Child = jest.fn();
		const ConnectedChild = connect(Object)(Child);
		render(<Provider store={store}><ConnectedChild /></Provider>, document.body);
		expect(Child).toHaveBeenCalledWith({ a: 'b', store, children: expect.anything() }, expect.anything());
		expect(store.subscribe).toBeCalled();
	});

	it('should subscribe to store', async () => {
		const store = createStore();
		const Child = jest.fn();
		jest.spyOn(store, 'subscribe');
		jest.spyOn(store, 'unsubscribe');
		const ConnectedChild = connect(Object)(Child);

		let root = render(<Provider store={store}><ConnectedChild /></Provider>, document.body);

		expect(store.subscribe).toBeCalledWith(expect.any(Function));
		expect(Child).toHaveBeenCalledWith({ store, children: expect.anything() }, expect.anything());

		Child.mockReset();

		store.setState({ a: 'b' });
		await sleep(1);
		expect(Child).toHaveBeenCalledWith({ a: 'b', store, children: expect.anything() }, expect.anything());

		render(null, document.body, root);
		expect(store.unsubscribe).toBeCalled();

		Child.mockReset();

		store.setState({ c: 'd' });
		await sleep(1);
		expect(Child).not.toHaveBeenCalled();
	});
});