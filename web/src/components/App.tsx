import * as React from "react";
import { CurveBundle_T, AnalysisParam_T, ParserParam_T, Range_T, HistoData_T } from "@web/types";
import AnalysisParameters from "./AnalysisParameters";
import ParserParameters from "./ParserParameters";
import AppCurveOutput from "./AppCurveOutput";
import AppSummaryOutput from "./AppSummaryOutput";
import DropZone from "./inputs/DropZone";
import CheckBox from "./inputs/CheckBox";
import Box from "./Box";
import * as FM from "@web/fm";
import * as SA from "@lib/spectralReflectance";
import * as SAP from "@lib/spectralReflectanceParser";
import "./App.css";
import * as ZIP from "jszip";
import { saveAs } from "file-saver";
import ChartRenderer from "@web/renderChart";
import * as CC from "@web/confCharts";

// --- --- --- Logo
const logo = require('../logo.png')

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Global configuration
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

// Plugins allowing to display text on ChartJS points
import * as Plug from "chartjs-plugin-datalabels";
// No Chart type definition at the moment: workaround!!
const Chart = require("react-chartjs-2");
// Register the plugins globally and also disable it: re-enable where needed.
Chart.Chart.pluginService.register({ Plug });
Chart.defaults.global.plugins.datalabels.display = false;

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Application: full
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

// --- --- --- App

interface Props {}

interface State {
  // --- Inputs
  parserParameter: ParserParam_T;
  analysisParameter: AnalysisParam_T;
  graphParameters: { width: number; height: number; isTransparent: boolean; writePoints: boolean };
  rangeParameter: Range_T;
  // --- Outputs
  errors: string[];
  curveBundles: CurveBundle_T[];
  histoData: HistoData_T;
}

export default class App extends React.Component<Props, State> {
  // --- --- --- Internal fields
  private fm: FM.FileManager;

  // --- --- --- Constructor
  constructor(props: Props) {
    super(props);

    // Create the file manager
    this.fm = new FM.FileManager();

    // --- Default values
    const pP = { parsingMode: SAP.ParsingMode.Auto, skipHeader: false };
    const aP = { amplitude: 10, range: 50, lookahead: 5, smoothingWindow: 10 };
    const gP = { width: 1920, height: 1080, isTransparent: false, writePoints: true };
    const rP = { start: 300, end: 700, binWidth: 10 };
    const hLabels: Array<string> = this.createLabels(rP);
    const hData: Array<number> = SA.doBins([], rP.start, rP.end, rP.binWidth);

    // --- Update the state
    this.state = {
      // --- Inputs
      parserParameter: pP,
      analysisParameter: aP,
      graphParameters: gP,
      rangeParameter: rP,
      // --- Outputs
      errors: [],
      curveBundles: [],
      histoData: { labels: hLabels, data: hData }
    };
  }

