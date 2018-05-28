// T - Wrapped component props
// S - Wrapped component state
// K - Store state
// I - Injected props to wrapped component

declare module "unistore/react" {
	import * as React from "react";
	import { Store, ActionAny } from "unistore";

	// Diff / Omit taken from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
	type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
	type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

	export interface ProviderProps<TStoreState> {
		store: Store<TStoreState>;
	}
	export class Provider<IProps extends ProviderProps<TStoreState>, TStoreState> extends React.Component<IProps, {}> {
		render(): React.ReactNode;
	}

	//Props

	interface MapStateToProps<TStoreState, TExternalProps, TStoreProps> {
		(state: TStoreState, ownProps: TExternalProps): TStoreProps;
	}
	type MapStateToPropsParam<TStoreState, TExternalProps, TStoreProps> = MapStateToProps<TStoreState, TExternalProps, TStoreProps> | null | undefined;

	interface MapActionsToPropsFunction<TStoreState> {
		[actionName: string]: ActionAny<TStoreState> | ActionAny<TStoreState>;
	}
	interface MapActionsToPropsFactory<TStoreState, TActionProps> {
		<TActionProps>(store: Store<TStoreState>): TActionProps;
	}
	type MapActionsToPropsParam<TActionProps, TStoreState> = MapActionsToPropsFactory<TStoreState, TActionProps>; //| MapActionsToPropsFunction<TStoreState>;

	type DefaultMapActionToProps<TStoreState> = { store: Store<TStoreState> }

	interface FunctionalComponent<TProps> extends React.StatelessComponent<TProps> { }
	interface Component<TProps, TState> extends React.Component<TProps, TState> { }
	type AnyComponent<PropsType, StateType> = FunctionalComponent<PropsType> | Component<PropsType, StateType>;

	interface InferableComponentEnhancerWithProps<TInjectedProps, TNeedProps> {
		<TProps extends TInjectedProps, TState = {}>(
			component: AnyComponent<TProps, TState>
		): FunctionalComponent<Omit<TProps, keyof TInjectedProps> & TNeedProps> & { WrappedComponent: AnyComponent<TProps, TState> }
	}

	type InferableComponentEnhancer<TInjectedProps> = InferableComponentEnhancerWithProps<TInjectedProps, {}>


	export interface Connect {
		(): InferableComponentEnhancer<DefaultMapActionToProps<any>>;

		<TStoreProps={}, TExternalProps={}, TStoreState={}>(
			mapStateToProps: MapStateToPropsParam<TStoreState, TExternalProps, TStoreProps>
		): InferableComponentEnhancerWithProps<TStoreProps & DefaultMapActionToProps<TStoreState>, TExternalProps>;

		<T extends string, TStoreProps={ [K in T]: any }, TExternalProps={}>(
			mapStateToProps: T[]
		): InferableComponentEnhancerWithProps<TStoreProps & DefaultMapActionToProps<any>, TExternalProps>;

		<TStoreProps={}, TActionProps extends MapActionsToPropsFunction<TStoreState>={}, TActionPropsRemap = { [K in keyof TActionProps]: (...args) => void }, TExternalProps={}, TStoreState={}>(
			mapStateToProps: MapStateToPropsParam<TStoreState, TExternalProps, TStoreProps>,
			mapActionsToProps: MapActionsToPropsParam<TActionProps, TStoreState>
		): InferableComponentEnhancerWithProps<TStoreProps & TActionPropsRemap, TExternalProps>;

	}

	export const connect: Connect;
}
