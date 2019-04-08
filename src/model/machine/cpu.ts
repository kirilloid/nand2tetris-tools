import { Memory } from './mem';

export interface CPU<Command> {
    reset(): void;
    step(): void;
    getPC(): number;
    load(code: Command[]): void;
}