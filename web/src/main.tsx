// Spectral Reflectance Analysis, main entry point
// Dr. Matthieu Herrmann, Monash University, Melbourne, Australia
// 2018

import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./components/App";
import "./main.css";

ReactDOM.render(<App />, document.getElementsByTagName("main")[0]);

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Notes and doc
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
/***

# Quick and Dirty React intro


## About TSX and React
We use the JSX equivalent of React for Javascript. JSX allows to use a tag style inside a javascript code.
It is however purely optional:
Pure JS:
  React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Hello!')
In JSX:
  <a href="https://facebook.github.io/react/">Hello!</a>


## About JSX/TSX:

### HTML Tag vs Component

To render a HTML Tag in JSX, write the tag in lower case (here with a typescript type annotation).
  let myDivElement:JSX.Element = <div className="foo" />;

To render a Component, create a class/functional component with the first letter in upper case.
Then use the name in the tag.
  class HelloWorld extends React.Component<any, any>{
    render():JSX.Element{
      return  ...
    }
  }
  let myHWEComponent = <HelloWorld />


 ***/
