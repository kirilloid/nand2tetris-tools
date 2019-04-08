// jshint esversion: 6
const tape = require('tape');
const Compiler = require('../dist/asm/compiler').BinaryCompiler;

const compiler = new Compiler();

const N     = { A: false, D: false, M: false };
const D     = { A: false, D: true,  M: false };
const MD    = { A: false, D: true,  M: true  };
const M     = { A: false, D: false, M: true  };
const A     = { A: true,  D: false, M: false };
const a     = address => ({ type: 'A', address });

const check = (t, source, result, msg = '') => {
    result.type = 'C';
    t.deepEqual(compiler.compileLine(source.replace(/\s+/g, '')), result, source + ' ' + msg);
};

tape('A-commands', function (t) {
    t.deepEqual(compiler.compileLine('0000000000000000'), a(0), '@0');
    t.deepEqual(compiler.compileLine('0000001111101000'), a(1000), '@1000');
    t.end();
});
tape('C-commands', function (t) {
    check(t, '111 0 110000 000 000', { dest: N, op: 'A', jmp: 'JNO' }, 'base operation');
    tape('dest', function (t) {
        check(t, '111 0 110000 100 000', { dest: A, op: 'A', jmp: 'JNO' }, 'A');
        check(t, '111 0 110000 010 000', { dest: M, op: 'A', jmp: 'JNO' }, 'M');
        check(t, '111 0 110000 001 000', { dest: D, op: 'A', jmp: 'JNO' }, 'D');
        t.end();
    });
    tape('jumps', function (t) {
        check(t, '111 0 110000 000 100', { dest: N, op: 'A', jmp: 'JLT' }, 'JLT');
        check(t, '111 0 110000 000 010', { dest: N, op: 'A', jmp: 'JEQ' }, 'JEQ');
        check(t, '111 0 110000 000 001', { dest: N, op: 'A', jmp: 'JGT' }, 'JGT');
        check(t, '111 0 110000 000 111', { dest: N, op: 'A', jmp: 'JMP' }, 'JMP');
        t.end();
    });
    tape('commands', function (t) {
        check(t, '111 0 101010 000 000', { dest: N, op: '0',   jmp: 'JNO' }, '0');
        check(t, '111 0 111111 000 000', { dest: N, op: '1',   jmp: 'JNO' }, '1');
        check(t, '111 0 111010 000 000', { dest: N, op: '-1',  jmp: 'JNO' }, '-1');
        check(t, '111 0 001100 000 000', { dest: N, op: 'D',   jmp: 'JNO' }, 'D');
        check(t, '111 0 110000 000 000', { dest: N, op: 'A',   jmp: 'JNO' }, 'A');
        check(t, '111 0 001101 000 000', { dest: N, op: '!D',  jmp: 'JNO' }, '!D');
        check(t, '111 0 110001 000 000', { dest: N, op: '!A',  jmp: 'JNO' }, '!A');
        check(t, '111 0 001111 000 000', { dest: N, op: '-D',  jmp: 'JNO' }, '-D');
        check(t, '111 0 110011 000 000', { dest: N, op: '-A',  jmp: 'JNO' }, '-A');
        check(t, '111 0 011111 000 000', { dest: N, op: 'D+1', jmp: 'JNO' }, 'D+1');
        check(t, '111 0 110111 000 000', { dest: N, op: 'A+1', jmp: 'JNO' }, 'A+1');
        check(t, '111 0 001110 000 000', { dest: N, op: 'D-1', jmp: 'JNO' }, 'D-1');
        check(t, '111 0 110010 000 000', { dest: N, op: 'A-1', jmp: 'JNO' }, 'A-1');
        check(t, '111 0 000010 000 000', { dest: N, op: 'D+A', jmp: 'JNO' }, 'D+A');
        check(t, '111 0 010011 000 000', { dest: N, op: 'D-A', jmp: 'JNO' }, 'D-A');
        check(t, '111 0 000111 000 000', { dest: N, op: 'A-D', jmp: 'JNO' }, 'A-D');
        check(t, '111 0 000000 000 000', { dest: N, op: 'D&A', jmp: 'JNO' }, 'D&A');
        check(t, '111 0 010101 000 000', { dest: N, op: 'D|A', jmp: 'JNO' }, 'D|A');

        check(t, '111 1 101010 000 000', { dest: N, op: '0',   jmp: 'JNO' }, '0');
        check(t, '111 1 111111 000 000', { dest: N, op: '1',   jmp: 'JNO' }, '1');
        check(t, '111 1 111010 000 000', { dest: N, op: '-1',  jmp: 'JNO' }, '-1');
        check(t, '111 1 001100 000 000', { dest: N, op: 'D',   jmp: 'JNO' }, 'D');
        check(t, '111 1 110000 000 000', { dest: N, op: 'M',   jmp: 'JNO' }, 'M');
        check(t, '111 1 001101 000 000', { dest: N, op: '!D',  jmp: 'JNO' }, '!D');
        check(t, '111 1 110001 000 000', { dest: N, op: '!M',  jmp: 'JNO' }, '!M');
        check(t, '111 1 001111 000 000', { dest: N, op: '-D',  jmp: 'JNO' }, '-D');
        check(t, '111 1 110011 000 000', { dest: N, op: '-M',  jmp: 'JNO' }, '-M');
        check(t, '111 1 011111 000 000', { dest: N, op: 'D+1', jmp: 'JNO' }, 'D+1');
        check(t, '111 1 110111 000 000', { dest: N, op: 'M+1', jmp: 'JNO' }, 'M+1');
        check(t, '111 1 001110 000 000', { dest: N, op: 'D-1', jmp: 'JNO' }, 'D-1');
        check(t, '111 1 110010 000 000', { dest: N, op: 'M-1', jmp: 'JNO' }, 'M-1');
        check(t, '111 1 000010 000 000', { dest: N, op: 'D+M', jmp: 'JNO' }, 'D+M');
        check(t, '111 1 010011 000 000', { dest: N, op: 'D-M', jmp: 'JNO' }, 'D-M');
        check(t, '111 1 000111 000 000', { dest: N, op: 'M-D', jmp: 'JNO' }, 'M-D');
        check(t, '111 1 000000 000 000', { dest: N, op: 'D&M', jmp: 'JNO' }, 'D&M');
        check(t, '111 1 010101 000 000', { dest: N, op: 'D|M', jmp: 'JNO' }, 'D|M');
        t.end();
    });
    t.end();
});