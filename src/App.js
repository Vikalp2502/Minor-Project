import React from 'react';
import './App.css';
import Home from "./PathfindingVisualizer/Home";
// import PathfindingVisualizer from './PathfindingVisualizer/PathfindingVisualizer';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

function App() {
  return (
    <Router>
      <>
      <Switch>
        <Route exact path="/" component={Home} />
        {/* <Route exact path="/path" component={PathfindingVisualizer} /> */}
      </Switch>
      </>
    </Router>
  );
}

export default App;
