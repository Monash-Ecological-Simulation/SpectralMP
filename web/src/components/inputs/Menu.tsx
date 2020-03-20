import * as React from "react";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Input: Menu based on a enum
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

interface EnumInterface {
  [id: number]: string;
}

interface Props {
  options: EnumInterface;
  selection: number;
  handleChoice: (choice: number) => void;
}

interface State {
  value: number;
}

export default class Menu extends React.Component<Props, State> {
  // --- --- --- Fields
  private options: Array<React.ReactNode>;

  // --- --- --- Constructor
  constructor(props: Props) {
    super(props);
    this.state = { value: props.selection };
    // Create the list of option for the menu
    // --- Init
    this.options = new Array();
    // --- Iterate over the EnumInterface and create the react object
    for (let a in props.options) {
      const p = Number.parseInt(a);
      if (Number.isInteger(p) && props.options.hasOwnProperty(p)) {
        // Note: key is a special property for react
        const o = (
          <option key={p} value={p}>
            {" "}
            {props.options[p]}{" "}
          </option>
        );
        this.options.push(o);
      }
    }
  }

  // --- --- --- Rendering
  public render(): JSX.Element {
    return (
      <select value={this.state.value} onChange={this.handleOnChange}>
        {this.options}
      </select>
    );
  }

  // --- --- --- Handle changes
  // Warning: use the class field syntax to avoid lambda ()=> in render(), while still being bind to this
  private handleOnChange = (event: any): void => {
    const choice: number = Number.parseInt(event.target.value);
    this.setState({ value: choice });
    this.props.handleChoice(choice);
  };
}
