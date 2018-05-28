declare module "unistore" {
	import * as Preact from "preact";

	export type Action<TStoreState> = (state: TStoreState) => Partial<TStoreState>;
	export type Action1<TStoreState, T1> = (state: TStoreState, p1: T1) => Partial<TStoreState>;
	export type Action2<TStoreState, T1, T2> = (state: TStoreState, p1: T1, p2: T2) => Partial<TStoreState>;
	export type ActionAny<TStoreState> = (state: TStoreState, ...args) => Partial<TStoreState>;

	export type BoundAction = () => void;
	export type BoundAction1<T1> = (p1: T1) => void;
	export type BoundAction2<T1, T2> = (p1: T1, p2: T2) => void;
	export type BoundActionAny = (...args) => void;

	export type Listener<TStoreState> = (state: TStoreState, action?: ActionAny<TStoreState>) => void;
	export type Unsubscribe = () => void;

	export interface Store<TStoreState> {
		action(action: Action<TStoreState>): BoundAction;
		action<T1>(action: Action1<TStoreState, T1>): BoundAction1<T1>;
		action<T1, T2>(action: Action2<TStoreState, T1, T2>): BoundAction2<T1, T2>;
		action(action: ActionAny<TStoreState>): BoundActionAny;

		setState(update: object, overwrite?: boolean, action?: Action<TStoreState>): void;
		subscribe(func: Listener<TStoreState>): Unsubscribe;
		unsubscribe(func: Listener<TStoreState>): void;
		getState(): TStoreState;
	}
	export default function createStore<TStoreState>(state?: TStoreState): Store<TStoreState>;
}
