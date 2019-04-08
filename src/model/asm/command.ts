export type CPUCommand = ACommand | CCommand
export type ACommand = {
    type: 'A';
    address: number;
};
export type CCommand = {
    type: 'C';
    dest: {
        A: boolean;
        D: boolean;
        M: boolean;
    };
    op: string;
    jmp: string;
};
