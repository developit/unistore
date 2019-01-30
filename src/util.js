// Bind an object/factory of actions to the store and wrap them.
export function mapActions(actions, store) {
	if (typeof actions==='function') actions = actions(store);
	const mapped = {};
	for (let i in actions) mapped[i] = store.action(actions[i]);
	return mapped;
}


// select('foo,bar') creates a function of the form: ({ foo, bar }) => ({ foo, bar })
export function select(properties) {
	if (typeof properties==='string') properties = properties.split(/\s*,\s*/);
	return state => {
		const selected = {};
		let i = properties.length;
		while (i-- > 0) selected[properties[i]] = state[properties[i]];
		return selected;
	};
}


// Lighter Object.assign stand-in
export function assign(obj, props) {
	for (let i in props) obj[i] = props[i];
	return obj;
}
