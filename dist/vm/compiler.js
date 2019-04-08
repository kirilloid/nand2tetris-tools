"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Compiler = (function () {
    function Compiler() {
    }
    Compiler.prototype.compile = function (source) {
        var _this = this;
        this.functionTable = {};
        this.labelTable = {};
        var codeLines = [];
        source.split('\n').forEach(function (line) {
            var code = line.replace(/\/\/.*$/, '').trim();
            var _a = code.split(' '), command = _a[0], name = _a[1], numValue = _a[2];
            switch (command) {
                case undefined:
                    return;
                case 'function':
                    _this.functionTable[name] = {
                        args: +numValue,
                        address: codeLines.length
                    };
                    break;
                case 'label':
                    _this.labelTable[name] = codeLines.length;
                    break;
                default:
                    codeLines.push(code);
                    break;
            }
        });
        var outCode = [];
        //var sourceMap = [];
        return codeLines.map(this.compileLine, this);
    };
    Compiler.prototype.compileLine = function (line) {
        var _a = line.split(' '), command = _a[0], name = _a[1], n = _a[2];
        switch (command) {
            case 'push':
                return {
                    type: 'push',
                    segment: name,
                    value: +n
                };
            case 'pop':
                return {
                    type: 'push',
                    segment: name,
                    value: +n
                };
            case 'add':
            case 'sub':
            case 'neg':
            case 'gt':
            case 'lt':
            case 'eq':
            case 'or':
            case 'and':
            case 'not':
                return {
                    type: 'op',
                    op: command
                };
            case 'goto':
            case 'if-goto':
                return {
                    type: 'goto',
                    address: this.labelTable[name],
                    if: command === 'if-goto'
                };
            case 'call':
                return {
                    type: 'call',
                    address: this.functionTable[name].address,
                    args: this.functionTable[name].args
                };
            case 'return':
                return {
                    type: 'return'
                };
            default:
                throw new Error("Unparsable line `" + line + "`");
        }
    };
    return Compiler;
}());
exports.Compiler = Compiler;
