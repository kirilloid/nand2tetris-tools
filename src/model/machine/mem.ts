import { Stream } from 'xstream';

type MemChangeEvent = {
    address: number;
    value: number;
}
type MemChangeListener = (change: MemChangeEvent) => void;
type DmaListener = {
    from: number;
    to: number;
    listener: MemChangeListener
};

type MemSnapshot = Int16Array;

export class DMA {
    constructor(
        private data: Int16Array,
        public readonly subj: Stream<MemChangeEvent>
    ) {}
    public on(listener: MemChangeListener) {
        this.subj.subscribe({
            next: listener,
            complete() {},
            error() {}
        });
    }
    public set(address: number, value: number): void {
        this.data[address] = value;
        //this.subj.shamefullySendNext({ address, value });
    }
    public get(address: number): number {
        return this.data[address];
    }
}

export class Memory {
    private subj: Stream<MemChangeEvent>;
    constructor(private data: Int16Array) {
        this.subj = new Stream<MemChangeEvent>();
    }

    // API for subclasses
    public set(address: number, value: number): void {
        this.data[address] = value;
        this.subj.shamefullySendNext({ address, value });
    }
    public get(address: number): number {
        return this.data[address];
    }
    public reset(): void {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 0;
        }
    }
    public dma(from: number, to: number): DMA {
        const range = new Int16Array(this.data.buffer, from*2, (from - to)*2);
        const updates = this.subj
            .filter((entry: MemChangeEvent) =>
                entry.address >= from &&
                entry.address < to)
            .map((entry: MemChangeEvent) => ({
                address: entry.address - from,
                value: entry.value
            }));
        return new DMA(range, updates);
    }
}
