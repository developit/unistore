// This runs the Preact tests against a copy of Preact 8.4.2.
jest.isolateModules(() => {
	const preact = require('../fixtures/preact-8.min.js');
	jest.setMock('preact', preact);

	// Patch Preact 8's render to work like Preact 10:
	let render = preact.render;
	preact.render = (vnode, parent) => parent._root = render(vnode, parent, parent._root);

	global.IS_PREACT_8 = true;
	require('./preact.test');
	delete global.IS_PREACT_8;
});
