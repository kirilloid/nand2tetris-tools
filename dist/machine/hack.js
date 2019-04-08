"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mem_1 = require("./mem");
var vga_1 = require("./vga");
var mem = new mem_1.Memory(new Int16Array(32768));
var display = new vga_1.VGAHack(mem.dma(16384, 24576));
var keyboard = mem.dma(24576, 24577);
