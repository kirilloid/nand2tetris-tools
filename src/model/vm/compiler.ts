import { VMCommand, Segment } from "./command";

export class Compiler {
    private functionTable: {[key: string]: { args: number; address: number }};
    private labelTable: {[key: string]: number};
    compile(source: string): VMCommand[] {
        this.functionTable = {};
        this.labelTable = {};
        var codeLines: string[] = [];
        source.split('\n').forEach(line => {
            const code = line.replace(/\/\/.*$/, '').trim();
            const [command, name, numValue] = code.split(' ');
            switch (command) {
            case undefined:
                return;
            case 'function':
                this.functionTable[name] = {
                    args: +numValue,
                    address: codeLines.length
                };
                break;
            case 'label':
                this.labelTable[name] = codeLines.length;
                break;
            default:
                codeLines.push(code);
                break;
            }
        });
        var outCode: VMCommand[] = [];
        //var sourceMap = [];
        return codeLines.map(this.compileLine, this);
    }
    compileLine(line: string): VMCommand {
        var [command, name, n] = line.split(' ');
        switch (command) {
        case 'push':
            return {
                type: 'push',
                segment: <Segment>name,
                value: +n
            };
        case 'pop': 
            return {
                type: 'push',
                segment: <Segment>name,
                value: +n
            };
        case 'add':
        case 'sub':
        case 'neg':
        case 'gt':
        case 'lt':
        case 'eq':
        case 'or':
        case 'and':
        case 'not':
            return {
                type: 'op',
                op: command
            };
        case 'goto':
        case 'if-goto':
            return {
                type: 'goto',
                address: this.labelTable[name],
                if: command === 'if-goto'
            };
        case 'call':
            return {
                type: 'call',
                address: this.functionTable[name].address,
                args: this.functionTable[name].args
            }
        case 'return':
            return {
                type: 'return'
            };
        default:
            throw new Error(`Unparsable line \`${line}\``);
        }
    }
}
