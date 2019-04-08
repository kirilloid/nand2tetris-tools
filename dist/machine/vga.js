"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ONE = [255, 255, 255, 0];
var ZERO = [0, 0, 0, 0];
var VGAHack = (function () {
    function VGAHack(video) {
        this.video = video;
        this.updates = video.subj.map(function (entry) {
            var x = (entry.address & 0x1F) << 4;
            var y = entry.address >> 4;
            var a = [];
            for (var i = 0; i < 16; i++)
                a.push(entry.value >> i & 1 ? ONE : ZERO);
            return {
                sx: x,
                sy: y,
                values: [a]
            };
        });
    }
    Object.defineProperty(VGAHack.prototype, "width", {
        get: function () {
            return 512;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VGAHack.prototype, "height", {
        get: function () {
            return 256;
        },
        enumerable: true,
        configurable: true
    });
    VGAHack.prototype.get = function (x, y) {
        var address = (y << 5) + (x >> 4);
        var flag = 1 << (x & 15);
        var bitSet = this.video.get(address) & flag;
        return bitSet !== 0 ? ONE : ZERO;
    };
    return VGAHack;
}());
exports.VGAHack = VGAHack;
