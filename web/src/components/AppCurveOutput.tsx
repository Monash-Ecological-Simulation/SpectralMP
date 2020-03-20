import * as React from "react";
import { Scatter } from "react-chartjs-2";
import * as FM from "@web/fm";
import { Range_T, CurveBundle_T, AnalysisParam_T } from "@web/types";
import Box from "./Box";
import Separator from "./Separator";
import "./AppCurveOutput.css";
import { getCurveDataConf } from "@web/confCharts";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Application: output for a curve
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

interface Props {
  analysisParam: AnalysisParam_T;
  curves: CurveBundle_T[];
  onRemove: (k: FM.Hash) => void;
  range: Range_T;
  writePoints: boolean;
}

export default function AppCurveOutput(props: Props): JSX.Element {
  const aP = props.analysisParam;
  const start = props.range.start;
  const end = props.range.end;
  const wP = props.writePoints;

  return (
    <section className="AppCurveOutput">
      {props.curves.map((c: CurveBundle_T) => {
        const dataConf = getCurveDataConf(aP, c, start, end, wP);
        const markers: Array<string> = c.curveMarker.getListOfMarker(start, end).map(m => m.toFixed(2));
        return (
          <Box
            key={c.key}
            title={
              <div className="AppCurveOutput_head">
                <span className="AppCurveOutput_name">{c.fName}</span>
                <button onClick={() => props.onRemove(c.key)}>X</button>
              </div>
            }
          >
            <div className="AppCurveOutput_main">
              <div className="AppCurveOutput_graphContainer">
                <Scatter height={300} data={dataConf.data} options={dataConf.options} />
              </div>
              {
                <>
                  <Separator />
                  <div className="AppCurveOutput_markers">
                    <div className="AppCurveOutput_markersLabel">Markers:</div>
                    <textarea
                      className="AppCurveOutput_textarea"
                      readOnly={true}
                      value={markers.toString()}
                    />
                  </div>
                </>
              }
            </div>
          </Box>
        );
        // --- --- --- END CODE FOR ONE CURVE
      })}{" "}
    </section>
  );
}
