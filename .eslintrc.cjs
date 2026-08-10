module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: 'standard',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    ignorePatterns: [
        // Build output, and packaged copies of the app
        'dist/',
        'bld/',
        'BundleArtifacts/',
        'AppPackages/',
        // Third-party or generated bundles that we do not maintain
        'replayWorker.js',
        'www/js/katex/',
        'www/js/lib/*.min.js',
        'www/js/lib/webpHeroBundle_*.js',
        'www/js/lib/*-asm.js',
        'www/js/lib/*-asm.dev.js',
        'www/js/lib/*-wasm.js',
        'www/js/lib/*-wasm.dev.js',
        'www/js/lib/promisePolyfill.js'
    ],
    rules: {
        semi: ['error', 'always'],
        // Many files in this Repo are deliberately saved with a BOM (see scripts/Add-Remove-BOM.ps1)
        'unicode-bom': 0,
        indent: ['error', 4],
        'dot-notation': 0,
        'no-var': 0,
        'no-mixed-operators': 0,
        'no-extra-parens': 1,
        'no-unused-expressions': 1,
        'no-unused-vars': 1,
        'n/no-callback-literal': 0,
        'object-shorthand': 0,
        'one-var': 0,
        'multiline-ternary': 0,
        'no-extend-native': 0,
        'no-global-assign': 0
    }
};