  // --- --- --- Rendering
  public render(): JSX.Element {
    if (this.state.errors.length != 0){
      var errors:string = this.state.errors.length + " error(s) happened:";
      var enumber = 1;
      this.state.errors.forEach( (msg)=> {
        errors = errors+"\n\n  error " + enumber + ": "+msg;
        enumber++
      });
      alert(errors);
    }

    return (
      <div className="App">
        <div className="App_panel App_leftPanel">
          <header>
            <img alt="Spectral-MP" src={logo}/>
            <p>
              Original algorithm and C++ implementation{" "}
              <br />
              <a target="_blank" href="http://users.monash.edu.au/~aland/">
                Alan&nbsp;Dorin.
              </a>
            </p>
            <p>
              Typescript implementation and GUI
              <br />
              <a target="_blank" href="https://github.com/herrmannM">
                Matthieu&nbsp;Herrmann.
              </a>
            </p>
            <p>
              <a target="_blank" href="https://www.monash.edu/it">
              Faculty of Information Technology, Monash University, Australia.
              </a>
            </p>
            <p>
              Original method{" "}
              <br />
              <a target="_blank" href="http://chittkalab.sbcs.qmul.ac.uk/">
                Chittka
              </a>{" "}
              &amp; Menzel, JCPA(1992) A 171:171-181
            </p>
          </header>

          {/* --- Input Parameters --- */}
          <Box title="Parameter Entry">
            <AnalysisParameters
              analysisParameter={this.state.analysisParameter}
              intervalParameter={this.state.rangeParameter}
              parametersChange={this.onAnalysisChange}
            />
          </Box>

          {/* --- Check Box Activate annotations --- */}

          <div className="ParserParameters_line">
            <span className="ParserParameters_label">On-graph marker points:</span>
            <CheckBox defaultValue={true} onChange={this.handleAnnotations} />
          </div>

          {/* --- Download Button --- */}
          <button className="App_download" onClick={() => this.createZip()}>
            Download
          </button>
        </div>


        <div className="App_panel App_middlePanel">
          <AppCurveOutput
            analysisParam={this.state.analysisParameter}
            curves={this.state.curveBundles}
            range={this.state.rangeParameter}
            writePoints={this.state.graphParameters.writePoints}
            onRemove={this.onRemove}
          />
          <Box title="File Loader">
            <ParserParameters
              parserParameter={this.state.parserParameter}
              parserParameterChange={this.onParserParamChange}
            />
            <DropZone handleOnDrop={this.onDrop} />
          </Box>

          <section className="App_explanation">

            <h1>
              Spectral-MP: Automatic Calculation of
              Spectral Reflectance Curve Marker Points&nbsp;[<a href="#ref1" id="refb1"> 1 </a>]
            </h1>

            <p>
            To cite this software, please use the following ### (Todo: sofware in revision)
            </p>

            <p>
                Marker points represent the spectral positions of the electromagnetic spectrum where hymenopteran insects
                best discriminate flower colour due to their colour opponent visual processing.
                This method has been applied in several studies evaluating flower colours.
                These studies often used human marker point placement, or algorithms written in proprietary software.
                To automate the process systematically and openly, we implemented special-purpose software in C++.
                Below we provide a summary of the approach adopted in this implementation that is made available
                here in a port to TypeScript.
            </p>

            <p>
              Spectral reflectance data acquired from a spectrophotometer is loaded into the software in a specified format.
            </p>

            <p>
              Replicate values between 0 and 100% reflectance at each data point are averaged to generate a single new curve.
              If a replicate is outside the range inclusive of [0,100%], it is not used in the calculation.
              If no valid replicates at a data point fall within range,
              the reflectance at that wavelength is clipped to the range <sup><a href="#fn1" id="fnb1"> 1 </a></sup>.
            </p>

            <p>
              Raw, or otherwise unsmoothed data can be smoothed by uniformly weighted averaging across a specified range
              of data points centred on the value being smoothed
              (e.g. if the smoothing window = 10, the smoothing range, including the central data-point, is 21 data-points wide).
            </p>

            <p>
              The smoothed curve is broken into monotonically increasing or decreasing sub-segments as follows.
              The slope of the curve is assessed at each data-point by looking "ahead" towards increasing wavelengths a specified range
              (e.g. 5 data-points) to assess the mean reflectance.
              This allows the software to ignore micro-fluctuations in the curve slope due to noise remaining in the curve post-smoothing.
              It also allows the software to ignore micro-fluctuations that would not, using manual marker-point placement,
              have been detected by the naked eye at a practical level of curve magnification.
              This ensures software performance is comparable to existing literature that used manual placement.
              Additionally, this ensures the algorithm for marker point placement doesn’t act on what are believed
              to be imperceptible curve features for hymenopteran, avian or human viewers, i.e micro-fluctuations in reflectance.
              To set the look-ahead, users must account for the sampling resolution of their data.
              E.g., if&nbsp;~5&nbsp;nm is felt to be a minimal perceptible difference that holds true broadly across the spectrum
              for an organism's visual perception, then the look-ahead can be set, in data-points, to correspond to this range in nanometres.
              So, if the device samples at 1 nm intervals, then set look-ahead at 5 data-points to encompass&nbsp;5&nbsp;nm.
            </p>

            <p>
              Each monotonically increasing or decreasing region of the curve is searched to determine if any part of it
              contains a step change beyond a specified reflectance (e.g. 20%).
              Any curve segments meeting this change in reflectance within a specified wavelength range (e.g.&nbsp;50&nbsp;nm)
              are marked as sufficiently rapid (and therefore perceptible) to warrant marker point placement.
              Any curves that do not meet the wavelength range requirement, but meeting the reflectance change threshold,
              are repeatedly subdivided to test if any sub-segments meet the required reflectance step change within the
              required wavelength range.
              These are individually marked as suitable for marker point placement.
            </p>

            <p>
              A data point on a curve segment that warrants marker point placement is tagged as a marker point if it
              contains the closest reflectance reading on the segment to the vertical centre of the region determined above.
            </p>

            <section>
              <small id="fn1">
                1. An alternative approach to handling low reflectance values is to clip them at 2%,
                the reflectance of black coal, a very dark natural surface. Our software does not implement this approach.
                <a href="#fnb1" title="Jump back to footnote 1 in the text."> ↩ </a>
              </small>
            </section>



            <hr/>
            <h2> User Manual </h2>
            <p>
              The software on this page runs inside your browser.
              Computation may take a while if your data are large or if you load several files. In such
              cases, your browser may ask if you wish to stop the script. Fear not! This is normal.
            </p>

            <h3> 1. Loading Your Data </h3>
            <p>
              Your files must be in CSV format.
              Select the <q>Skip Header</q> option to skip reading the first line of your input files.
              <br />
              <br />
              Select <q>Parsing Mode</q>:
            </p>

            <dl>
              <dt>Single</dt>
              <dd>
                  If the first column of your CSV files contains a wavelength reading
                  and the remaining columns contain reflectance measurements.
              </dd>

              <dt>Multi</dt>
              <dd>
                If the first, third, etc... columns of your CSV files contain wavelength readings,
                and the second, fourth, etc... columns contain reflectance measurements.
                I.e, wavelength readings and reflectance measurements repeat alternately.<br />
                <em>Note:</em> all the wavelength readings on a line should be identical.
              </dd>

              <dt>Auto</dt>
              <dd>
                By default, the software examines the first and third columns of the first record.
                If they are identical, Parsing Mode is set to <q>Multi</q>, otherwise <q>Single</q>.
              </dd>
            </dl>

            <p>
              To load files, drag and drop them in the dropzone, or click on the <q>Browse Files</q> button.
              Note: while drag and dropping several files, you may have to wait a little before
              dropping.
            </p>
            <p>
              When a file is loaded, it is immediately parsed and processed with the current
              parameters. The associated smoothed curve is displayed along with the computed marker
              points, if any. The file can be removed from the analysis by clicking on the "X"
              next to its name.
            </p>

            <h3 id="titleCP"> 2. Changing Parameters </h3>
            <p>
              Changing the parameters result in an immediate update of the displayed curves.
              This can be useful to explore your data.
              However, loading several curves will reduce update speed.
              The middle of the screen displays the smoothed curves and its marker points, if any.
              The on-graph marker points can be disabled using the checkbox below the parameters.
              The right side of the screen displays the histogram of the marker points of all currently loaded curves in 10nm bins.
              The parameters are explained above. In summary:
            </p>

            <dl>
              <dt>Amplitude</dt>
              <dd> Amplitude of the step change in reflectance [1%, 100%].  </dd>

              <dt>Range</dt>
              <dd>
                Maximal Wavelength range within which the amplitude change must occured to qualify as containing a marker point [1nm, 1000nm].
              </dd>

              <dt>Look-ahead</dt>
              <dd>
                Number of data-points, after the current data-point, to consider when performing slope change detection [0, 100].
              </dd>

              <dt>Smoothing Window</dt>
              <dd>
                Number of data-points either side of the current data-point,
                averaged to compute the smoothed value of the current data-point [0, 100].
              </dd>

              <dt>Interval</dt>
              <dd>
                Interval within the data contained in the CSV files over which to perform marker point detection.
                This interval is displayed on the graph in blue.
                The excluded region is displayed in red.
              </dd>
            </dl>

            <h3> 3. Downloading Your Results </h3>
            <p>
              The <q>Download</q> button creates a Zip archive containing the results of the
              computation. The graphs and histogram are included.
              Graphs can be produced with or without marker point annotations. You will obtain:
            </p>
            <ul>
              <li>
                Per file:
                <ul>
                  <li>
                    A CSV file with columns: Wavelength, Reflectance Measurement as loaded, Computed Smoothed Reflectance Value, Detected
                    Slopes, Marker Points. Note that the 2 last columns are either empty or repeat
                    the Smoothed Value.
                  </li>
                  <li> The graph as displayed.</li>
                </ul>
              </li>
              <li>
                The histogram:
                <ul>
                  <li>
                    A CSV with the columns: Wavelength, Number of Markers.
                    Note that the wavelength w represents the 10nm bin [w, w+10).
                  </li>
                  <li>The histogram, horizontally as displayed, and vertically.</li>
                </ul>
              </li>
              <li>The computation parameters (JSON format).</li>
            </ul>

            <hr/>
            <h2> Reference </h2>
            <dl>
              <dt>[1] <a href="#refb1"> ↩ </a> </dt>
              <dd>
                <blockquote id="ref1">
                  Floral colours in a world without birds and bees: the plants of Macquarie Island<br />
                  Mani&nbsp;Shrestha, Klaus&nbsp;Lunau, Alan&nbsp;Dorin, Brian&nbsp;Schulze,
                  Mascha&nbsp;Bischoff, Martin&nbsp;Burd and Adrian&nbsp;G.&nbsp;Dyer<br />
                  Notes from: <a href="https://onlinelibrary.wiley.com/doi/abs/10.1111/plb.12456">
                  https://onlinelibrary.wiley.com/doi/abs/10.1111/plb.12456</a>
                </blockquote>
              </dd>
            </dl>
          </section>
        </div>

        <div className="App_panel App_rightPanel">
          <AppSummaryOutput range={this.state.rangeParameter} histoData={this.state.histoData} />
        </div>
      </div>
    );
  }

