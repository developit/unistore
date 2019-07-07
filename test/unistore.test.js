import createStore from '../src';

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
		expect(sub1).toBeCalledWith(store.getState(), { a: 'b' });

		store.subscribe(sub2);
		store.setState({ c: 'd' });

		expect(sub1).toHaveBeenCalledTimes(2);
		expect(sub1).toHaveBeenLastCalledWith(store.getState(), { c: 'd' });
		expect(sub2).toBeCalledWith(store.getState(), { c: 'd' });
    });

    it('should invoke subscriptions passing additional action parameter when using mutations', () => {
        let store = createStore({ foo: 0 }, {
			setFoo: (state, {v}) => ({ foo: v }),
		})

        let sub = jest.fn();
        let rval = store.subscribe(sub);

        store.mutate({ setFoo: { v: 1 } });
        expect(sub).toBeCalledWith(store.getState(), { foo: 1 }, { setFoo: { v: 1 } })
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

	 it('should allow mutations', () => {
		let store = createStore({ foo: 0 }, {
			setFoo: (state, {v}) => ({ foo: v }),
		})

		store.mutate({ setFoo: { v: 1 } })
		expect(store.getState()).toMatchObject({ foo: 1 })
	 });
});
