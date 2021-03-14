import React from 'react';
import Three from './Three';

export default function Home(){
    return(
        <div>
            <h2 className="title">Pathfinding Visualizer</h2>
            <Three />
            <button className="button">Get Started</button>
        </div>
    );
}