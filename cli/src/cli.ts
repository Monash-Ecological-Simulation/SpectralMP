// Spectral Reflectance Marker Point
// 2017-10
// Dr. Matthieu Herrmann, Monash University, Melbourne, Australia
// Based on C++ code by Dr. Alan Dorin, Monash University, Melbourne, Australia

// Node code version

// --- --- --- Imports

import * as os from 'os';                                 // Node.js: os
import * as fs from 'fs';                                 // Node.js: File system
import * as yargs from 'yargs';                           // Command line parsing with yargs
import * as util from "util";
util.inspect.defaultOptions.maxArrayLength = null;

import * as reflectance from "../../typescript/src/spectralReflectance"
import * as reflectanceParser from "../../typescript/src/spectralReflectanceParser"

// --- --- --- Helpers
function error(message:string, exit_code:number){
  console.error(os.EOL + "  error: " + message + os.EOL);
  process.exit(exit_code);
}


// --- --- --- Main program

// --- CLI validation
const cli:yargs.Arguments = yargs.version("0.1.0")
  .usage('Usage: $0 -a <n> -r <n> [options] [files]') // usage string of application.
  .alias("a", "amplitude").number("a").default("a", 20).describe("a", "Amplitude to detect, in percentage [0, 100]")
  .alias("r", "range").number("r").default("r", 50).describe("r", "Range over which to perform the detection")
  .alias("l", "lookahead").number("l").default("l", 5).describe("l", "Slop detection lookahead")
  .alias("s", "smooth").number("s").default("s", 10).describe("s", "Smoothing window size")
  .alias("m", "multi").boolean("m").describe("m", "Select the multi wavelength column format")
  .alias("h", "header").boolean("h").describe("h", "Skip header")
  .alias("c", "cpp").boolean("c").describe("c", "Mimic original CPP code")
  .strict()
  .argv;

// Check arguments
const arg_amplitude:number =  cli.amplitude;
if(!Number.isInteger(arg_amplitude)){ error("argument `-a --amplitude' must be an integer", 1); }

const arg_range:number = cli.range;
if(!Number.isInteger(arg_range)){ error("argument `-r --range' must be an integer", 1); }

const arg_lookahead:number = cli.lookahead;
if(!Number.isInteger(arg_lookahead)){ error("argument `-l --lookahead' must be an integer", 1); }

const arg_smooth:number = cli.smooth;
if(!Number.isInteger(arg_smooth)){ error("argument `-s --smooth' must be an integer", 1); }

const arg_multi:reflectanceParser.ParsingMode =
  cli.multi? reflectanceParser.ParsingMode.Multi: reflectanceParser.ParsingMode.Single;

const arg_header:boolean = cli.header;

const arg_cpp:boolean = cli.cpp;

const parser = new reflectanceParser.CurveParser(arg_header, arg_multi);

// Create the parameters
const param:reflectance.CurveMarkerParameters = {
  amplitude:arg_amplitude, range:arg_range,
  smoothingWindow:arg_smooth, lookahead:arg_lookahead
}

// Checks if files exists, and load them in strings (should be a csv string)
// Those strings will be passed to the reflectance library.
for(var filePath of cli._){
  let data:string = fs.readFileSync(filePath).toString();
  let rawCurve = parser.parse(data);
  if(typeof rawCurve === "string"){
    console.log("Error reading file " + filePath + ":   " + rawCurve)
  } else {
    let smoothedCurve = new reflectance.CurveMarker(rawCurve, param, arg_cpp);
    console.log(smoothedCurve.outputDetailedCurveCPP());
  }
}
