﻿/**
 * zstdec_wrapper.js: Javascript wrapper around compiled zstd decompressor.
 *
 * Copyright 2020 Jaifroid, Mossroy and contributors
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
define(['q', 'zstdec'], function(Q) {
    // DEV: zstdec.js has been compiled with `-s EXPORT_NAME="ZD" -s MODULARIZE=1` to avoid a clash with xzdec which uses "Module" as its exported object
    // Note that we include zstdec above in requireJS definition, but we cannot change the name in the function list
    // There is no longer any need to load it in index.html
    // For explanation of loading method below to avoid conflicts, see https://github.com/emscripten-core/emscripten/blob/master/src/settings.js
    var zd;
    ZD().then(function(instance) {
        // Instantiate the zd object
        zd = instance;
        // Create JS API by wrapping C++ functions
        // DEV: Functions with simple types (integers, pointers) do not need to be wrapped
        zd.getErrorString = zd.cwrap('ZSTD_getErrorName', 'string', ['number']);
        // Get a permanent decoder handle (pointer to control structure)
        // NB there is no need to change this handle even between ZIM loads: zstddeclib encourages re-using assigned structures
        zd._decHandle = zd._ZSTD_createDStream();
    });
    
    /**
     * Number of milliseconds to wait for the decompressor to be available for another chunk
     * @type Integer
     */
    var DELAY_WAITING_IDLE_DECOMPRESSOR = 50;
    
    /**
     * Is the decompressor already working?
     * @type Boolean
     */
    var busy = false;
    
    /**
     * @typedef Decompressor
     * @property {Integer} _chunkSize The amount to feed to the decompressor in any one read loop
     * @property {FileReader} _reader The filereader to use (uses plain blob reader defined in zimfile.js)
     * @property {Integer} _inStreamPos The current known position in the steam of compressed bytes 
     * @property {Integer} _inStreamChunkedPos The position once the currently loaded chunk will have been consumed
     * @property {Integer} _outStreamPos The position in the decoded byte stream (offset from start of cluster)
     * @property {Array} _outDataBuf The buffer that stores decoded bytes (it is set to the requested blob's lenght, and when full, the data are returned)
     * @property {Integer} _outDataBufPos The number of bytes of the requested blob decoded so far
     * @property {Object} _inBuffer A JS copy of the inBuffer structure to be set in decompressor memory (malloc)
     * @property {Object} _outBuffer A JS copy of the outBuffer structure to be set in decompressor memory (malloc)
     */
    
    /**
     * @constructor
     * @param {FileReader} reader
     * @param {Integer} chunkSize
     * @returns {Decompressor}
     */
    function Decompressor(reader, chunkSize) {
        this._chunkSize = chunkSize || 5 * 1024;
        // this._chunkSize = chunkSize || zd._ZSTD_DStreamInSize();
        this._reader = reader;
    }
    /**
     * Read length bytes, offset into the decompressed stream. Consecutive calls may only
     * advance in the stream and may not overlap.
     * @param {Integer} offset Offset from which to start reading
     * @param {Integer} length Number of bytes to read
     * @returns {Promise<ArrayBuffer>} Promise for an ArrayBuffer with decoded data
     */
    Decompressor.prototype.readSlice = function(offset, length) {
        busy = true;
        this._inStreamPos = 0;
        this._inStreamChunkedPos = 0;
        this._outStreamPos = 0;
        this._outDataBuf = new Int8Array(new ArrayBuffer(length));
        this._outDataBufPos = 0;
        
        // Initialize inBuffer
        this._inBuffer = {
            ptr: null,      /* pointer to this inBuffer structure in w/asm memory */
            src: null,      /* void* src   < start of input buffer */
            size: length,   /* size_t size < size of input buffer */
            pos: 0          /* size_t pos; < position where reading stopped. Will be updated. Necessarily 0 <= pos <= size */
        };
        // Reserve w/asm memory for the outBuffer structure
        this._inBuffer.ptr = mallocOrDie(3 << 2); // 3 x 32bit bytes
        // DEV: Size of outBuffer is currently set as recommended by zd._ZSTD_DStreamOutSize() below; if you are running into
        // memory issues, it may be possible to reduce memory consumption by setting asmaller outBuffer size here and
        // reompiling zstdec.js with lower TOTAL_MEMORY (or just search for INITIAL_MEMORY in zstdec.js and change it)
        var recOutbufSize = zd._ZSTD_DStreamOutSize();
        // Initialize outBuffer
        this._outBuffer = {
            ptr: null,           /* pointer to this outBuffer structure in asm/wasm memory */
            dst: null,           /* void* dst   < start of output buffer (pointer) */
            size: recOutbufSize, /* size_t size < size of output buffer */
            pos: 0               /* size_t pos  < position where writing stopped. Will be updated. Necessarily 0 <= pos <= size */
        };
        this._outBuffer.ptr = mallocOrDie(3 << 2); // 3 x 32bit bytes
        var ret = zd._ZSTD_initDStream(zd._decHandle);
        if (zd._ZSTD_isError(ret)) {
            return Q.reject('Failed to initialize ZSTD decompression');
        }

        var that = this;
        return this._readLoop(offset, length).then(function(data) {
            // DEV: These structures are a known fixed length and could be assigned once, avoiding the need to free them
            // currently they are re-assigned on each blob request; consider changing this if memory usage appears to grow over time
            zd._free(that._inBuffer.src);
            zd._free(that._inBuffer.ptr);
            zd._free(that._outBuffer.dst);
            zd._free(that._outBuffer.ptr);
            // DEV: Freeing zd._decHandle is not needed, and actually increases memory consumption (crashing zstddeclib)
            // The library explicitly encourages re-using assigned structures and handles
            // zd._ZSTD_freeDStream(zd._decHandle);
            busy = false;
            console.log("Freed all data structures.");
            return data;
        });
    };

    /**
     * Reads stream of data from file offset for length of bytes to send to the decompresor
     * This function ensures that only one decompression runs at a time
     * @param {Integer} offset The file offset at which to begin reading compressed data
     * @param {Integer} length The amount of data to read
     * @returns {Promise} A Promise for the read data
     */
    Decompressor.prototype.readSliceSingleThread = function (offset, length) {
        if (!busy) {
            return this.readSlice(offset, length);
        } else {
            // The decompressor is already in progress.
            // To avoid using too much memory, we wait until it has finished
            // before using it for another decompression
            var that = this;
            return Q.Promise(function (resolve, reject) {
                setTimeout(function () {
                    that.readSliceSingleThread(offset, length).then(resolve, reject);
                }, DELAY_WAITING_IDLE_DECOMPRESSOR);
            });
        }
    };

    /**
     * The main loop for sending compressed data to the decompressor and retrieving decompressed bytes
     * @param {Integer} offset The offset in the *decompressed* byte stream at which the requeste blob resides
     * @param {Integer} length The deomcpressed size of the requested blob
     * @returns {Promise<Int8Array>} A Promise for an Int8Array containing the requested blob's decompressed bytes
     */
    Decompressor.prototype._readLoop = function(offset, length) {
        var that = this;
        return this._fillInBufferIfNeeded(offset, length).then(function() {
            var ret = zd._ZSTD_decompressStream(zd._decHandle, that._outBuffer.ptr, that._inBuffer.ptr);
            // var ret = zd._ZSTD_decompressStream_simpleArgs(that._decHandle, that._outBuffer.ptr, that._outBuffer.size, 0, that._inBuffer.ptr, that._inBuffer.size, 0);
            if (zd._ZSTD_isError(ret)) {
                var errorMessage = "Failed to decompress data stream!\n" + zd.getErrorString(ret);
                console.error(errorMessage);
                throw new Error(errorMessage);
            }
            var finished = false;
            if (ret === 0) {
                // stream ended
                finished = true;
            } else if (ret > 0) {
                // supply more data
                that._inBuffer.size = ret;
            }

            // Get updated inbuffer values for processing on the JS sice
            // NB the zd.Decoder will read these values from its own buffers
            var ibx32ptr = that._inBuffer.ptr >> 2;
            that._inBuffer.pos = zd.HEAP32[ibx32ptr + 2];
            
            // Get updated outbuffer values
            var obx32ptr = that._outBuffer.ptr >> 2;
            // that._outBuffer.size = zd.HEAP32[obx32ptr + 1];
            var outPos = zd.HEAP32[obx32ptr + 2];
            
            // If data have been decompressed, check to see whether the data are in the offset range we need
            if (outPos > 0 && that._outStreamPos + outPos >= offset) {
                var copyStart = offset - that._outStreamPos;
                console.log('**Copying decompressed bytes**\ncopyStart: ' + copyStart);
                if (copyStart < 0) copyStart = 0;
                for (var i = copyStart; i < outPos && that._outDataBufPos < that._outDataBuf.length; i++)
                    that._outDataBuf[that._outDataBufPos++] = zd.HEAP8[that._outBuffer.dst + i];
            }
            if (that._outDataBufPos === that._outDataBuf.length) finished = true;
            // Increment the byte stream positions
            that._inStreamPos += that._inBuffer.pos;
            that._outStreamPos += outPos;
            
            // TESTING (remove before merge)
            console.log("Offset: " + offset + "\nLength: " + length + "\ninStreamPos: " + that._inStreamPos + "\noutStreamPos: " + that._outStreamPos);
            
            if (outPos > 0) {
                // We have either copied all data from outBuffer, or we can throw those data away because they are before our required offset
                // This resets the outbuffer->ptr to 0, so we can re-use the outbuffer memory space without re-initializing
                // Below is the 'raw' way to do this for info, but the JS copy will be set in fillInBufferIfNeeded()
                // zd.HEAP32[obx32ptr + 2] = 0;
                that._outBuffer.pos = 0;
            }
            if (finished) {
                console.log("Read loop finished.");
                return that._outDataBuf;
            } else {
                return that._readLoop(offset, length);
            }
        });
    };
    
    /**
     * Fills in the instream buffer if needed
     * @param {Integer} currOffset The current read offset
     * @param {Integer} len The decompressed length of data requested
     * @returns {Promise<0>} A Promise for 0 when all data have been added to the stream
     */
    Decompressor.prototype._fillInBufferIfNeeded = function(currOffset, len) {
        if (this._inStreamPos + len < this._inStreamChunkedPos) {
            // We should still have enough data in the buffer (because decompressed len > compressed len)
            // DEV: When converting to Promise/A+, use Promise.resolve(0) here
            return Q.when(0);
        }
        var that = this;
        return this._reader(this._inStreamPos, this._chunkSize).then(function(data) {
            // Populate inBuffer and assign asm/wasm memory if not already assigned
            that._inBuffer.size = data.length;
            if (!that._inBuffer.src) {
                that._inBuffer.src = mallocOrDie(that._inBuffer.size);
            }
            // Re-use inBuffer
            that._inBuffer.pos = 0;
            var inBufferStruct = new Int32Array([that._inBuffer.src, that._inBuffer.size, that._inBuffer.pos]);
            // Write inBuffer structure to previously assigned w/asm memory
            zd.HEAP32.set(inBufferStruct, that._inBuffer.ptr >> 2);
            // Populate outBuffer (but re-use existing if it was already assinged)
            // DEV: because we're re-using the allocated memory (malloc), you cannot change the _outBuffer.size field locally
            // _outBuffer.size is the maximum amount the ZSTD codec is allowed to decode in one go
            // so if we need more data, we just copy those decoded bytes and reset _ouBuffer.pos to 0
            if (!that._outBuffer.dst) {
                that._outBuffer.dst = mallocOrDie(that._outBuffer.size);
            }
            var outBufferStruct = new Int32Array([that._outBuffer.dst, that._outBuffer.size, that._outBuffer.pos]);
            // Write outBuffer structure to w/asm memory
            zd.HEAP32.set(outBufferStruct, that._outBuffer.ptr >> 2);
            
            // Transfer the (new) data to be read to the inBuffer
            zd.HEAP8.set(data, that._inBuffer.src);
            that._inStreamChunkedPos += data.length;
            return 0;
        });
    };

    /**
     * Provision asm/wasm data block and get a pointer to the assigned location
     * @param {Number} sizeOfData The number of bytes to be allocated
     * @returns {Number} Pointer to the assigned data block
     */
    function mallocOrDie(sizeOfData) {
        const dataPointer = zd._malloc(sizeOfData);
        if (dataPointer === 0) { // error allocating memory
            var errorMessage = 'Failed allocation of ' + sizeOfData + ' bytes.';
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        return dataPointer;
    }

    return {
        Decompressor: Decompressor
    };
});
