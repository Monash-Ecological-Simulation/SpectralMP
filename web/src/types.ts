import * as SAP from "@lib/spectralReflectanceParser";
import * as SA from "@lib/spectralReflectance";
import * as FM from "@web/fm";


// --- Input types:

export type ParserParam_T = {
  parsingMode: SAP.ParsingMode;
  skipHeader: boolean;
};

export type AnalysisParam_T = SA.CurveMarkerParameters;

// --- Output/result types:

export type CurveBundle_T = {
  key: FM.Hash;
  fName: string;
  curve: SA.Curve;
  curveMarker: SA.CurveMarker;
};

export type Range_T = {
  start: number;
  end: number;
  binWidth: number;
};

export type HistoData_T = {
  labels: Array<string>;
  data: Array<number>;
};
