import { VGA } from './vga';
import { DebugData } from '../asm/compiler';

export interface Machine {
    display: VGA;
    load(code: string[]): void;
    reset(): void;
    step(): void;
    keyboard(key: number): void;
    getPC(): number;
    getMemory(): MemoryView;
    getDebugData(): DebugData;
}

export type MemCell = {
    label: string;
    address: number;
    value: number;
    junk: boolean;
}

export interface MemoryView {
    get(address: number): MemCell;
    getAll(): MemCell[];
}

