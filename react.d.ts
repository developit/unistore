// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

declare module 'unistore/react' {
	import * as React from 'react';
	import { ActionCreator, StateMapper, Store } from 'unistore';

	export function connect<T, S, K, I>(
		mapStateToProps: string | Array<string> | StateMapper<T, K, I>,
		actions?: ActionCreator<K> | object
	): (
		Child: ((props: T & I) => React.ReactNode) | React.ComponentClass<T & I, S> | React.FC<T & I>
	) => React.ComponentClass<T | T & I, S> | React.FC<T | T & I>;

	export interface ProviderProps<T> {
		store: Store<T>;
	}

	export class Provider<T> extends React.Component<ProviderProps<T>, {}> {
		render(): React.ReactNode;
	}

	interface ComponentConstructor<P = {}, S = {}> {
		new (props: P, context?: any): React.Component<P, S>;
	}
}
