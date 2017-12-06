import fs from 'fs';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-post-replace';
import es3 from 'rollup-plugin-es3';

let pkg = JSON.parse(fs.readFileSync('./package.json'));

let format = process.env.FORMAT;

export default {
	strict: false,
	sourcemap: true,
	exports: 'default',
	input: pkg.source,
	output: {
		format,
		name: pkg.amdName || pkg.name,
		file: (format==='es' && pkg.module) || (format==='umd' && pkg['umd:main']) || pkg.main
	},
	external: ['preact'].concat(Object.keys(pkg.dependencies)),
	globals: {
		preact: 'preact',
		'preact-context-provider': 'Provider'
	},
	plugins: [
		buble({
			objectAssign: 'Object.assign',
			jsx: 'h'
		}),
		es3(),
		format==='cjs' && replace({
			'module.exports = index;': '',
			'var index =': 'module.exports ='
		}),
		format==='umd' && replace({
			'return index;': '',
			'var index =': 'return'
		}),
		format!=='es' && uglify({
			output: { comments: false },
			mangle: {
				toplevel: format==='cjs'
			}
		})
	]
};
