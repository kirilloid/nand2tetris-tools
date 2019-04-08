import { CPUCommand, ACommand, CCommand } from "./command";

const commands: (string|undefined)[] = [
    'D&A',,'D+A',,,,,'A-D',,,,,'D','!D','D-1','-D',,,,'D-A',,'D|A',,,,,,,,,,'D+1',,,,,,,,,,,'0',,,,,,'A','!A','A-1','-A',,,,'A+1',,,'-1',,,,,'1',
    'D&M',,'D+M',,,,,'M-D',,,,,'D','!D','D-1','-D',,,,'D-M',,'D|M',,,,,,,,,,'D+1',,,,,,,,,,,'0',,,,,,'M','!M','M-1','-M',,,,'M+1',,,'-1',,,,,'1',
];

type Symbols = {[key: number]: string};
type SourceLine = {
    index: number;
    line: string;
};

export type DebugData = {
    syntaxErrorLine: number;
    sourceCode: string[];
    sourceMaps: {[key:number]: number};
    memorySymbols: Symbols;
}

export class SymbolicCompiler {
    private labelTable: {[key: string]: ACommand};
    private variableTable: {[key: string]: number};
    private variableMem: number;
    private debugData: DebugData;
    compile(code: string[]): CPUCommand[] {
        this.debugData = {
            syntaxErrorLine: -1,
            sourceCode: code,
            sourceMaps: {},
            memorySymbols: {}
        };
        this.labelTable = {};
        this.variableTable = {
            SP: 0,
            LCL: 1,
            ARG: 2,
            THIS: 3,
            THAT: 4
        };
        for (let i = 0; i < 16; i++) {
            this.variableTable['R' + i] = i;
        }
        this.variableMem = 16;
        const codeLines: SourceLine[] = [];
        code.forEach((line, index) => {
            const cleanLine = line.replace(/\/\/.*$/, '').trim();
            const m = line.match(/\((.*)\)/);
            if (m !== null) {
                this.labelTable[m[1]] = {
                    type: 'A',
                    address: codeLines.length
                };
            } else {
                if (cleanLine !== '') {
                    codeLines.push({ index, line: cleanLine });
                }
            }
        });
        const outCode: CPUCommand[] = [];
        let sourceLine = -1;
        try {
            codeLines.forEach((source, idx) => {
                sourceLine = source.index;
                this.debugData.sourceMaps[idx] = source.index;
                outCode.push(this.compileLine(source.line));
            });
        } catch(e) {
            this.debugData.syntaxErrorLine = sourceLine;
        }
        Object.keys(this.variableTable).forEach(name => {
            this.debugData.memorySymbols[this.variableTable[name]] = name;
        });
        return outCode;
    }
    public getDebugData(): DebugData {
        return this.debugData;
    }
    private compileLine(line: string): CPUCommand {
        if (line[0] === '@') {
            return this.compileLabel(line.slice(1));
        }
        const match = line
            .replace(/\s+/g, '')
            .match(/^(?:([AMD]+)=)?(.+?)(?:;(J..))?$/);
        if (match === null) {
            throw new Error(`invalid command: ${line}`);
        }
        const [, dest, expr, jmp] = match;
        return {
            type: 'C',
            dest: {
                A: dest !== undefined && dest.indexOf('A') !== -1,
                M: dest !== undefined && dest.indexOf('M') !== -1,
                D: dest !== undefined && dest.indexOf('D') !== -1
            },
            op: expr,
            jmp: jmp || 'JNO'
        };
    }
    private compileLabel(label: string): ACommand {
        const address = +label;
        if (!isNaN(address)) {
            return {
                type: 'A',
                address: address
            };
        }
        if (this.labelTable[label]) {
            return this.labelTable[label];
        }
        if (!this.variableTable[label]) {
            this.variableTable[label] = this.variableMem++;
        }
        return {
            type: 'A',
            address: this.variableTable[label]
        }
    }
}

export class BinaryCompiler {
    compile(source: string): CPUCommand[] {
        return source.split('\n').map(this.compileLine, this);
    }
    compileLine(line: string): CPUCommand {
        if (line[0] === '0') {
            return {
                type: 'A',
                address: parseInt(line.slice(1), 2)
            };
        }
        const code = parseInt(line, 2);
        // 111a cccc ccdd djjj
        return {
            type: 'C',
            dest: {
                D: (code & 0x08) !== 0,
                M: (code & 0x10) !== 0,
                A: (code & 0x20) !== 0,
            },
            op: commands[(code >> 6) & 0x7F] || '0',
            jmp: ['JNO','JGT','JEQ','JGE','JLT','JNE','JLE','JMP'][code & 7]
        };
    }
}