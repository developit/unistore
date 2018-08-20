declare module "unistore" {
  export type Action<TStoreState, TArgs extends any[]> = (state: TStoreState, ...args: TArgs) => Partial<TStoreState>;
  export type BoundAction<TArgs extends any[]> = (...args: TArgs) => void;

  export type Listener<TStoreState, TArgs extends any[]> = (state: TStoreState, action?: Action<TStoreState, TArgs>) => void;
  export type Unsubscribe = () => void;

  export interface Store<TStoreState> {
    action<TArgs extends any[]>(action: Action<TStoreState, TArgs>): BoundAction<TArgs>;

    setState<TArgs extends any[]>(update: object, overwrite?: boolean, action?: Action<TStoreState, TArgs>): void;
    subscribe<TArgs extends any[]>(func: Listener<TStoreState, TArgs>): Unsubscribe;
    unsubscribe<TArgs extends any[]>(func: Listener<TStoreState, TArgs>): void;
    getState(): TStoreState;
  }
  export default function createStore<TStoreState>(state?: TStoreState): Store<TStoreState>;
}
