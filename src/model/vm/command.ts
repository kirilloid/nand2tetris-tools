export type Segment = 'constant' | 'temp' | 'static' | 'pointer' | 'local' | 'argument' | 'this' | 'that';

export type VMCommand = {
    type: 'push';
    segment: Segment;
    value: number;
} | {
    type: 'pop';
    segment: Segment;
    value: number;    
} | {
    type: 'op';
    op: Operation;
} | {
    type: 'goto';
    address: number;
    if: boolean;
} | {
    type: 'call';
    address: number;
    args: number;
} | {
    type: 'return';
};

export type Operation = 'add' | 'sub' | 'neg' | 'gt' | 'lt' | 'eq' | 'or' | 'and' | 'not';
