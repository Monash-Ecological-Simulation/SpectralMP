import * as React from "react";
import { Range_T, HistoData_T } from "@web/types";
import { Bar, HorizontalBar, Line } from "react-chartjs-2";
import "./AppSummaryOutput.css";
import { getHistogramDataConf } from "@web/confCharts";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Application: summary output
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

interface Props {
  range: Range_T;
  histoData: HistoData_T;
}

export default function AppSummaryOutput(props: Props): JSX.Element {
  const dataConf = getHistogramDataConf(props.range, props.histoData);
  return (
    <div className="AppSummaryOutput">
      <HorizontalBar data={dataConf.data} options={dataConf.options} />
    </div>
  );
}
