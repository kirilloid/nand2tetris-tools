import { store, Action } from './store';

export const step = () => store.dispatch({ type: 'step' });
export const reset = () => store.dispatch({ type: 'reset' });
export const run = () => store.dispatch({ type: 'run' });
export const stop = () => store.dispatch({ type: 'stop' });
export const code = (lines: string[]) => store.dispatch({ type: 'code', payload: lines });