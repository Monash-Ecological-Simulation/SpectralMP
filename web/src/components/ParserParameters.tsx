import * as React from "react";
import * as SAP from "@lib/spectralReflectanceParser";
import { ParserParam_T } from "@web/types";
import CheckBox from "./inputs/CheckBox";
import Menu from "./inputs/Menu";
import "./ParserParameters.css";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Application: input
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

interface Props {
  parserParameter: ParserParam_T;
  parserParameterChange: (param: ParserParam_T) => void;
}

interface State {}

export default class ParserParameters extends React.Component<Props, State> {
  // --- --- --- Rendering
  public render(): JSX.Element {
    return (
      <div className="ParserParameters">
        <div className="ParserParameters_container">
          <span className="ParserParameters_label">Skip Header:</span>
          <CheckBox defaultValue={false} onChange={this.handleHeader} />
        </div>
        <div className="ParserParameters_container">
          <span className="ParserParameters_label">Parsing Mode:</span>
          <Menu
            options={SAP.ParsingMode}
            selection={this.props.parserParameter.parsingMode}
            handleChoice={this.handleParsingMode}
          />
        </div>
      </div>
    );
  }

  // --- --- --- Handle changes
  private handleHeader = (b: boolean): void => {
    this.props.parserParameterChange({ ...this.props.parserParameter, skipHeader: b });
  };

  private handleParsingMode = (n: number): void => {
    this.props.parserParameterChange({ ...this.props.parserParameter, parsingMode: n });
  };
}
