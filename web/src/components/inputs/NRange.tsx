import * as React from "react";
import { isUndefined } from "util";
import Slider, { Range } from "rc-slider";
import "rc-slider/assets/index.css";
import "./NRange.css";

interface Props {
  label?: string;
  step?: number;
  min: number;
  max: number;
  defaultMin?: number;
  defaultMax?: number;
  onChange: (min: number, max: number) => void;
}

interface State {
  valMin: number;
  valMax: number;
}

export default class NRange extends React.Component<Props, State> {
  // --- --- --- Constructor
  constructor(props: Props) {
    super(props);
    // --- Default value for the state
    const defMin: number = isUndefined(this.props.defaultMin)
      ? this.props.min
      : this.props.defaultMin;
    const defMax: number = isUndefined(this.props.defaultMax)
      ? this.props.max
      : this.props.defaultMax;
    this.state = { valMin: defMin, valMax: defMax };
  }

  // --- --- --- Rendering
  public render(): JSX.Element {
    const baseProps = {
      min: this.props.min,
      max: this.props.max,
      step: this.props.step
    };

    const minProps = {
      ...baseProps,
      value: this.state.valMin,
      onChange: this.handleOnChangeMin
    };

    const maxProps = {
      ...baseProps,
      value: this.state.valMax,
      onChange: this.handleOnChangeMax
    };

    const rangeProps = {
      ...baseProps,
      value: [this.state.valMin, this.state.valMax],
      onChange: this.handleOnChangeRange
    };

    return (
      <div className="NRange">
        <div className="NRange_labelAndNumber">
          <input className="NRange_number" type="number" {...minProps} />
          <span className="NRange_label">{this.props.label || ""} </span>
          <input className="NRange_number" type="number" {...maxProps} />
        </div>

        <div className="NRange_container">
          {isUndefined(this.props.min) ? "" : this.props.min.toString()}
          <Range className="NRange_range" {...rangeProps} />
          {isUndefined(this.props.max) ? "" : this.props.max.toString()}
        </div>
      </div>
    );
  }

  // --- --- --- Handle changes
  // Warning: use the class field syntax to avoid lambda ()=> in render(), while still being bind to this
  private handleOnChangeRange = (event: number[]): void => {
    this.setState(prevState => {
      const min = event[0];
      const max = event[1];
      this.props.onChange(min, max);
      return { valMin: min, valMax: max };
    });
  };

  private handleOnChangeMin = (event: any): void => {
    const n: number = Number.parseInt(event.target.value);
    if (n < this.state.valMax) {
      this.props.onChange(n, this.state.valMax);
      this.setState({ valMin: n });
    }
  };

  private handleOnChangeMax = (event: any): void => {
    const n: number = Number.parseInt(event.target.value);
    if (n > this.state.valMin) {
      this.props.onChange(this.state.valMin, n);
      this.setState({ valMax: n });
    }
  };
}
