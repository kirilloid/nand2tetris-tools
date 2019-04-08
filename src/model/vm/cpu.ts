import { Memory } from '../machine/mem';
import { CPU as ICPU } from '../machine/cpu';
import { VMCommand, Operation, Segment } from './command';

const not = (v: number) => ~v & 0xFFFF;

type FunctionEntry = {
    locals: number;
    pc: number;
};

const fromBoolean = (value: boolean) => value ? 0 : 0x8000;

export default class CPU implements ICPU<VMCommand> {
    private PC: number;

    private SP: number;
    private LCL: number;
    private ARG: number;
    private THIS: number;
    private THAT: number;

    private code: VMCommand[];
    constructor(private mem: Memory) {
        ['SP', 'LCL', 'ARG', 'THIS', 'THAT'].forEach((label, i) =>
            Object.defineProperty(this, label, {
                get(this: CPU): number {
                    return this.mem.get(i);
                },
                set(this: CPU, value: number) {
                    this.mem.set(i, value);
                }
            }));
    }
    public load(code: VMCommand[]): void {
        this.code = code;
        this.PC = 0;
    }
    public reset(): void {
        this.PC = 0;
    }
    public step(): void {
        this.exec(this.code[this.PC++]);
    }
    public getPC(): number {
        return this.PC;
    }
    private _getPtr (segment: Segment): number {
        switch (segment) {
        case 'temp': return 6;
        case 'static': return 16;
        case 'pointer': return 2;
        case 'local': return this.LCL;
        case 'argument': return this.ARG;
        case 'this': return this.THIS;
        case 'that': return this.THAT;
        case 'constant': return 0;
        default: let tmp: never = segment;
        }
        return -1;
    }
    private _push(value: number): void {
        this.mem.set(this.SP++, value);
    }
    private _pop(): number {
        return this.mem.get(--this.SP);
    }
    private exec(cmd: VMCommand): void {
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
            let tmp: never = cmd;
        }
    }
    private push (segment: Segment, number: number) {
        const offset = this._getPtr(segment) + number;
        this._push(this.mem.get(offset));
    }
    private pop (segment: Segment, number: number): void {
        const offset = this._getPtr(segment) + number;
        this.mem.set(offset, this._pop());
    }
    private operation (type: Operation): void {
        switch (type) {
        case 'add': this._push(this._pop() + this._pop()); break;
        case 'sub': this._push(this._pop() - this._pop()); break;
        case 'neg': this._push(-this._pop()); break;
        case 'gt':  this._push(fromBoolean(this._pop() > this._pop())); break;
        case 'lt':  this._push(fromBoolean(this._pop() < this._pop())); break;
        case 'eq':  this._push(fromBoolean(this._pop() == this._pop())); break;
        case 'or':  this._push(this._pop() | this._pop()); break;
        case 'and': this._push(this._pop() & this._pop()); break;
        case 'not': this._push(not(this._pop())); break;
        default: let tmp: never = type;
        }
    }
    private goto (address: number, conditional: boolean): void {
        if (conditional) {
            if (this._pop() !== 0) {
                this.PC = address;
            }
        } else {
            this.PC = address;
        }
    }
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
    private call (address: number, args: number): void {
        this._push(this.PC);
        this._push(this.LCL);
        this._push(this.ARG);
        this._push(this.THIS);
        this._push(this.THAT);
        this.ARG = this.SP - args - 5;
        this.LCL = this.SP;
        // goto
        while (--args) this._push(0);
        this.PC = address;
    }
    private return (): void {
        const arg = this.ARG;
        this.SP   = this.LCL;
        this.THAT = this._pop();
        this.THIS = this._pop();
        this.ARG  = this._pop();
        this.LCL  = this._pop();
        this.PC   = this._pop();
        this.SP   = arg;
    }
}