declare module "unistore/devtools" {
	import { Store } from "unistore";
	export default function devtools<TStoreState>(store: Store<TStoreState>): Store<TStoreState>;
}
