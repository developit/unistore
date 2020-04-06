import { h, render } from 'preact';
import createStore from '../..';
import preact from '../../preact';

describe('build: default', () => {
	describe('unistore', () => {
		it('should export only a single function as default', () => {
			expect(createStore).toBeInstanceOf(Function);
		});
	});

	describe('unistore/preact', () => {
		it('should export connect', () => {
			expect(preact).toHaveProperty('connect', expect.any(Function));
		});
		it('should export Provider', () => {
			expect(preact).toHaveProperty('Provider', expect.any(Function));
		});
		it('should no export anything else', () => {
			expect(preact).toEqual({
				connect: preact.connect,
				Provider: preact.Provider
			});
		});
	});

	describe('smoke test (preact)', () => {
		it('should render', done => {
			const { Provider, connect } = preact;
			const actions = {
				incrementTwice: () => (getState, dispatch) => {
					dispatch(() => ({ count: getState().count + 1 }));
					return new Promise(r =>
						setTimeout(() => {
							r({ count: getState().count + 1 });
						}, 20)
					);
				}
			};
			const App = connect('count', actions)(({ count, incrementTwice }) => (
				<button onClick={incrementTwice}>count: {count}</button>
			));
			const store = createStore({ count: 0 });
			let root = document.createElement('div');
			render(
				<Provider store={store}>
					<App />
				</Provider>,
				root
			);
			expect(store.getState()).toEqual({ count: 0 });
			root.firstElementChild.click();
			expect(store.getState()).toEqual({ count: 1 });
			setTimeout(() => {
				expect(store.getState()).toEqual({ count: 2 });
				expect(root.textContent).toBe('count: 2');
				done();
			}, 30);
		});
	});
});
