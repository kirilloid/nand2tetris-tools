import * as React from 'react';

import { step, reset, stop, run } from './actions';

export default class Toolbar extends React.Component {
    render() {
        return (<div>
            <button onClick={reset}>&raquo;</button>
            <button onClick={stop}>&square;</button>
            <button onClick={step}>&gt;</button>
            <button onClick={run}>&laquo;</button>
        </div>);
    }
}