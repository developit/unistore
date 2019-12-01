// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

export type Listener<K> = (state: K, action?: Action<K>, update?: Partial<K>) => void;
export type Unsubscribe = () => void;
export type ActionFn<K> = (state: K, store: Store<K>) => Promise<Partial<K>> | Partial<K> | void;
export interface ActionObject<K> {
  type: string;
  action: ActionFn<K>;
}
export type Action<K> = ActionObject<K> | ActionFn<K>

export interface Store<K> {
	action(action: Action<K>): Promise<void> | void;
	setState<U extends keyof K>(update: Pick<K, U>, overwrite?: boolean, action?: Action<K>): void;
	subscribe(f: Listener<K>): Unsubscribe;
	unsubscribe(f: Listener<K>): void;
	getState(): K;
}

export default function createStore<K>(state?: K): Store<K>;

export interface ActionMap<K> {
	[actionName: string]: ActionCreator<K>;
}

export type ActionCreator<K> = (...args: any[]) => Action<K>;

export type StateMapper<T, K, I> = (state: K, props: T) => I;
