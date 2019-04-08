import { Memory } from '../machine/mem';
import { SymbolicCompiler } from './compiler';
import { CPUCommand } from './command';
import { CPU as ICPU } from '../machine/cpu';

const orA = (c: CPUState) => c.D | c.A;
const orM = (c: CPUState) => c.D | c.M;
const andA = (c: CPUState) => c.D & c.A;
const andM = (c: CPUState) => c.D & c.M;
const plusA = (c: CPUState) => c.D + c.A;
const plusM = (c: CPUState) => c.D + c.M;
const plusD1 = (c: CPUState) => c.D + 1;
const not = (v: number) => ~v & 0xFFFF;

var cCommandTable: {[key: string]: (state: CPUState) => number} = {
    'D&A': andA, 'A&D': andA,
    'D&M': andM, 'A&M': andM,
      'D': c => c.D,
     '-D': c => -c.D,
     '!D': c => not(c.D),
    'A-D': c => c.A - c.D,
    'A-M': c => c.M - c.D,
    'D+1': plusD1,
    '1+D': plusD1,
    'D-1': c => c.D - 1,
    'D+A': plusA, 'A+D': plusA,
    'D+M': plusM, 'M+D': plusM,
    'D-A': c => c.D - c.A,
    'D|A': orA, 'A|D': orA,
    'D|M': orM, 'M|D': orM,
      '0': c => 0,
      '1': c => 1,
     '-1': c => -1,
      'A': c => c.A,
      'M': c => c.M,
     '!A': c => not(c.A),
     '!M': c => not(c.M),
     '-A': c => -c.A,
     '-M': c => -c.M,
    'A+1': c => c.A + 1,
    'M+1': c => c.M + 1,
    'A-1': c => c.A - 1,
    'M-1': c => c.M - 1,
};

var jCommandTable: {[key: string]: (value: number) => boolean} = {
    JNO: a => false,
    JGT: a => a >  0,
    JEQ: a => a == 0,
    JGE: a => a >= 0,
    JLT: a => a <  0,
    JNE: a => a != 0,
    JLE: a => a <= 0,
    JMP: a => true,
};

interface CPUState {
    A: number;
    D: number;
    M: number;
}

export default class CPU implements CPUState, ICPU<CPUCommand> {
    private address: number;
    private dataRegister: number;
    private PC: number;
    private code: CPUCommand[];
    constructor(private mem: Memory) {
        this.address = 0;
        this.dataRegister = 0;
    }
    public load(code: CPUCommand[]) {
        this.PC = 0;
        this.code = code; // this.compiler.compile(code);
    }
    public reset(): void {
        this.PC = 0;
    }
    public getPC(): number {
        return this.PC;
    }
    set M (value: number) {
        this.mem.set(this.address, value);
    }
    get M (): number {
        return this.mem.get(this.address);
    }
    set D (value: number) {
        this.dataRegister = value;
    }
    get D (): number {
        return this.dataRegister;
    }
    set A (value: number) {
        this.address = value;
    }
    get A (): number {
        return this.address;
    }
    public step(): void {
        this.exec(this.code[this.PC]);
    }
    private exec(cmd: CPUCommand): void {
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
        if (cmd.dest.M) this.M = result;
        if (cmd.dest.D) this.D = result;
        if (cmd.dest.A) this.A = result;
        this.PC++;
    }
}