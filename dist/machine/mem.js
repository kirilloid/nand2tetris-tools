"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var DMA = (function () {
    function DMA(data, subj) {
        this.data = data;
        this.subj = subj;
    }
    DMA.prototype.set = function (address, value) {
        this.data[address] = value;
        //this.subj.shamefullySendNext({ address, value });
    };
    DMA.prototype.get = function (address) {
        return this.data[address];
    };
    return DMA;
}());
exports.DMA = DMA;
var Memory = (function () {
    function Memory(data) {
        this.data = data;
        this.subj = new xstream_1.Stream();
    }
    // API for subclasses
    Memory.prototype.set = function (address, value) {
        this.data[address] = value;
        this.subj.shamefullySendNext({ address: address, value: value });
    };
    Memory.prototype.get = function (address) {
        return this.data[address];
    };
    Memory.prototype.reset = function () {
        for (var i = 0; i < this.data.length; i++) {
            this.data[i] = 0;
        }
    };
    Memory.prototype.dma = function (from, to) {
        var range = new Int16Array(this.data.buffer, from * 2, (from - to) * 2);
        var updates = this.subj
            .filter(function (entry) {
            return entry.address >= from &&
                entry.address < to;
        })
            .map(function (entry) { return ({
            address: entry.address - from,
            value: entry.value
        }); });
        return new DMA(range, updates);
    };
    return Memory;
}());
exports.Memory = Memory;
