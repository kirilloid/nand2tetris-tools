import * as React from 'react';
//import logo from './logo.svg';
//import './App.css';
import { Flex, Item } from 'react-flex';
import Toolbar from './Toolbar';
import CodeView from './CodeView';
import MemView from './MemView';
import Display from './Display';

import { Machine } from './model/machine/machine';

class App extends React.Component {
  props: {
    machine: Machine;
  }
  render() {
    const { sourceCode, sourceMaps } = this.props.machine.getDebugData();
    return (
      //<div className="App">
        <Flex column>
          <Item flexBasis='fit'>
            <Toolbar />
          </Item>
          <Item flexBasis='fit'>
            <Item flexBasis='fit'>
              <CodeView lines={sourceCode} sourceMaps={sourceMaps} pc={this.props.machine.getPC()} />
            </Item>
            <Item flexBasis='fit'>
              <MemView lines={this.props.machine.getMemory().getAll()} />
            </Item>
            <Display display={this.props.machine.display} />
          </Item>
        </Flex>
      //</div>
    );
  }
}

export default App;
