import * as React from "react";
import "./Box.css";

interface Props {
  children: string | JSX.Element[] | JSX.Element;
  title: string | JSX.Element[] | JSX.Element;
}

export default function Box(props: Props) {
  return (
    <div className="Box">
      {props.title && <div className="Box_title">{props.title}</div>}
      {props.children}
    </div>
  );
}