  // --- --- --- Post render operation: clear the errors
  public componentDidUpdate(prevProps:Props) {
    if(this.state.errors.length != 0){
      this.setState({errors: []});
    }
  }

  // --- --- --- Handle changes
  // Warning: use the class field syntax to avoid lambda ()=> in render(), while still being bind to this

  // --- INPUT --- --- --- ---

  // --- Parser parameter: save the param for next parsing
  private onParserParamChange = (parserParam: ParserParam_T): void => {
    this.setState({ parserParameter: parserParam });
  };

  // --- Recompute all the curves and update the histogram data
  private onAnalysisChange = (analysisParam: AnalysisParam_T, range: Range_T): void => {
    // Update the state
    this.setState((prevState: State) => {
      // Update all the bundle array and the histogram data
      const nCurves: Array<CurveBundle_T> = this.state.curveBundles.map((c: CurveBundle_T) => {
        return { ...c, curveMarker: c.curve.analyse(analysisParam) };
      });
      const nHisto = this.updateHistoData(prevState, nCurves.map(c => c.curveMarker), range);
      return {
        analysisParameter: analysisParam,
        rangeParameter: range,
        curveBundles: nCurves,
        histoData: nHisto
      };
    });
  };

  // --- Save the annotation state for next drawing
  private handleAnnotations = (flag: boolean): void => {
    this.setState(prevState => {
      return { graphParameters: { ...prevState.graphParameters, writePoints: flag } };
    });
  };

