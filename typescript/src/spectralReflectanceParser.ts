// Spectral Reflectance Marker Point: file parser
// 2018
// Dr. Matthieu Herrmann, Monash University, Melbourne, Australia
// Based on C++ code by Dr. Alan Dorin, Monash University, Melbourne, Australia


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Imports
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
import {CurveData} from './spectralReflectance';
import {Option, option, some, none} from 'ts-option';
import csv = require("csv-parse/lib/sync");

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Curve Parser
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

/** Parsing mode
 *  The parsing mode allow to specify if the wavelength are repeated (Multi) or not (Single) in the csv.
 *  If 'Auto', the parser attempt to detect this itself.
 */
export enum ParsingMode{Single, Auto, Multi}

/** Curve Parser.
 * Create a new CurveData from a string
 */
export class CurveParser {

  // --- --- --- Fields

  /** Skip header option */
  skipHeader:boolean;

  /** Parsing mode option*/
  parsingMode:ParsingMode;

  // --- --- --- Constructor:

  /** Create a new parser with two options */
  constructor(skipHeader:boolean, parsingMode:ParsingMode){
    this.skipHeader = skipHeader;
    this.parsingMode = parsingMode;
  }


  // --- --- --- Private methods

  /** Parsing helper: throwing on number error */
  private numberOrThrow(lineIdx:number, toParse:string):number{
    let n:number = Number(toParse);

    if(isNaN(n)){
      var msg:string = "Error: can not read a number at line " + lineIdx + ". Found '" + toParse+"'";
      if(lineIdx == 1 && !this.skipHeader){
        msg = msg + "\n  ** Consider turning \"Skip Header\" on. **"
      }
      throw new Error(msg);
    }

    return n;
  }


  // --- --- --- Public  method

  /** Parse a CSV string into a CurveData.
   * If the the string can not be parsed, return an error message as a string. */
  public parse(content:string):CurveData|string {
    try{

      // --- --- --- First, parse the content
      const from = this.skipHeader? 2 : 0;

      const parsingResult:[[string]] = csv(content, {delimiter: ",", trim: true, from: from});
      if(parsingResult.length as number === 0){ return "Error: cannot parse file"; }

      // --- --- --- Auto parsing mode
      let detectedParsingMode = this.parsingMode;
      if(detectedParsingMode === ParsingMode.Auto){
        // Assume single, and change to multi if needed
        detectedParsingMode = ParsingMode.Single;
        // We can only be in multi mode if the number of column is even
        let sample:[string] = parsingResult[0];
        if(sample.length %2 === 0){
          const reference = sample[0];
          let sameFlag = true;
          let idx = 2;
          while(idx<sample.length && sameFlag){
            sameFlag = sameFlag && (sample[idx] === reference);
            idx+=2;
          }
          if(sameFlag){ detectedParsingMode = ParsingMode.Multi }
        }
      }

      // Determine increment for record loop based on the parsing mode
      const inc:number = detectedParsingMode==ParsingMode.Single? 1: 2;

      // --- --- --- Create a new RawCurve and fill it
      let rawCurve = new CurveData(parsingResult.length);

      for(let recordIdx=0; recordIdx<parsingResult.length; ++recordIdx){
        // --- Constant per record
        const record:[string] = parsingResult[recordIdx];
        const wavelength:number = this.numberOrThrow(recordIdx+1, record[0]);

        // --- Averaging per record
        let validNb:number = 0;
        let validSum:number = 0;
        let invalidNb:number = 0;
        let invalidSum:number = 0;

        // --- Get values from the record. Increment by inc (1 or 2 depending on the parsing mode).
        for(let idx = 1; idx<record.length; idx+=inc){
          // Throw with the line recordIdx, not the column id
          const value:number = this.numberOrThrow(recordIdx+1, record[idx]);
          // Check for valid/invalid replicate
          if( 0<=value && value <= 100 ){
            // If the replicate is valid, add it to the total
            validNb++;
            validSum += value;
          } else {
            // otherwise, keep a total of the invalid replicates anyway to be used to
            // determine if the invalid replicates are above 100 or below 0
            invalidNb++;
            invalidSum += value;
          }
        } // END FOR IDX

        // --- Compute the final result: use the average of the measurement.
        // If we don't have valid values, put either 0 or 100 based on the invalid average > 100
        if(validNb!=0){ rawCurve.set(recordIdx, wavelength, validSum/validNb); }
        else if (invalidNb == 0){ rawCurve.set(recordIdx, wavelength, 0); }
        else {rawCurve.set(recordIdx, wavelength, (invalidSum/invalidNb > 100 ? 100 : 0 )); }

      } // END for(let recordIdx=0; recordIdx<parsingResult.length; ++recordIdx)

      return rawCurve

    } catch (e) {
      console.error(e)
      return e.message
    }
  }// END Parsing

}
