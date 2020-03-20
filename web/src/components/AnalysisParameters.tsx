import * as React from "react";
import { AnalysisParam_T, Range_T } from "@web/types";
import Separator from "./Separator";
import NRange from "./inputs/NRange";
import NSlider from "./inputs/NSlider";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Application: input
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

interface Props {
  analysisParameter: AnalysisParam_T;
  intervalParameter: Range_T;
  parametersChange: (param: AnalysisParam_T, r: Range_T) => void;
}

interface State {}

export default class AnalysisParameters extends React.Component<Props, State> {
  // --- --- --- Constructor
  constructor(props: Props) {
    super(props);
  }

  // --- --- --- Rendering
  public render(): JSX.Element {
    return (
      <div>
        <form>
          <NSlider
            label="Amplitude (%)"
            min={1}
            max={100}
            defaultValue={this.props.analysisParameter.amplitude}
            onChange={this.handleOnAmplitude}
          />
          <Separator />
          <NSlider
            label="Range (nm)"
            min={1}
            max={1000}
            defaultValue={this.props.analysisParameter.range}
            onChange={this.handleOnRange}
          />
          <Separator />
          <NSlider
            label="Look-ahead (points)"
            min={0}
            max={100}
            defaultValue={this.props.analysisParameter.lookahead}
            onChange={this.handleOnLookahead}
          />
          <Separator />
          <NSlider
            label="Smoothing window (±points)"
            min={0}
            max={100}
            defaultValue={this.props.analysisParameter.smoothingWindow}
            onChange={this.handleOnSmoothingW}
          />
          <Separator />
          <NRange
            label="Interval (nm)"
            min={0}
            max={1000}
            step={5}
            defaultMin={this.props.intervalParameter.start}
            defaultMax={this.props.intervalParameter.end}
            onChange={this.handleOnInterval}
          />
        </form>
      </div>
    );
  }

  // --- --- --- Handle changes
  private handleOnAmplitude = (n: number): void => {
    this.props.parametersChange(
      { ...this.props.analysisParameter, amplitude: n },
      this.props.intervalParameter
    );
  };

  private handleOnRange = (n: number): void => {
    this.props.parametersChange(
      { ...this.props.analysisParameter, range: n },
      this.props.intervalParameter
    );
  };

  private handleOnLookahead = (n: number): void => {
    this.props.parametersChange(
      { ...this.props.analysisParameter, lookahead: n },
      this.props.intervalParameter
    );
  };

  private handleOnSmoothingW = (n: number): void => {
    this.props.parametersChange(
      { ...this.props.analysisParameter, smoothingWindow: n },
      this.props.intervalParameter
    );
  };

  private handleOnInterval = (min: number, max: number): void => {
    this.props.parametersChange(this.props.analysisParameter, {
      ...this.props.intervalParameter,
      start: min,
      end: max
    });
  };
}
