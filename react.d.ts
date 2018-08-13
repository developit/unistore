// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

declare module "@lukelindsey/unistore/react" {
	import * as React from "react";
	import { ActionCreator, StateMapper, Store } from "@lukelindsey/unistore";

	export function connect<T, S, K, I>(
		mapStateToProps: string | Array<string> | StateMapper<T, K, I>,
		actions?: ActionCreator<K> | object
	): (Child: (props: T & I) => React.ReactNode) => React.Component<T, S>;

	export interface ProviderProps<T> {
		store: Store<T>;
	}

	export class Provider<T> extends Component<ProviderProps<T>, {}> {
		render(): React.ReactNode;
	}
}
