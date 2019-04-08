import * as React from 'react';
import { render } from 'react-dom';
import App from './App';
//import './index.css';

import { store } from './store';

const { machine, running, code } = store.getState();

render(
  <App machine={machine} />,
  document.body
);
