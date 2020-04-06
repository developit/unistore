// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component
// A - actions

declare module 'unistore/react' {
	import * as React from 'react';
	import { StateMapper, Store, ActionCreatorsObject, MappedActionCreators  } from 'unistore';

	export function connect<T, S, K, I, A extends ActionCreatorsObject<K, E>, E = any>(
		mapStateToProps: string | Array<string> | StateMapper<T, K, I> | null,
		actions?: A,
	): (
		Child: ((props: T & I & MappedActionCreators<A>) => React.ReactNode) | React.ComponentClass<T & I & MappedActionCreators<A>, S> | React.FC<T & I & MappedActionCreators<A>>
	) => React.ComponentClass<T | T & I, S> | React.FC<T | T & I>;

	export interface ProviderProps<K, E = any> {
		store: Store<K, E>;
	}

	export class Provider<K> extends React.Component<ProviderProps<K>, {}> {
		render(): React.ReactNode;
	}

	interface ComponentConstructor<P = {}, S = {}> {
		new (props: P, context?: any): React.Component<P, S>;
	}
}
