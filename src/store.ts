import { createStore } from 'redux';
import { Machine } from './model/machine/machine';
import { Hack } from './model/machine/hack';

type State = {
    machine: Machine;
    running: number;
    code: string[]
}

export type Action = { type: 'step'; }
                   | { type: 'reset'; }
                   | { type: 'run'; }
                   | { type: 'stop'; }
                   | { type: 'code'; payload: string[] }

function reducer(state: State, action: Action): State {
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
            running: setInterval(
                () => store.dispatch({ type: 'step' }),
                300
            ),
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

export const store = createStore<State>(
    reducer,
    {
        machine: new Hack(),
        running: 0,
        code: []
    }
);
