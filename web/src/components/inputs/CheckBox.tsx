import { isUndefined } from "util";
import * as React from "react";
import "./CheckBox.css";

interface Props {
  defaultValue?: boolean;
  onChange?: (b: boolean) => void;
}

interface State {
  value: boolean;
}

export default class CheckBox extends React.Component<Props, State> {
  // --- --- --- Constructor
  constructor(props: Props) {
    super(props);
    this.state = { value: !isUndefined(props.defaultValue) ? props.defaultValue : false };
  }

  // --- --- --- Rendering
  public render(): JSX.Element {
    return (
      <input
        type="checkbox"
        className="CheckBox"
        checked={this.state.value}
        onChange={this.handleOnChange}
      />
    );
  }

  // --- --- --- Handle changes
  // Warning: use the class field syntax to avoid lambda ()=> in render(), while still being bind to this
  private handleOnChange = (event: any): void => {
    const b: boolean = event.target.checked;
    this.setState(prevState => {
      if (!isUndefined(this.props.onChange)) {
        this.props.onChange(b);
      }
      return { value: b };
    });
  };
}
