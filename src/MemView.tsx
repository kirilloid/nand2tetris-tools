import * as React from 'react';
import BufferedTable from './BufferedTable';
import { MemCell } from './model/machine/machine';

export default class MemView extends BufferedTable<MemCell> {
    renderRow({ label, address, value, junk }: MemCell, index: number) {
        const bgColor = junk ? 'gray' : 'white';
        const str =
            ('    ' + label).slice(-4) + ' | ' +
            ('    ' + address).slice(-5) + ' | ' +
            ('    ' + value).slice(-5);
        return (<pre key={index} style={{backgroundColor: bgColor}}>{str}</pre>);
    }
}