  // --- Handle new files
  private onDrop = (accepted: Array<File>, rejected: Array<File>): void => {
    // Warning! State are asynchronous, but here we want to have the "good" parsing parameter for sure,
    // So we use the callback methods of setState that provides a synchronisation point.
    this.setState({}, (): void => {
      // Now we have a sync this.state:

      // --- Handle accepted files
      // Create the parser and parse all new files
      const parser = new SAP.CurveParser(
        this.state.parserParameter.skipHeader,
        this.state.parserParameter.parsingMode
      );
      let promises: Promise<Map<FM.Hash, [string, SA.CurveData | string]>> = this.fm.loadFiles(
        accepted,
        // Transform FNC in parse result
        (fnc: FM.FNC) => {
          return [fnc.fName, parser.parse(fnc.fContent)] as [string, string | SA.CurveData];

        }
      );

      // For each file either put in the the array of curve, or in the error list
      // Also remove erroneous files from the file manager
      promises.then((parseResults: Map<FM.Hash, [string, SA.CurveData | string]>) => {

        const arrCurve: Array<CurveBundle_T> = new Array();
        const arrError: Array<string> = new Array();

        parseResults.forEach((val: [string, SA.CurveData | string], key: FM.Hash) => {
          const fn = val[0];
          const res = val[1];
          if (typeof res === "string") {
            const message = "Parsing error. File '" + fn + "': " + res;
            this.fm.remove(key);
            arrError.push(message);
          } else {
            const curve = new SA.Curve(fn, res);
            arrCurve.push({
              key: key,
              fName: fn,
              curve: curve,
              curveMarker: curve.analyse(this.state.analysisParameter)
            });
          }
        });


        // Reconciliate the changes
        this.setState(prevState => {
          // Update the bundle array and the histogram data
          const nCurves = prevState.curveBundles.concat(arrCurve);
          const nHisto = this.updateHistoData(prevState, nCurves.map(c => c.curveMarker));

          return {
            errors: prevState.errors.concat(arrError),
            curveBundles: nCurves,
            histoData: nHisto
          };
        });
      });

      // --- handle rejected files
      if (rejected.length > 0) {
        // Build the array of error messages
        const arrError: Array<string> = rejected.map((f: File) => {
          return "Could not load file '" + f.name + "'";
        });
        // Update the error state.
        this.setState(prevState => {
          return { errors: prevState.errors.concat(arrError) };
        });
      }
    }); // End onDrop setState encapsulated computation
  }; // End onDrop

