import * as React from "react";
import { isUndefined } from "util";
import Slider, { Range } from "rc-slider";
import "rc-slider/assets/index.css";
import "./NSlider.css";

interface Props {
  label?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  step?: number;
  onChange?: (n: number) => void;
}

interface State {
  value: number;
}

export default class NSlider extends React.Component<Props, State> {
  // --- --- --- Constructor
  constructor(props: Props) {
    super(props);
    // --- Default value for the state
    const defVal = isUndefined(this.props.defaultValue)
      ? isUndefined(this.props.min)
        ? 0
        : this.props.min
      : this.props.defaultValue;
    this.state = { value: defVal };
  }

  // --- --- --- Rendering
  public render(): JSX.Element {
    let inputProps = {
      min: this.props.min,
      max: this.props.max,
      step: this.props.step,
      value: this.state.value,
      onChange: this.handleOnChange
    };

    return (
      <div className="NSlider">
        <div className="NSlider_labelAndNumber">
          <span className="NSlider_label">{this.props.label || ""} </span>
          <input className="NSlider_number" type="number" {...inputProps} />
        </div>

        <div className="NSlider_container">
          {isUndefined(this.props.min) ? "" : this.props.min.toString()}
          <Slider className="NSlider_slider" {...inputProps} />
          {isUndefined(this.props.max) ? "" : this.props.max.toString()}
        </div>
      </div>
    );
  }

  // --- --- --- Handle changes
  // Warning: use the class field syntax to avoid lambda ()=> in render(), while still being bind to this
  private handleOnChange = (event: number | any): void => {
    let n: number = 0;
    if (typeof event === "number") {
      n = event;
    } else {
      n = Number.parseInt(event.target.value);
    }

    this.setState({ value: n });
    if (!isUndefined(this.props.onChange)) {
      this.props.onChange(n);
    }
  };
}
