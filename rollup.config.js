// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const config = {
    input: 'www/js/app.js',
    output: {
        file: 'www/js/bundle.js',
        format: 'iife',
        name: 'KiwixJSBundle'
    },
    plugins: [
        babel({ 
            exclude: "node_modules/**",
            babelHelpers: 'bundled' 
        }),
        resolve({
            browser: true
        }),
        commonjs(),
        replace({
            // This is needed to prevent a fatal error in IE11 (bug with the URL constructor polyfill)
            'document.baseURI' : "document.location.href.replace(/[^/]*$/, '')"
        })
    ]
};

export default config;