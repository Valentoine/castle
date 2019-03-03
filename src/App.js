import React, { Component } from 'react';
/*import logo from './logo.svg';*/
import './App.css';
var data = require('./final.json');


class App extends Component {
  render() {
    return (
      <div className="App">
        <header>
          <h1>Table of Castles with stared Restaurant</h1>
        </header>
        <body>
        <table className="Table">
          <thead>
            <tr>
              <th>Name of Castle</th>
              <th>Price Range</th>
              <th>Reserve at</th>
            </tr>
          </thead>
          <tbody>
          {
            data.map(function(obj){
              return(
              <tr>
                <td>{obj.nameCastle}</td>
                <td>{obj.priceRange}</td>
                <td>{obj.urlCastle}</td>
              </tr>)
            })
          }
          </tbody>
          </table>
        </body>
      </div>
    );
  }
}

export default App;
