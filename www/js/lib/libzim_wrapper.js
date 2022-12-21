/**
 * xzdec_wrapper.js: Javascript wrapper around compiled xz decompressor.
 *
 * Copyright 2022 Jaifroid and contributors
 * License GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';

// DEV: Put your RequireJS definition in the rqDefLZ array below, and any function exports in the function parenthesis of the define statement
// We need to do it this way in order to load the wasm or asm versions of lzdec conditionally. Older browsers can only use the asm version
// because they cannot interpret WebAssembly.
var rqDefLZ = ['uiUtil'];

// Variable specific to this decompressor (will be used to populate global variable)
var LZMachineType = null;

// Select asm or wasm conditionally
if ('WebAssembly' in self) {
    console.debug('Instantiating WASM libzim reader');
    LZMachineType = 'WASM';
    rqDefLZ.push('libzim-wasm');
} else {
    console.debug('Instantiating ASM libzim reader');
    LZMachineType = 'ASM';
    rqDefLZ.push('libzim-asm');
}

define(rqDefLZ, function(uiUtil) {
    // DEV: libzim-xxxx.js has been compiled with `-s EXPORT_NAME="LZ" -s MODULARIZE=1` to avoid a clash with other Emscripten exports
    // Note that we include libzim-asm or libzim-wasm above in requireJS definition, but we cannot change the name in the function list
    // There is no longer any need to load it in index.html
    // For explanation of loading method below to avoid conflicts, see https://github.com/emscripten-core/emscripten/blob/master/src/settings.js

    /**
     * @typedef EMSInstance An object type representing an Emscripten instance
     */

    /**
     * The LZ Reader instance
     * @type EMSInstance
     */
    var libzim;

    LZ().then(function (instance) {
        params.zimReaderAPI.assemblerMachineType = LZMachineType;
        libzim = instance;
    }).catch(function (err) {
        if (LZMachineType === 'ASM') {
            // There is no fallback, because we were attempting to load the ASM machine, so report error immediately
            // uiUtil.reportAssemblerErrorToAPIStatusPanel('XZ', err, LZMachineType);
        } else {
            console.warn('WASM failed to load, falling back to ASM...', err);
            // Fall back to ASM
            LZMachineType = 'ASM';
            LZ = null;
            require(['libzim-asm'], function () {
                LZ().then(function (instance) {
                    params.zimReaderAPI.assemblerMachineType = LZMachineType;
                    libzim = instance;
                }).catch(function (err) {
                    // uiUtil.reportAssemblerErrorToAPIStatusPanel('LZ', err, LZMachineType);
                });
            });
        }
    });

    /**
     * Calls the libzim Web Worker with the given parameters, and returns a Promise with its response
     * 
     * @param {Object} parameters
     * @returns {Promise}
     */
    Reader.prototype.callLibzimWorker = function (parameters) {
        return new Promise(function (resolve, reject) {
            console.debug("Calling libzim WebWorker with parameters", parameters);
            var tmpMessageChannel = new MessageChannel();
            // var t0 = performance.now();
            tmpMessageChannel.port1.onmessage = function (event) {
                // var t1 = performance.now();
                // var readTime = Math.round(t1 - t0);
                // console.debug("Response given by the WebWorker in " + readTime + " ms", event.data);
                resolve(event.data);
            };
            tmpMessageChannel.port1.onerror = function (event) {
                // var t1 = performance.now();
                // var readTime = Math.round(t1 - t0);
                // console.error("Error sent by the WebWorker in " + readTime + " ms", event.data);
                reject(event.data);
            };
            LZ.postMessage(parameters, [tmpMessageChannel.port2]);
        });
    };

    return {
        Reader: Reader
    };
});
