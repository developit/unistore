// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component
import * as Preact from "preact";

export type Listener<K> = (state: K) => void;
export type Unsubscribe = () => void;
export type Action<K> = (state: K, ...args) => void;
export type BoundAction = () => void;

export interface Store<K> {
	action(action: Action<K>): BoundAction;
	setState(update: object, overwrite?: boolean): void;
	subscribe(f: Listener<K>): Unsubscribe;
	unsubscribe(f: Listener<K>): void;
	getState(): K;
}

export function createStore<K>(state?: K): Store<K>;

export type ActionFn<K> = (state: K) => object;

export interface ActionMap<K> {
	[actionName: string]: ActionFn<K>;
}

export type ActionCreator<K> = (store: Store<K>) => ActionMap<K>;

export type StateMapper<T, K, I> = (state: K, props: T) => I;

// TODO: Child should not be `any`.
export function connect<T, S, K, I>(
	mapStateToProps: string | Array<string> | StateMapper<T, K, I>,
	actions?: ActionCreator<K> | object
): (Child: any) => Preact.ComponentConstructor<T, S>;

export interface ProviderProps<T> {
	store: Store<T>;
}

export class Provider<T> extends Preact.Component<ProviderProps<T>, {}> {
	render(props: ProviderProps<T>, { }): Preact.VNode;
}
