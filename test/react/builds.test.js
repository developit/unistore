import 'raf/polyfill';
import React from 'react';

import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() });

import createStore from '../..';
import react from '../../react';

describe('build: default', () => {
	describe('unistore', () => {
		it('should export only a single function as default', () => {
			expect(createStore).toBeInstanceOf(Function);
		});
	});

	describe('unistore/react', () => {
		it('should export connect', () => {
			expect(react).toHaveProperty('connect', expect.any(Function));
		});
		it('should export Provider', () => {
			expect(react).toHaveProperty('Provider', expect.any(Function));
		});
		it('should no export anything else', () => {
			expect(react).toEqual({
				connect: react.connect,
				Provider: react.Provider
			});
		});
	});

	describe('smoke test (react)', () => {
		it('should render', done => {
			const { Provider, connect } = react;
			const actions = ({ getState, setState }) => ({
				incrementTwice(state) {
					setState({ count: state.count + 1 });
					return new Promise(r =>
						setTimeout(() => {
							r({ count: getState().count + 1 });
						}, 20)
					);
				}
			});
			const App = connect('count', actions)(({ count, incrementTwice }) => (
				<button id="some_button" onClick={incrementTwice}>
					count: {count}
				</button>
			));
			const store = createStore({ count: 0 });
			const provider = (
				<Provider store={store}>
					<App />
				</Provider>
			);
			const mountedProvider = mount(provider);
			expect(store.getState()).toEqual({ count: 0 });
			const button = mountedProvider.find('#some_button').simulate('click'); //.click();
			expect(store.getState()).toEqual({ count: 1 });
			setTimeout(() => {
				expect(store.getState()).toEqual({ count: 2 });
				expect(button.text()).toBe('count: 2');
				done();
			}, 30);
		});
	});
});
