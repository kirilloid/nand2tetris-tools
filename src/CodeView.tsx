import * as React from 'react';
import { Component } from 'react';
import BufferedTable from './BufferedTable';
import { code } from './actions';

export default class AsmView extends BufferedTable<string> {
    props: {
        lines: string[];
        sourceMaps: {[key: number]: number};
        pc: number;
    }
    constructor() {
        super();
        this.ondrop = this.ondrop.bind(this);
    }
    componentDidMount() {
        super.componentDidMount();
        if (this.root !== null) {
            this.root.addEventListener('drop', this.ondrop);
        }
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.root !== null) {
            this.root.removeEventListener('drop', this.ondrop);
        }
    }
    private ondrop(event: DragEvent) {
        event.preventDefault();
        event.dataTransfer.items[0].getAsString((content: string) => {
            code(content.split('\n'));
        });
    }
    renderRow(command: string, index: number) {
        const { lines, sourceMaps, pc } = this.props;
        const bgColor = index in sourceMaps
            ? 'gray'
            : sourceMaps[index] === pc
                ? 'yellow'
                : 'white';
        const str = ('    ' + index).slice(-5) + ' | ' + command;
        return <pre key={index} style={{ background: bgColor }}>{str}</pre>;
    }
}