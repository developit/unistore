// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

export type Listener<K> = (state: K, action?: Action<K>, update?: Partial<K>) => void;
export type Unsubscribe = () => void;

export type AsyncActionFn<K> = (getState: () => K, action: (action: Action<K>) => Promise<void> | void) => Promise<Partial<K> | void>;
export type SyncActionFn<K> = (getState: () => K, action: (action: Action<K>) => Promise<void> | void) => Partial<K> | void;
export type ActionFn<K> = AsyncActionFn<K> | SyncActionFn<K>;

export type AsyncActionObject<K> = {
  type: string;
  action: AsyncActionFn<K>;
}
export type SyncActionObject<K> = {
  type: string;
  action: SyncActionFn<K>;
}
export type ActionObject<K> = AsyncActionObject<K> | SyncActionObject<K>;

export type Action<K> = ActionObject<K> | ActionFn<K>;

export type AsyncActionCreator<K> = (...args: any[]) => AsyncActionFn<K> | AsyncActionObject<K>;
export type SyncActionCreator<K> = (...args: any[]) => SyncActionFn<K> | SyncActionObject<K>;
export type ActionCreator<K> = AsyncActionCreator<K> | SyncActionCreator<K>;

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

export type StateMapper<T, K, I> = (state: K, props: T) => I;
