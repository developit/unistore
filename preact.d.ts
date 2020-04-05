// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

declare module 'unistore/preact' {
	import * as Preact from 'preact';
	import { StateMapper, Store, ActionCreatorsObject, MappedActionCreators  } from 'unistore';

	export function connect<T, S, K, I, A extends ActionCreatorsObject<K>>(
		mapStateToProps: string | Array<string> | StateMapper<T, K, I>,
		actions?: A,
	): (
		Child: Preact.ComponentConstructor<T & I & MappedActionCreators<A>, S> | Preact.AnyComponent<T & I & MappedActionCreators<A>, S>
	) => Preact.ComponentConstructor<T | T & I, S>;

	export interface ProviderProps<T> {
		store: Store<T>;
	}

	export class Provider<T> extends Preact.Component<ProviderProps<T>> {
		render(props: ProviderProps<T>): Preact.JSX.Element;
	}
}
