// Bind an object/factory of actions to the store and wrap them.
export function mapActions(actions, store) {
	let mapped = {};
	for (let i in actions) {
		mapped[i] = function () {
			return store.action(actions[i].apply(actions, arguments));
		};
	}
	return mapped;
}


// select('foo,bar') creates a function of the form: ({ foo, bar }) => ({ foo, bar })
export function select(properties) {
	if (typeof properties==='string') properties = properties.split(/\s*,\s*/);
	return state => {
		let selected = {};
		for (let i=0; i<properties.length; i++) {
			selected[properties[i]] = state[properties[i]];
		}
		return selected;
	};
}


// Lighter Object.assign stand-in
export function assign(obj, props) {
	for (let i in props) obj[i] = props[i];
	return obj;
}
