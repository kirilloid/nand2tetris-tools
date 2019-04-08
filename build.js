var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("model/machine/mem", ["require", "exports", "xstream"], function (require, exports, xstream_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DMA = (function () {
        function DMA(data, subj) {
            this.data = data;
            this.subj = subj;
        }
        DMA.prototype.on = function (listener) {
            this.subj.subscribe({
                next: listener,
                complete: function () { },
                error: function () { }
            });
        };
        DMA.prototype.set = function (address, value) {
            this.data[address] = value;
            //this.subj.shamefullySendNext({ address, value });
        };
        DMA.prototype.get = function (address) {
            return this.data[address];
        };
        return DMA;
    }());
    exports.DMA = DMA;
    var Memory = (function () {
        function Memory(data) {
            this.data = data;
            this.subj = new xstream_1.Stream();
        }
        // API for subclasses
        Memory.prototype.set = function (address, value) {
            this.data[address] = value;
            this.subj.shamefullySendNext({ address: address, value: value });
        };
        Memory.prototype.get = function (address) {
            return this.data[address];
        };
        Memory.prototype.reset = function () {
            for (var i = 0; i < this.data.length; i++) {
                this.data[i] = 0;
            }
        };
        Memory.prototype.dma = function (from, to) {
            var range = new Int16Array(this.data.buffer, from * 2, (from - to) * 2);
            var updates = this.subj
                .filter(function (entry) {
                return entry.address >= from &&
                    entry.address < to;
            })
                .map(function (entry) { return ({
                address: entry.address - from,
                value: entry.value
            }); });
            return new DMA(range, updates);
        };
        return Memory;
    }());
    exports.Memory = Memory;
});
define("model/machine/vga", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ONE = [255, 255, 255, 0];
    var ZERO = [0, 0, 0, 0];
    var VGAHack = (function () {
        function VGAHack(video) {
            this.video = video;
            this.updates = video.subj.map(function (entry) {
                var x = (entry.address & 0x1F) << 4;
                var y = entry.address >> 4;
                var a = [];
                for (var i = 0; i < 16; i++)
                    a.push(entry.value >> i & 1 ? ONE : ZERO);
                return {
                    sx: x,
                    sy: y,
                    values: [a]
                };
            });
        }
        Object.defineProperty(VGAHack.prototype, "width", {
            get: function () {
                return 512;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VGAHack.prototype, "height", {
            get: function () {
                return 256;
            },
            enumerable: true,
            configurable: true
        });
        VGAHack.prototype.get = function (x, y) {
            var address = (y << 5) + (x >> 4);
            var flag = 1 << (x & 15);
            var bitSet = this.video.get(address) & flag;
            return bitSet !== 0 ? ONE : ZERO;
        };
        return VGAHack;
    }());
    exports.VGAHack = VGAHack;
});
define("model/asm/command", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("model/asm/compiler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var commands = [
        'D&A', , 'D+A', , , , , 'A-D', , , , , 'D', '!D', 'D-1', '-D', , , , 'D-A', , 'D|A', , , , , , , , , , 'D+1', , , , , , , , , , , '0', , , , , , 'A', '!A', 'A-1', '-A', , , , 'A+1', , , '-1', , , , , '1',
        'D&M', , 'D+M', , , , , 'M-D', , , , , 'D', '!D', 'D-1', '-D', , , , 'D-M', , 'D|M', , , , , , , , , , 'D+1', , , , , , , , , , , '0', , , , , , 'M', '!M', 'M-1', '-M', , , , 'M+1', , , '-1', , , , , '1',
    ];
    var SymbolicCompiler = (function () {
        function SymbolicCompiler() {
        }
        SymbolicCompiler.prototype.compile = function (code) {
            var _this = this;
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
            for (var i = 0; i < 16; i++) {
                this.variableTable['R' + i] = i;
            }
            this.variableMem = 16;
            var codeLines = [];
            code.forEach(function (line, index) {
                var cleanLine = line.replace(/\/\/.*$/, '').trim();
                var m = line.match(/\((.*)\)/);
                if (m !== null) {
                    _this.labelTable[m[1]] = {
                        type: 'A',
                        address: codeLines.length
                    };
                }
                else {
                    if (cleanLine !== '') {
                        codeLines.push({ index: index, line: cleanLine });
                    }
                }
            });
            var outCode = [];
            var sourceLine = -1;
            try {
                codeLines.forEach(function (source, idx) {
                    sourceLine = source.index;
                    _this.debugData.sourceMaps[idx] = source.index;
                    outCode.push(_this.compileLine(source.line));
                });
            }
            catch (e) {
                this.debugData.syntaxErrorLine = sourceLine;
            }
            Object.keys(this.variableTable).forEach(function (name) {
                _this.debugData.memorySymbols[_this.variableTable[name]] = name;
            });
            return outCode;
        };
        SymbolicCompiler.prototype.getDebugData = function () {
            return this.debugData;
        };
        SymbolicCompiler.prototype.compileLine = function (line) {
            if (line[0] === '@') {
                return this.compileLabel(line.slice(1));
            }
            var match = line
                .replace(/\s+/g, '')
                .match(/^(?:([AMD]+)=)?(.+?)(?:;(J..))?$/);
            if (match === null) {
                throw new Error("invalid command: " + line);
            }
            var dest = match[1], expr = match[2], jmp = match[3];
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
        };
        SymbolicCompiler.prototype.compileLabel = function (label) {
            var address = +label;
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
            };
        };
        return SymbolicCompiler;
    }());
    exports.SymbolicCompiler = SymbolicCompiler;
    var BinaryCompiler = (function () {
        function BinaryCompiler() {
        }
        BinaryCompiler.prototype.compile = function (source) {
            return source.split('\n').map(this.compileLine, this);
        };
        BinaryCompiler.prototype.compileLine = function (line) {
            if (line[0] === '0') {
                return {
                    type: 'A',
                    address: parseInt(line.slice(1), 2)
                };
            }
            var code = parseInt(line, 2);
            // 111a cccc ccdd djjj
            return {
                type: 'C',
                dest: {
                    D: (code & 0x08) !== 0,
                    M: (code & 0x10) !== 0,
                    A: (code & 0x20) !== 0,
                },
                op: commands[(code >> 6) & 0x7F] || '0',
                jmp: ['JNO', 'JGT', 'JEQ', 'JGE', 'JLT', 'JNE', 'JLE', 'JMP'][code & 7]
            };
        };
        return BinaryCompiler;
    }());
    exports.BinaryCompiler = BinaryCompiler;
});
define("model/machine/machine", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("model/machine/cpu", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("model/asm/cpu", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var orA = function (c) { return c.D | c.A; };
    var orM = function (c) { return c.D | c.M; };
    var andA = function (c) { return c.D & c.A; };
    var andM = function (c) { return c.D & c.M; };
    var plusA = function (c) { return c.D + c.A; };
    var plusM = function (c) { return c.D + c.M; };
    var plusD1 = function (c) { return c.D + 1; };
    var not = function (v) { return ~v & 0xFFFF; };
    var cCommandTable = {
        'D&A': andA, 'A&D': andA,
        'D&M': andM, 'A&M': andM,
        'D': function (c) { return c.D; },
        '-D': function (c) { return -c.D; },
        '!D': function (c) { return not(c.D); },
        'A-D': function (c) { return c.A - c.D; },
        'A-M': function (c) { return c.M - c.D; },
        'D+1': plusD1,
        '1+D': plusD1,
        'D-1': function (c) { return c.D - 1; },
        'D+A': plusA, 'A+D': plusA,
        'D+M': plusM, 'M+D': plusM,
        'D-A': function (c) { return c.D - c.A; },
        'D|A': orA, 'A|D': orA,
        'D|M': orM, 'M|D': orM,
        '0': function (c) { return 0; },
        '1': function (c) { return 1; },
        '-1': function (c) { return -1; },
        'A': function (c) { return c.A; },
        'M': function (c) { return c.M; },
        '!A': function (c) { return not(c.A); },
        '!M': function (c) { return not(c.M); },
        '-A': function (c) { return -c.A; },
        '-M': function (c) { return -c.M; },
        'A+1': function (c) { return c.A + 1; },
        'M+1': function (c) { return c.M + 1; },
        'A-1': function (c) { return c.A - 1; },
        'M-1': function (c) { return c.M - 1; },
    };
    var jCommandTable = {
        JNO: function (a) { return false; },
        JGT: function (a) { return a > 0; },
        JEQ: function (a) { return a == 0; },
        JGE: function (a) { return a >= 0; },
        JLT: function (a) { return a < 0; },
        JNE: function (a) { return a != 0; },
        JLE: function (a) { return a <= 0; },
        JMP: function (a) { return true; },
    };
    var CPU = (function () {
        function CPU(mem) {
            this.mem = mem;
            this.address = 0;
            this.dataRegister = 0;
        }
        CPU.prototype.load = function (code) {
            this.PC = 0;
            this.code = code; // this.compiler.compile(code);
        };
        CPU.prototype.reset = function () {
            this.PC = 0;
        };
        CPU.prototype.getPC = function () {
            return this.PC;
        };
        Object.defineProperty(CPU.prototype, "M", {
            get: function () {
                return this.mem.get(this.address);
            },
            set: function (value) {
                this.mem.set(this.address, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CPU.prototype, "D", {
            get: function () {
                return this.dataRegister;
            },
            set: function (value) {
                this.dataRegister = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CPU.prototype, "A", {
            get: function () {
                return this.address;
            },
            set: function (value) {
                this.address = value;
            },
            enumerable: true,
            configurable: true
        });
        CPU.prototype.step = function () {
            this.exec(this.code[this.PC]);
        };
        CPU.prototype.exec = function (cmd) {
            // A-command
            if (cmd.type === 'A') {
                this.A = cmd.address;
                return;
            }
            // C-command
            var result = cCommandTable[cmd.op](this);
            if (jCommandTable[cmd.jmp](result)) {
                this.PC = this.A - 1;
            }
            if (cmd.dest.M)
                this.M = result;
            if (cmd.dest.D)
                this.D = result;
            if (cmd.dest.A)
                this.A = result;
            this.PC++;
        };
        return CPU;
    }());
    exports.default = CPU;
});
define("model/machine/hack", ["require", "exports", "model/machine/mem", "model/asm/compiler", "model/asm/cpu", "model/machine/vga"], function (require, exports, mem_1, compiler_1, cpu_1, vga_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var mem = new mem_1.Memory(new Int16Array(32768));
    var display = new vga_1.VGAHack(mem.dma(16384, 24576));
    var keyboard = mem.dma(24576, 24577);
    var Hack = (function () {
        function Hack() {
            this.SIZE = 32768;
            this.mem = new mem_1.Memory(new Int16Array(this.SIZE));
            this.initMemoryView();
            this.cpu = new cpu_1.default(mem);
            this.display = new vga_1.VGAHack(this.mem.dma(16384, 24576));
            this.compiler = new compiler_1.SymbolicCompiler();
        }
        Hack.prototype.initMemoryView = function () {
            var _this = this;
            this.values = new Array(this.SIZE);
            this.resetMemory();
            this.mem.dma(0, this.SIZE).on(function (_a) {
                var address = _a.address, value = _a.value;
                _this.values[address].value = value;
            });
            this.memoryView = {
                get: function (address) {
                    return _this.values[address];
                },
                getAll: function () {
                    return _this.values;
                }
            };
        };
        Hack.prototype.resetMemory = function () {
            var memorySymbols = this.compiler.getDebugData().memorySymbols;
            for (var i = 0; i < this.SIZE; i++) {
                this.values[i] = {
                    label: memorySymbols[i] || '',
                    address: i,
                    value: 0,
                    junk: true
                };
            }
        };
        Hack.prototype.reset = function () {
            this.cpu.reset();
        };
        Hack.prototype.step = function () {
            this.cpu.step();
        };
        Hack.prototype.getPC = function () {
            return this.cpu.getPC();
        };
        Hack.prototype.keyboard = function (code) {
            this.mem.set(24576, code);
        };
        Hack.prototype.getMemory = function () {
            return this.memoryView;
        };
        Hack.prototype.load = function (code) {
            var commands = this.compiler.compile(code);
            this.cpu.load(commands);
        };
        Hack.prototype.getDebugData = function () {
            return this.compiler.getDebugData();
        };
        return Hack;
    }());
    exports.Hack = Hack;
    ;
});
define("store", ["require", "exports", "redux", "model/machine/hack"], function (require, exports, redux_1, hack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function reducer(state, action) {
        switch (action.type) {
            case 'code':
                state.machine.load(action.payload);
                return state;
            case 'step':
                state.machine.step();
                return state;
            case 'reset':
                state.machine.reset();
                if (state.running !== 0) {
                    clearInterval(state.running);
                }
                return {
                    machine: state.machine,
                    running: 0,
                    code: state.code
                };
            case 'run':
                if (state.running !== 0) {
                    return state;
                }
                return {
                    machine: state.machine,
                    running: setInterval(function () { return exports.store.dispatch({ type: 'step' }); }, 300),
                    code: state.code
                };
            case 'stop':
                if (state.running === 0) {
                    return state;
                }
                clearInterval(state.running);
                return {
                    machine: state.machine,
                    running: 0,
                    code: state.code
                };
        }
    }
    exports.store = redux_1.createStore(reducer, {
        machine: new hack_1.Hack(),
        running: 0,
        code: []
    });
});
define("actions", ["require", "exports", "store"], function (require, exports, store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.step = function () { return store_1.store.dispatch({ type: 'step' }); };
    exports.reset = function () { return store_1.store.dispatch({ type: 'reset' }); };
    exports.run = function () { return store_1.store.dispatch({ type: 'run' }); };
    exports.stop = function () { return store_1.store.dispatch({ type: 'stop' }); };
    exports.code = function (lines) { return store_1.store.dispatch({ type: 'code', payload: lines }); };
});
define("Toolbar", ["require", "exports", "react", "actions"], function (require, exports, React, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Toolbar = (function (_super) {
        __extends(Toolbar, _super);
        function Toolbar() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Toolbar.prototype.render = function () {
            return (React.createElement("div", null,
                React.createElement("button", { onClick: actions_1.reset }, "\u00BB"),
                React.createElement("button", { onClick: actions_1.stop }, "&square;"),
                React.createElement("button", { onClick: actions_1.step }, ">"),
                React.createElement("button", { onClick: actions_1.run }, "\u00AB")));
        };
        return Toolbar;
    }(React.Component));
    exports.default = Toolbar;
});
define("BufferedTable", ["require", "exports", "react"], function (require, exports, React) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BufferedTable = (function (_super) {
        __extends(BufferedTable, _super);
        function BufferedTable() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.ELT_HEIGHT = 30;
            return _this;
        }
        BufferedTable.prototype.componentDidMount = function () {
            var _this = this;
            if (this.root !== null) {
                this.root.onscroll = function (event) {
                    if (_this.root !== null) {
                        _this.setState({ scrollPosition: _this.root.scrollTop });
                    }
                };
            }
        };
        BufferedTable.prototype.componentWillUnmount = function () {
            if (this.root !== null) {
                delete this.root.onscroll;
            }
        };
        BufferedTable.prototype.render = function () {
            var _this = this;
            return React.createElement("div", { ref: function (div) { return _this.root = div; }, style: { ofverflow: "auto" } },
                React.createElement("div", { ref: function (div) { return _this.container = div; } }, this.props.lines.map(function (e, i) { return _this.renderRow(e, i); })));
        };
        return BufferedTable;
    }(React.Component));
    exports.default = BufferedTable;
});
define("CodeView", ["require", "exports", "react", "BufferedTable", "actions"], function (require, exports, React, BufferedTable_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AsmView = (function (_super) {
        __extends(AsmView, _super);
        function AsmView() {
            var _this = _super.call(this) || this;
            _this.ondrop = _this.ondrop.bind(_this);
            return _this;
        }
        AsmView.prototype.componentDidMount = function () {
            _super.prototype.componentDidMount.call(this);
            if (this.root !== null) {
                this.root.addEventListener('drop', this.ondrop);
            }
        };
        AsmView.prototype.componentWillUnmount = function () {
            _super.prototype.componentWillUnmount.call(this);
            if (this.root !== null) {
                this.root.removeEventListener('drop', this.ondrop);
            }
        };
        AsmView.prototype.ondrop = function (event) {
            event.preventDefault();
            event.dataTransfer.items[0].getAsString(function (content) {
                actions_2.code(content.split('\n'));
            });
        };
        AsmView.prototype.renderRow = function (command, index) {
            var _a = this.props, lines = _a.lines, sourceMaps = _a.sourceMaps, pc = _a.pc;
            var bgColor = index in sourceMaps
                ? 'gray'
                : sourceMaps[index] === pc
                    ? 'yellow'
                    : 'white';
            var str = ('    ' + index).slice(-5) + ' | ' + command;
            return React.createElement("pre", { key: index, style: { background: bgColor } }, str);
        };
        return AsmView;
    }(BufferedTable_1.default));
    exports.default = AsmView;
});
define("MemView", ["require", "exports", "react", "BufferedTable"], function (require, exports, React, BufferedTable_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MemView = (function (_super) {
        __extends(MemView, _super);
        function MemView() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MemView.prototype.renderRow = function (_a, index) {
            var label = _a.label, address = _a.address, value = _a.value, junk = _a.junk;
            var bgColor = junk ? 'gray' : 'white';
            var str = ('    ' + label).slice(-4) + ' | ' +
                ('    ' + address).slice(-5) + ' | ' +
                ('    ' + value).slice(-5);
            return (React.createElement("pre", { key: index, style: { backgroundColor: bgColor } }, str));
        };
        return MemView;
    }(BufferedTable_2.default));
    exports.default = MemView;
});
define("Display", ["require", "exports", "react"], function (require, exports, React) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Display = (function (_super) {
        __extends(Display, _super);
        function Display() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Display.prototype.shouldComponentUpdate = function () {
            return false;
        };
        Display.prototype.redraw = function (_a) {
            var sx = _a.sx, sy = _a.sy, values = _a.values;
            if (this.ctx === null)
                return;
            var i = 0;
            var imageData = this.ctx.getImageData(sx, sy, values[0].length, values.length);
            values.forEach(function (row) {
                return row.forEach(function (cell) {
                    return cell.forEach(function (v) { return imageData.data[i++] = v; });
                });
            });
            this.ctx.putImageData(imageData, sx, sy);
        };
        Display.prototype.renderError = function () {
            var ctx = this.ctx;
            if (ctx === null)
                return;
            ctx.fillStyle = "#06a";
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle = "#fff";
            ctx.font = "96px Arial";
            ctx.strokeText(":(", 24, 24);
            ctx.font = "24px Arial";
            ctx.strokeText("Your computer ran into a problem and needs to restart. We're just doing nothing about it so you should restart it by yourself.", 20, 120, 464);
            ctx.font = "12px Arial";
            ctx.strokeText("This fine print block is to distract you and I believe overall page  layout is not copyrighted.", 20, 220, 464);
        };
        Display.prototype.renderComplete = function () {
            var ctx = this.ctx;
            if (ctx === null)
                return;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle = "#f80";
            ctx.font = "24px Arial";
            ctx.strokeText("It's now safe to turn off", 64, 64);
            ctx.strokeText("your computer.", 128, 88);
        };
        Display.prototype.setCanvas = function (canvas) {
            if (canvas === null) {
                this.setState({ failedInit: false });
                return;
            }
            this.ctx = canvas.getContext('2d');
            if (this.ctx === null) {
                this.setState({ failedInit: false });
            }
            else {
                this.setState({ failedInit: true });
            }
        };
        Display.prototype.componentDidMount = function () {
            if (this.ctx === null)
                return;
            this.ctx.fillStyle = "#fff";
            this.ctx.fillRect(0, 0, 512, 256);
            this.props.display.updates.subscribe({
                next: this.redraw.bind(this),
                error: this.renderError.bind(this),
                complete: this.renderComplete.bind(this)
            });
        };
        Display.prototype.render = function () {
            var _this = this;
            return (this.state.successfullInit
                ? React.createElement("canvas", { ref: function (canvas) { return _this.setCanvas(canvas); }, width: this.props.display.width, height: this.props.display.height })
                : React.createElement("div", null, "Cannot initialize canvas"));
        };
        return Display;
    }(React.Component));
    exports.default = Display;
});
define("App", ["require", "exports", "react", "react-flex", "Toolbar", "CodeView", "MemView", "Display"], function (require, exports, React, react_flex_1, Toolbar_1, CodeView_1, MemView_1, Display_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var App = (function (_super) {
        __extends(App, _super);
        function App() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        App.prototype.render = function () {
            var _a = this.props.machine.getDebugData(), sourceCode = _a.sourceCode, sourceMaps = _a.sourceMaps;
            return (
            //<div className="App">
            React.createElement(react_flex_1.Flex, { column: true },
                React.createElement(react_flex_1.Item, { flexBasis: 'fit' },
                    React.createElement(Toolbar_1.default, null)),
                React.createElement(react_flex_1.Item, { flexBasis: 'fit' },
                    React.createElement(react_flex_1.Item, { flexBasis: 'fit' },
                        React.createElement(CodeView_1.default, { lines: sourceCode, sourceMaps: sourceMaps, pc: this.props.machine.getPC() })),
                    React.createElement(react_flex_1.Item, { flexBasis: 'fit' },
                        React.createElement(MemView_1.default, { lines: this.props.machine.getMemory().getAll() })),
                    React.createElement(Display_1.default, { display: this.props.machine.display }))));
        };
        return App;
    }(React.Component));
    exports.default = App;
});
define("index", ["require", "exports", "react", "react-dom", "App", "store"], function (require, exports, React, react_dom_1, App_1, store_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _a = store_2.store.getState(), machine = _a.machine, running = _a.running, code = _a.code;
    react_dom_1.render(React.createElement(App_1.default, { machine: machine }), document.body);
});
define("model/vm/command", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("model/vm/compiler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Compiler = (function () {
        function Compiler() {
        }
        Compiler.prototype.compile = function (source) {
            var _this = this;
            this.functionTable = {};
            this.labelTable = {};
            var codeLines = [];
            source.split('\n').forEach(function (line) {
                var code = line.replace(/\/\/.*$/, '').trim();
                var _a = code.split(' '), command = _a[0], name = _a[1], numValue = _a[2];
                switch (command) {
                    case undefined:
                        return;
                    case 'function':
                        _this.functionTable[name] = {
                            args: +numValue,
                            address: codeLines.length
                        };
                        break;
                    case 'label':
                        _this.labelTable[name] = codeLines.length;
                        break;
                    default:
                        codeLines.push(code);
                        break;
                }
            });
            var outCode = [];
            //var sourceMap = [];
            return codeLines.map(this.compileLine, this);
        };
        Compiler.prototype.compileLine = function (line) {
            var _a = line.split(' '), command = _a[0], name = _a[1], n = _a[2];
            switch (command) {
                case 'push':
                    return {
                        type: 'push',
                        segment: name,
                        value: +n
                    };
                case 'pop':
                    return {
                        type: 'push',
                        segment: name,
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
                    };
                case 'return':
                    return {
                        type: 'return'
                    };
                default:
                    throw new Error("Unparsable line `" + line + "`");
            }
        };
        return Compiler;
    }());
    exports.Compiler = Compiler;
});
define("model/vm/cpu", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var not = function (v) { return ~v & 0xFFFF; };
    var fromBoolean = function (value) { return value ? 0 : 0x8000; };
    var CPU = (function () {
        function CPU(mem) {
            var _this = this;
            this.mem = mem;
            ['SP', 'LCL', 'ARG', 'THIS', 'THAT'].forEach(function (label, i) {
                return Object.defineProperty(_this, label, {
                    get: function () {
                        return this.mem.get(i);
                    },
                    set: function (value) {
                        this.mem.set(i, value);
                    }
                });
            });
        }
        CPU.prototype.load = function (code) {
            this.code = code;
            this.PC = 0;
        };
        CPU.prototype.reset = function () {
            this.PC = 0;
        };
        CPU.prototype.step = function () {
            this.exec(this.code[this.PC++]);
        };
        CPU.prototype.getPC = function () {
            return this.PC;
        };
        CPU.prototype._getPtr = function (segment) {
            switch (segment) {
                case 'temp': return 6;
                case 'static': return 16;
                case 'pointer': return 2;
                case 'local': return this.LCL;
                case 'argument': return this.ARG;
                case 'this': return this.THIS;
                case 'that': return this.THAT;
                case 'constant': return 0;
                default: var tmp = segment;
            }
            return -1;
        };
        CPU.prototype._push = function (value) {
            this.mem.set(this.SP++, value);
        };
        CPU.prototype._pop = function () {
            return this.mem.get(--this.SP);
        };
        CPU.prototype.exec = function (cmd) {
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
                    var tmp = cmd;
            }
        };
        CPU.prototype.push = function (segment, number) {
            var offset = this._getPtr(segment) + number;
            this._push(this.mem.get(offset));
        };
        CPU.prototype.pop = function (segment, number) {
            var offset = this._getPtr(segment) + number;
            this.mem.set(offset, this._pop());
        };
        CPU.prototype.operation = function (type) {
            switch (type) {
                case 'add':
                    this._push(this._pop() + this._pop());
                    break;
                case 'sub':
                    this._push(this._pop() - this._pop());
                    break;
                case 'neg':
                    this._push(-this._pop());
                    break;
                case 'gt':
                    this._push(fromBoolean(this._pop() > this._pop()));
                    break;
                case 'lt':
                    this._push(fromBoolean(this._pop() < this._pop()));
                    break;
                case 'eq':
                    this._push(fromBoolean(this._pop() == this._pop()));
                    break;
                case 'or':
                    this._push(this._pop() | this._pop());
                    break;
                case 'and':
                    this._push(this._pop() & this._pop());
                    break;
                case 'not':
                    this._push(not(this._pop()));
                    break;
                default: var tmp = type;
            }
        };
        CPU.prototype.goto = function (address, conditional) {
            if (conditional) {
                if (this._pop() !== 0) {
                    this.PC = address;
                }
            }
            else {
                this.PC = address;
            }
        };
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
        CPU.prototype.call = function (address, args) {
            this._push(this.PC);
            this._push(this.LCL);
            this._push(this.ARG);
            this._push(this.THIS);
            this._push(this.THAT);
            this.ARG = this.SP - args - 5;
            this.LCL = this.SP;
            // goto
            while (--args)
                this._push(0);
            this.PC = address;
        };
        CPU.prototype.return = function () {
            var arg = this.ARG;
            this.SP = this.LCL;
            this.THAT = this._pop();
            this.THIS = this._pop();
            this.ARG = this._pop();
            this.LCL = this._pop();
            this.PC = this._pop();
            this.SP = arg;
        };
        return CPU;
    }());
    exports.default = CPU;
});
