// jshint esversion: 6
const tape = require('tape');
const Compiler = require('../dist/asm/compiler').SymbolicCompiler;

const compiler = new Compiler();

const N     = { A: false, D: false, M: false };
const D     = { A: false, D: true,  M: false };
const MD    = { A: false, D: true,  M: true  };
const M     = { A: false, D: false, M: true  };
const A     = { A: true,  D: false, M: false };
const a     = address => ({ type: 'A', address });

const check = (t, source, result, msg = '') => {
    result.type = 'C';
    t.deepEqual(compiler.compileLine(source), result, source + ' ' + msg);
};

tape('A-commands', function (t) {
    t.deepEqual(compiler.compileLine('@0'), a(0));
    t.deepEqual(compiler.compileLine('@1000'), a(1000));
    t.end();
});
tape('labels', function (t) {
    t.deepEqual(compiler.compile('@i'), [a(16)], 'basic variable');
                         // +----------------------+
    t.deepEqual(         // |       ^------v       v
        compiler.compile(['(L1)', '@L2', '(L2)', '@L1'].join('\n')),
                         [         a(1),          a(0)],
        'out-of-order'
    );
    t.deepEqual(         // ^-----------------v
        compiler.compile(['@a', '@b', '@0', '(a)', '@1'].join('\n')),
                         [a(3), a(16), a(0),       a(1)],
        'both vars & labels'
    );
    t.end();
});
tape('C-commands', function (t) {
    check(t, 'M',       { dest: N,  op: 'M',    jmp: 'JNO' }, 'bare expression');
    check(t, 'D;JMP',   { dest: N,  op: 'D',    jmp: 'JMP' }, '- w/jump');
    check(t, 'MD=A',    { dest: MD, op: 'A',    jmp: 'JNO' }, 'multiple destination');
    check(t, 'DM=A',    { dest: MD, op: 'A',    jmp: 'JNO' }, '- order doesn\'t matter');
    check(t, 'D=A;JNE', { dest: D,  op: 'A',    jmp: 'JNE' }, 'full w/jump');
    check(t, 'D=A+1',   { dest: D,  op: 'A+1',  jmp: 'JNO' }, 'expression');
    check(t, 'A=D-A',   { dest: A,  op: 'D-A',  jmp: 'JNO' });
    check(t, 'A=A-D',   { dest: A,  op: 'A-D',  jmp: 'JNO' });
    t.end();
});

tape('integration', function (t) {
    t.test('add', function (t) {
        t.deepEqual(compiler.compile(`
            @2\n   D=A
            @3\n   D=D+A
            @0\n   M=D
        `), [
            //             AMD<=>
            //   111accccccdddjjj
            a(2), { type: 'C', dest: D, op: 'A',   jmp: 'JNO' },
            a(3), { type: 'C', dest: D, op: 'D+A', jmp: 'JNO' },
            a(0), { type: 'C', dest: M, op: 'D',   jmp: 'JNO' }
        ]);
        t.end();
    });
    t.end();
});
