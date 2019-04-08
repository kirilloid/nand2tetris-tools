"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var commands = [
    'D&A', , 'D+A', , , , , 'A-D', , , , , 'D', '!D', 'D-1', '-D', , , , 'D-A', , 'D|A', , , , , , , , , , 'D+1', , , , , , , , , , , '0', , , , , , 'A', '!A', 'A-1', '-A', , , , 'A+1', , , '-1', , , , , '1',
    'D&M', , 'D+M', , , , , 'M-D', , , , , 'D', '!D', 'D-1', '-D', , , , 'D-M', , 'D|M', , , , , , , , , , 'D+1', , , , , , , , , , , '0', , , , , , 'M', '!M', 'M-1', '-M', , , , 'M+1', , , '-1', , , , , '1',
];
var SymbolicCompiler = (function () {
    function SymbolicCompiler() {
    }
    SymbolicCompiler.prototype.compile = function (source) {
        var _this = this;
        this.labelTable = {};
        this.variableTable = {
            SP: 0,
            LCL: 1,
            ARG: 2,
            THIS: 3,
            THAT: 4
        };
        for (var i = 0; i < 16; i++) {
            this.variableTable['R' + i] = i;
        }
        this.variableMem = 16;
        var codeLines = [];
        source.split('\n').forEach(function (line) {
            var code = line.replace(/\/\/.*$/, '').trim();
            var m = line.match(/\((.*)\)/);
            if (m !== null) {
                _this.labelTable[m[1]] = {
                    type: 'A',
                    address: codeLines.length
                };
            }
            else {
                if (code !== '') {
                    codeLines.push(code);
                }
            }
        });
        var outCode = [];
        //var sourceMap = [];
        codeLines.forEach(function (line) {
            outCode.push(_this.compileLine(line));
            //sourceMap.push(line);
        });
        return outCode;
    };
    SymbolicCompiler.prototype.compileLine = function (line) {
        if (line[0] === '@') {
            return this.compileLabel(line.slice(1));
        }
        var match = line
            .replace(/\s+/g, '')
            .match(/^(?:([AMD]+)=)?(.+?)(?:;(J..))?$/);
        if (match === null) {
            return {
                type: 'A',
                address: -1
            };
        }
        var dest = match[1], expr = match[2], jmp = match[3];
        return {
            type: 'C',
            dest: {
                A: dest !== undefined && dest.indexOf('A') !== -1,
                M: dest !== undefined && dest.indexOf('M') !== -1,
                D: dest !== undefined && dest.indexOf('D') !== -1
            },
            op: expr,
            jmp: jmp || 'JNO'
        };
    };
    SymbolicCompiler.prototype.compileLabel = function (label) {
        var address = +label;
        if (!isNaN(address)) {
            return {
                type: 'A',
                address: address
            };
        }
        if (this.labelTable[label]) {
            return this.labelTable[label];
        }
        if (!this.variableTable[label]) {
            this.variableTable[label] = this.variableMem++;
        }
        return {
            type: 'A',
            address: this.variableTable[label]
        };
    };
    return SymbolicCompiler;
}());
exports.SymbolicCompiler = SymbolicCompiler;
var BinaryCompiler = (function () {
    function BinaryCompiler() {
    }
    BinaryCompiler.prototype.compile = function (source) {
        return source.split('\n').map(this.compileLine, this);
    };
    BinaryCompiler.prototype.compileLine = function (line) {
        if (line[0] === '0') {
            return {
                type: 'A',
                address: parseInt(line.slice(1), 2)
            };
        }
        var code = parseInt(line, 2);
        // 111a cccc ccdd djjj
        return {
            type: 'C',
            dest: {
                D: (code & 0x08) !== 0,
                M: (code & 0x10) !== 0,
                A: (code & 0x20) !== 0,
            },
            op: commands[(code >> 6) & 0x7F] || '0',
            jmp: ['JNO', 'JGT', 'JEQ', 'JGE', 'JLT', 'JNE', 'JLE', 'JMP'][code & 7]
        };
    };
    return BinaryCompiler;
}());
exports.BinaryCompiler = BinaryCompiler;
