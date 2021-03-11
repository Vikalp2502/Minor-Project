import React from 'react';
import './App.css';
import Three from "./PathfindingVisualizer/Three";
// import PathfindingVisualizer from './PathfindingVisualizer/PathfindingVisualizer';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

function App() {
  return (
    <Router>
      <>
      <Switch>
        <Route exact path="/" component={Three} />
        {/* <Route exact path="/path" component={PathfindingVisualizer} /> */}
      </Switch>
      </>
    </Router>
  );
}

export default App;