  // --- Manage removal
  private onRemove = (key: FM.Hash): void => {
    this.setState(prevState => {
      // Update the file manager
      this.fm.remove(key);
      // Update the bundle array and the histogram data
      const nCurves = prevState.curveBundles.filter(cb => cb.key != key);
      const nHisto = this.updateHistoData(prevState, nCurves.map(c => c.curveMarker));
      return { curveBundles: nCurves, histoData: nHisto };
    });
  };

  // --- ZIP --- --- --- ---

  private createZip = (): void => {
    // Chart config:
    const PIXEL_RATIO: number = 2;
    const width: number = this.state.graphParameters.width;
    const height: number = this.state.graphParameters.height;
    const tr: boolean = this.state.graphParameters.isTransparent;
    const landscape = new ChartRenderer(PIXEL_RATIO, width, height, tr);
    const portrait = new ChartRenderer(PIXEL_RATIO, height, width, tr);

    // Zip file
    const zip = new ZIP();

    // --- Includes parameters
    zip.file("parameters.json", JSON.stringify(this.state.analysisParameter));

    // --- Includes Histogram

    // --- --- Histogram data
    // Zip the label with the data
    let histoContent = "";
    this.state.histoData.labels.forEach((l, idx) => {
      histoContent += l + ", " + this.state.histoData.data[idx].toString() + "\n";
    });
    zip.file("histogram.csv", histoContent);

    // --- --- Histogram pictures
    zip.file("Histogram_H.png", this.generateHistogram(true, portrait));
    zip.file("Histogram_V.png", this.generateHistogram(false, landscape));

    // --- Includes each files
    this.state.curveBundles.forEach(bundle => {
      const name = bundle.fName;
      const curveMarker = bundle.curveMarker;
      const content: string = curveMarker.outputDetailedCurveCPP();
      zip.file(name, content);
      zip.file(name + ".png", this.generateCurve(bundle, landscape));
    });

    zip.generateAsync({ type: "blob" }).then(function(blob) {
      saveAs(blob, "curves.zip");
    });
  };

  // --- HISTOGRAM --- --- --- ---

  // --- Manage the histogram data --- --- --- ---
  // If not specified, use the same range as in prevState
  private updateHistoData = (
    prevState: State,
    curves: Array<SA.CurveMarker>,
    rP: Range_T = prevState.rangeParameter
  ): HistoData_T => {
    return {
      // Recompute the label if needed
      labels: !Object.is(prevState.rangeParameter, rP)
        ? this.createLabels(rP)
        : prevState.histoData.labels,
      // Recompute the bins
      data: SA.doBins(curves, rP.start, rP.end, rP.binWidth)
    };
  };

  // --- Create an array of label given a range (no 'this binding' required)
  private createLabels(range: Range_T): Array<string> {
    // Info from the range:
    const start = range.start;
    const end = range.end;
    const binWidth = range.binWidth;
    // Create the label
    let labels = new Array(Math.floor((end - start) / binWidth)).fill("");
    labels.forEach((_, idx, array) => {
      labels[idx] = (start + idx * binWidth).toString();
    });
    return labels;
  }

  // --- Create histogram picture for zip (no 'this binding' required)
  private generateHistogram(horizontal: boolean, cr: ChartRenderer): Promise<Blob> {
    const s = this.state;
    const dataConf = CC.getHistogramDataConf(s.rangeParameter, s.histoData, horizontal);
    const typeString = horizontal ? "horizontalBar" : "bar";
    return cr.render({
      type: typeString,
      data: dataConf.data,
      options: dataConf.options
    });
  }

  // --- CURVES --- --- --- ---

  // --- Create histogram picture for zip (no 'this binding' required)
  private generateCurve(c: CurveBundle_T, cr: ChartRenderer): Promise<Blob> {
    const s = this.state;
    const r = s.rangeParameter;
    const w = s.graphParameters.writePoints;
    const dataConf = CC.getCurveDataConf(s.analysisParameter, c, r.start, r.end, w);
    return cr.render({
      type: "scatter",
      data: dataConf.data,
      options: dataConf.options
    });
  }
}
