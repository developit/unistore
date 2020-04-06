// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

export type Listener<K, E> = (state: K, action?: Action<K, E>, update?: Partial<K>) => void;
export type Unsubscribe = () => void;

export type AsyncActionFn<K, E> = (getState: () => K, action: (action: Action<K, E>) => Promise<void> | void, extraArg: E) => Promise<Partial<K> | void>;
export type SyncActionFn<K, E> = (getState: () => K, action: (action: Action<K, E>, E) => Promise<void> | void, extraArg: E) => Partial<K> | void;
export type ActionFn<K, E> = AsyncActionFn<K, E> | SyncActionFn<K, E>;

export type AsyncActionObject<K, E> = {
  type: string;
  action: AsyncActionFn<K, E>;
}
export type SyncActionObject<K, E> = {
  type: string;
  action: SyncActionFn<K, E>;
}
export type ActionObject<K, E> = AsyncActionObject<K, E> | SyncActionObject<K, E>;

export type Action<K, E> = ActionObject<K, E> | ActionFn<K, E>;

export type AsyncActionCreator<K, E> = (...args: any[]) => AsyncActionFn<K, E> | AsyncActionObject<K, E>;
export type SyncActionCreator<K, E> = (...args: any[]) => SyncActionFn<K, E> | SyncActionObject<K, E>;
export type ActionCreator<K, E> = AsyncActionCreator<K, E> | SyncActionCreator<K, E>;

export type ActionCreatorsObject<K, E> = {
  [actionCreator: string]: ActionCreator<K, E>
}

export type MappedActionCreators<A> = {
  [P in keyof A]: A[P] extends AsyncActionCreator<any, any> ? (...args: any[]) => Promise<void> : (...args: any[]) => void
}


export interface Store<K, E> {
	dispatch(action: Action<K, E>): Promise<void> | void;
	setState<U extends keyof K>(update: Pick<K, U>, overwrite?: boolean, action?: Action<K, E>): void;
	subscribe(f: Listener<K, E>): Unsubscribe;
	unsubscribe(f: Listener<K, E>): void;
	getState(): K;
}

export default function createStore<K, E>(state?: K, extraArg?: E): Store<K, E>;

export type StateMapper<T, K, I> = (state: K, props: T) => I;
