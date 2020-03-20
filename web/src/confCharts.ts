import { Chart } from "chart.js";
import { Range_T, HistoData_T, AnalysisParam_T, CurveBundle_T } from "@web/types";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Global configuration
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const GLOBAL_CONF = {
  // ---
  responsive: true,
  maintainAspectRatio: false,
  // --- Disable Animation
  animation: { duration: 0 }, // general animation time
  hover: { animationDuration: 0 }, // duration of animations when hovering an item
  responsiveAnimationDuration: 0, // animation duration after a resize
  // --- Disable beziers curves
  elements: { line: { tension: 0 } },
  // --- Disable the legend and tooltips
  legend: { display: false }
};

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Create the configuration/data for the histograms
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

export function DEFAULT_HISTO_OPT(horizontal: boolean) {
  return {
    ...GLOBAL_CONF,
    // --- Axes configuration:
    scales: {
      [horizontal ? "xAxes" : "yAxes"]: [
        {
          type: "linear",
          display: true,
          position: "left",
          ticks: {
            min: 0,
            stepSize: 1
          }
        }
      ]
    }
  };
}

export function getHistogramDataConf(
  range: Range_T,
  histoData: HistoData_T,
  horizontal: boolean = true
): { options: Chart.ChartOptions; data: Chart.ChartData } {
  const titleTxt: string = "Number of marker points per " + range.binWidth.toString() + "nm bin";
  return {
    // --- --- --- options
    options: {
      ...DEFAULT_HISTO_OPT(horizontal),
      title: { display: true, text: titleTxt }
    },
    // --- --- --- data
    data: {
      labels: histoData.labels,
      datasets: [{ data: histoData.data }]
    }
  };
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Create the configuration/data for the curves
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

// --- Helper function: simply write the couple x,y
function writeCouple(item: { x: number; y: number }): string {
  return "(" + item.x.toFixed(2) + ",  " + item.y.toFixed(2) + ")";
}

// --- Tooltips function displaying the coordinate on the graph.
function doTooltip(tooltipItem: any, data: any): string {
  let label = data.datasets[tooltipItem.datasetIndex].label || "";
  if (label) {
    label += ":  ";
  }
  label += writeCouple({ x: tooltipItem.xLabel, y: tooltipItem.yLabel });
  return label;
}

// --- Default configuration for the curves
const DEFAULT_CURVE_OPT = {
  ...GLOBAL_CONF,
  // --- Axes configuration:
  scales: {
    yAxes: [
      {
        id: "yaxis",
        type: "linear",
        display: true,
        position: "left",
        ticks: { min: 0, max: 100, stepSize: 10 }
      }
    ]
  },
  // --- Tooltip configuration:
  tooltips: { callbacks: { label: doTooltip } }
};

// --- Dataset configuration for the active portion of the curve
const DATASETCONF_CURVE = {
  fill: true,
  showLine: true,
  pointRadius: 0,
  pointHitRadius: 5,
  backgroundColor: "rgba(75,192,192,0.4)",
  pointBorderColor: "rgba(75,192,192,1)"
};

// --- Dataset configuration for the margins
const DATASETCONF_MARGIN_CURVE = {
  ...DATASETCONF_CURVE,
  backgroundColor: "rgba(256,192,192,0.4)",
  pointBorderColor: "rgba(256,192,192,1)"
};

// --- Dataset configuration for the marker points
const DATASETCONF_MARKERPOINTS = {
  fill: false,
  showLine: false,
  pointStyle: "cross",
  pointRadius: 5,
  pointBorderWidth: 2,
  pointHitRadius: 10,
  backgroundColor: "rgba(256,128,128,1)",
  pointBorderColor: "rgba(256,30,30,1)"
};

// --- Configuration od the datalabels plugins.
// NOTE: The datalabel plugin is loaded and disabled globally in App.tsx
const DATALABELS = {
  formatter: function(value: { x: number; y: number }, context: any) {
    return writeCouple(value);
  },
  // anchor: "end",
  align: "top",
  offset: 10,
  rotation: -70,
  backgroundColor: "#ffffff",
  color: "#000000"
};

// --- Create the data from a curve bundle
function mkData(
  c: CurveBundle_T,
  start: number,
  end: number,
  writePoints: boolean
): Chart.ChartData {
  // --- Init the arrays for the datapoints
  const curve = new Array<{ x: number; y: number }>(c.curveMarker.smoothedCurve.length);
  const curveStart = new Array<{ x: number; y: number }>(c.curveMarker.smoothedCurve.length);
  const curveEnd = new Array<{ x: number; y: number }>(c.curveMarker.smoothedCurve.length);
  const points = new Array<{ x: number; y: number }>();

  // --- Fill the arrays
  c.curveMarker.smoothedCurve.forEach(cp => {
    const w = cp.wavelength;
    const p = { x: w, y: cp.reflectance };
    if (w < start) {
      curveStart.push(p);
    } else if (w > end) {
      curveEnd.push(p);
    } else {
      curve.push(p);
      if (cp.markerPoint) {
        points.push(p);
      }
    }
  });

  // --- Configure the datasets
  return {
    datasets: [
      // --- --- --- Curve
      { ...DATASETCONF_CURVE, label: "curve", data: curve },
      // --- --- --- Margin Curves
      { ...DATASETCONF_MARGIN_CURVE, label: "curveStart", data: curveStart },
      { ...DATASETCONF_MARGIN_CURVE, label: "curveEnd", data: curveEnd },
      // --- --- --- Marker Point
      {
        ...DATASETCONF_MARKERPOINTS,
        label: "markers",
        data: points,
        datalabels: { ...DATALABELS, display: writePoints }
      } as any
    ]
  };
}

// --- Generate the data and the configuration for a curve
export function getCurveDataConf(
  analysisParam: AnalysisParam_T,
  c: CurveBundle_T,
  start: number,
  end: number,
  writePoints: boolean
): { options: Chart.ChartOptions; data: Chart.ChartData } {
  const analysisTxt: string =
    `Amplitude: ${analysisParam.amplitude}%   ` +
    `Range: ${analysisParam.range}nm   ` +
    `Smoothing Window: ±${analysisParam.smoothingWindow} points   ` +
    `Lookahead: ${analysisParam.lookahead} points`;

  return {
    // --- --- --- options
    options: {
      ...DEFAULT_CURVE_OPT,
      // the "any" cast below is needed to support multiline titles,
      // see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24923
      title: { display: true, text: [c.fName, analysisTxt] as any }
    },
    // --- --- --- data
    data: { ...mkData(c, start, end, writePoints) }
  };
}
