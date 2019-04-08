import { Stream } from "xstream";
import { DMA } from "./mem";

export type RGBA = number[];
export type Change = {
    sx: number;
    sy: number;
    values: RGBA[][];
};
export interface VGA {
    readonly updates: Stream<Change>;
    readonly width: number;
    readonly height: number;
    get(x: number, y: number): RGBA;
}

const ONE = [255, 255, 255, 0];
const ZERO = [0, 0, 0, 0];
export class VGAHack implements VGA {
    public readonly updates: Stream<Change>;
    constructor(private video: DMA) {
        this.updates = video.subj.map(entry => {
            let x = (entry.address & 0x1F) << 4;
            let y = entry.address >> 4;
            let a: RGBA[] = [];
            for (let i = 0; i < 16; i++)
                a.push(entry.value >> i & 1 ? ONE : ZERO);
            return {
                sx: x,
                sy: y,
                values: [a]
            }
        });
    }
    get width() {
        return 512;
    }
    get height() {
        return 256;
    }
    get(x: number, y: number): RGBA {
        const address = (y << 5) + (x >> 4);
        const flag = 1 << (x & 15);
        const bitSet = this.video.get(address) & flag;
        return bitSet !== 0 ? ONE : ZERO;
    }
}