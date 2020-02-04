export default function createSubscriber() {
	let listeners = [];

	//  Remove a previously-registered listener function.
	function unsubscribe(listener) {
		let out = [];
		for (let i=0; i<listeners.length; i++) {
			if (listeners[i]===listener) {
				listener = null;
			}
			else {
				out.push(listeners[i]);
			}
		}
		listeners = out;
	}

	return {
		// Calls registered listeners with given arguments.
		emit() {
			let currentListeners = listeners;
			for (let i=0; i<currentListeners.length; i++) {
				currentListeners[i].apply(null, arguments);
			}
		},

		// Register a listener function to be called whenever state is changed. Returns an `unsubscribe()` function.
		subscribe(listener) {
			listeners.push(listener);
			return () => { unsubscribe(listener); };
		},

		unsubscribe
	};
}
