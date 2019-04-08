"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var not = function (v) { return ~v & 0xFFFF; };
var fromBoolean = function (value) { return value ? 0 : 0x8000; };
var CPU = (function () {
    function CPU() {
        var _this = this;
        ['SP', 'LCL', 'ARG', 'THIS', 'THAT'].forEach(function (label, i) {
            return Object.defineProperty(_this, label, {
                get: function () {
                    return this.mem.get(i);
                },
                set: function (value) {
                    this.mem.set(i, value);
                }
            });
        });
    }
    CPU.prototype.load = function (code) {
        this.code = code;
    };
    CPU.prototype._getPtr = function (segment) {
        switch (segment) {
            case 'temp': return 6;
            case 'static': return 16;
            case 'pointer': return 2;
            case 'local': return this.LCL;
            case 'argument': return this.ARG;
            case 'this': return this.THIS;
            case 'that': return this.THAT;
            case 'constant': return 0;
            default: var tmp = segment;
        }
        return -1;
    };
    CPU.prototype._push = function (value) {
        this.mem.set(this.SP++, value);
    };
    CPU.prototype._pop = function () {
        return this.mem.get(--this.SP);
    };
    CPU.prototype.step = function () {
        this.exec(this.code[this.PC++]);
    };
    CPU.prototype.exec = function (cmd) {
        switch (cmd.type) {
            case 'push':
                this.push(cmd.segment, cmd.value);
                break;
            case 'pop':
                this.pop(cmd.segment, cmd.value);
                break;
            case 'op':
                this.operation(cmd.op);
                break;
            case 'goto':
                this.goto(cmd.address, cmd.if);
                break;
            case 'call':
                this.call(cmd.address, cmd.args);
                break;
            case 'return':
                this.return();
                break;
            default:
                var tmp = cmd;
        }
    };
    CPU.prototype.push = function (segment, number) {
        var offset = this._getPtr(segment) + number;
        this._push(this.mem.get(offset));
    };
    CPU.prototype.pop = function (segment, number) {
        var offset = this._getPtr(segment) + number;
        this.mem.set(offset, this._pop());
    };
    CPU.prototype.operation = function (type) {
        switch (type) {
            case 'add':
                this._push(this._pop() + this._pop());
                break;
            case 'sub':
                this._push(this._pop() - this._pop());
                break;
            case 'neg':
                this._push(-this._pop());
                break;
            case 'gt':
                this._push(fromBoolean(this._pop() > this._pop()));
                break;
            case 'lt':
                this._push(fromBoolean(this._pop() < this._pop()));
                break;
            case 'eq':
                this._push(fromBoolean(this._pop() == this._pop()));
                break;
            case 'or':
                this._push(this._pop() | this._pop());
                break;
            case 'and':
                this._push(this._pop() & this._pop());
                break;
            case 'not':
                this._push(not(this._pop()));
                break;
            default: var tmp = type;
        }
    };
    CPU.prototype.goto = function (address, conditional) {
        if (conditional) {
            if (this._pop() !== 0) {
                this.PC = address;
            }
        }
        else {
            this.PC = address;
        }
    };
    /* stack frame
    ARG | arg 0
        | arg 1
        | ...
        | arg N
        +--------------
        | saved returnAddress
        | saved LCL
        | saved ARG
        | saved THIS
        | saved THAT
        +--------------
    LCL | local 0
        | local 1
        | ...
        | local N
        +--------------
    SP  |
    */
    CPU.prototype.call = function (address, args) {
        this._push(this.PC);
        this._push(this.LCL);
        this._push(this.ARG);
        this._push(this.THIS);
        this._push(this.THAT);
        this.ARG = this.SP - args - 5;
        this.LCL = this.SP;
        // goto
        while (--args)
            this._push(0);
        this.PC = address;
    };
    CPU.prototype.return = function () {
        var arg = this.ARG;
        this.SP = this.LCL;
        this.THAT = this._pop();
        this.THIS = this._pop();
        this.ARG = this._pop();
        this.LCL = this._pop();
        this.PC = this._pop();
        this.SP = arg;
    };
    return CPU;
}());
exports.default = CPU;
