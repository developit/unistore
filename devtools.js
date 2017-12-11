module.exports = function unistoreDevTools(store) {
	const extension = window.devToolsExtension || window.top.devToolsExtension;

	if (!extension) {
		console.warn('Please install/enable Redux devtools extension');
		store.devtools = null;

		return;
	}

	if (!store.devtools) {
		store.devtools = extension.connect();
		store.devtools.subscribe(function (message) {
			if (message.type === 'DISPATCH' && message.state) {
				store.setState(JSON.parse(message.state), true);
			}
		});
		store.devtools.init(store.getState());
		store.subscribe(function (state, action) {
			var actionName = action && action.name;

			if (actionName) store.devtools.send(actionName, state);
		});
	}

	return store;
}
