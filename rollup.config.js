// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';

const config = {
    input: 'www/js/app.js',
    output: {
        file: 'dist/www/js/bundle.js',
        format: 'iife',
        name: 'KiwixJSBundle'
    },
    plugins: [
        babel({ 
            exclude: 'node_modules/**',
            babelHelpers: 'bundled' 
        }),
        resolve({
            browser: true
        }),
        commonjs(),
        replace({
            // This is needed to prevent a fatal error in IE11 (bug with the URL constructor polyfill)
            'document.baseURI' : "document.location.href.replace(/[^/]*$/, '')"
        }),
        copy({
            targets: [
              { src: ['www/**', '!www/js/app.js', '!www/js/lib'], dest: 'dist/www', expandDirectories: true, onlyFiles: true },
              { src: ['service-worker.js', 'index.html', 'manifest.json'], dest: 'dist' },
            ],
            flatten: false
        }),
        copy({
            targets: [
              { src: 'www/js/lib/*dec-wasm.wasm', dest: 'dist/www/js' }
            ],
            flatten: true
        })
    ]
};

export default config;