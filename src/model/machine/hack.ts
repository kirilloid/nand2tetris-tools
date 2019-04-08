import { Memory, DMA } from "./mem";
import { CPU } from "./cpu";
import { SymbolicCompiler, DebugData } from "../asm/compiler";
import AsmCPU from "../asm/cpu";
import { CPUCommand } from "../asm/command";
import { Machine, MemoryView, MemCell } from "./machine";
import { VGAHack, VGA } from "./vga";

const mem = new Memory(new Int16Array(32768));
const display = new VGAHack(mem.dma(16384, 24576));
const keyboard = mem.dma(24576, 24577);

export class Hack implements Machine {
    private SIZE: number = 32768;
    private cpu: CPU<CPUCommand>;
    private mem: Memory;
    private values: MemCell[];
    private memoryView: MemoryView;
    private compiler: SymbolicCompiler;
    private debugData: DebugData;
    public readonly display: VGA;
    constructor(
    ) {
        this.mem = new Memory(new Int16Array(this.SIZE));
        this.initMemoryView();
        this.cpu = new AsmCPU(mem);
        this.display = new VGAHack(this.mem.dma(16384, 24576));
        this.compiler = new SymbolicCompiler();
    }
    private initMemoryView() {
        this.values = new Array<MemCell>(this.SIZE);
        this.resetMemory();
        this.mem.dma(0, this.SIZE).on(({ address, value }) => {
            this.values[address].value = value;
        });
        this.memoryView = {
            get: (address: number): MemCell => {
                return this.values[address];
            },
            getAll: (): MemCell[] => {
                return this.values;
            }
        };
    }
    private resetMemory() {
        const { memorySymbols } = this.compiler.getDebugData();
        for (let i = 0; i < this.SIZE; i++) {
            this.values[i] = {
                label: memorySymbols[i] || '',
                address: i,
                value: 0,
                junk: true
            };
        }
    }

    public reset(): void {
        this.cpu.reset();
    }
    public step(): void {
        this.cpu.step();
    }
    public getPC(): number {
        return this.cpu.getPC();
    }
    public keyboard(code: number) {
        this.mem.set(24576, code);
    }
    public getMemory(): MemoryView {
        return this.memoryView;
    }
    public load(code: string[]): void {
        const commands = this.compiler.compile(code);
        this.cpu.load(commands);
    }
    public getDebugData() {
        return this.compiler.getDebugData();
    }
};
export { Machine } from "./machine";