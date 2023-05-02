import esbuild from 'esbuild';
// import htmlPlugin from '@chialab/esbuild-plugin-html';

await esbuild.build({
    entryPoints: ['www/js/app.js'],
    bundle: true,
    platform: 'browser',
    // outdir: 'dist',
    outfile: 'bundle.js',
    assetNames: 'assets/[name]',
    chunkNames: '[ext]/[name]',
    // plugins: [
    //     htmlPlugin(),
    // ],
});