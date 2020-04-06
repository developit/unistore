// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

declare module 'unistore/preact' {
	import * as Preact from 'preact';
	import { StateMapper, Store, ActionCreatorsObject, MappedActionCreators  } from 'unistore';

	export function connect<T, S, K, I, A extends ActionCreatorsObject<K, E>, E = any>(
		mapStateToProps: string | Array<string> | StateMapper<T, K, I> | null,
		actions?: A,
	): (
		Child: Preact.ComponentConstructor<T & I & MappedActionCreators<A>, S> | Preact.AnyComponent<T & I & MappedActionCreators<A>, S>
	) => Preact.ComponentConstructor<T | T & I, S>;

	export interface ProviderProps<K, E = any> {
		store: Store<K, E>;
	}

	export class Provider<K> extends Preact.Component<ProviderProps<K>> {
		render(props: ProviderProps<K>): Preact.JSX.Element;
	}
}
