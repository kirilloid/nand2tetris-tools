"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var orA = function (c) { return c.D | c.A; };
var orM = function (c) { return c.D | c.M; };
var andA = function (c) { return c.D & c.A; };
var andM = function (c) { return c.D & c.M; };
var plusA = function (c) { return c.D + c.A; };
var plusM = function (c) { return c.D + c.M; };
var plusD1 = function (c) { return c.D + 1; };
var not = function (v) { return ~v & 0xFFFF; };
var cCommandTable = {
    'D&A': andA, 'A&D': andA,
    'D&M': andM, 'A&M': andM,
    'D': function (c) { return c.D; },
    '-D': function (c) { return -c.D; },
    '!D': function (c) { return not(c.D); },
    'A-D': function (c) { return c.A - c.D; },
    'A-M': function (c) { return c.M - c.D; },
    'D+1': plusD1,
    '1+D': plusD1,
    'D-1': function (c) { return c.D - 1; },
    'D+A': plusA, 'A+D': plusA,
    'D+M': plusM, 'M+D': plusM,
    'D-A': function (c) { return c.D - c.A; },
    'D|A': orA, 'A|D': orA,
    'D|M': orM, 'M|D': orM,
    '0': function (c) { return 0; },
    '1': function (c) { return 1; },
    '-1': function (c) { return -1; },
    'A': function (c) { return c.A; },
    'M': function (c) { return c.M; },
    '!A': function (c) { return not(c.A); },
    '!M': function (c) { return not(c.M); },
    '-A': function (c) { return -c.A; },
    '-M': function (c) { return -c.M; },
    'A+1': function (c) { return c.A + 1; },
    'M+1': function (c) { return c.M + 1; },
    'A-1': function (c) { return c.A - 1; },
    'M-1': function (c) { return c.M - 1; },
};
var jCommandTable = {
    JNO: function (a) { return false; },
    JGT: function (a) { return a > 0; },
    JEQ: function (a) { return a == 0; },
    JGE: function (a) { return a >= 0; },
    JLT: function (a) { return a < 0; },
    JNE: function (a) { return a != 0; },
    JLE: function (a) { return a <= 0; },
    JMP: function (a) { return true; },
};
var CPU = (function () {
    function CPU() {
        this.address = 0;
        this.dataRegister = 0;
    }
    CPU.prototype.load = function (code) {
        this.PC = 0;
        this.code = code; // this.compiler.compile(code);
    };
    Object.defineProperty(CPU.prototype, "M", {
        get: function () {
            return this.mem.get(this.address);
        },
        set: function (value) {
            this.mem.set(this.address, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CPU.prototype, "D", {
        get: function () {
            return this.dataRegister;
        },
        set: function (value) {
            this.dataRegister = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CPU.prototype, "A", {
        get: function () {
            return this.address;
        },
        set: function (value) {
            this.address = value;
        },
        enumerable: true,
        configurable: true
    });
    CPU.prototype.step = function () {
        this.exec(this.code[this.PC]);
    };
    CPU.prototype.exec = function (cmd) {
        // A-command
        if (cmd.type === 'A') {
            this.A = cmd.address;
            return;
        }
        // C-command
        var result = cCommandTable[cmd.op](this);
        if (jCommandTable[cmd.jmp](result)) {
            this.PC = this.A - 1;
        }
        if (cmd.dest.M)
            this.M = result;
        if (cmd.dest.D)
            this.D = result;
        if (cmd.dest.A)
            this.A = result;
        this.PC++;
    };
    return CPU;
}());
exports.default = CPU;
