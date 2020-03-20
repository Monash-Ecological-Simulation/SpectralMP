// Spectral Reflectance Marker Point
// 2018
// Dr. Matthieu Herrmann, Monash University, Melbourne, Australia
// Based on C++ code by Dr. Alan Dorin, Monash University, Melbourne, Australia
//
// Contains:
// class CurveData: raw data, an array of {wavelength:number, reflectance:number}.
//
// type CurvePoint = {wavelength:number, reflectance:number, monotonicChange:boolean, markerPoint:boolean};
//
// type CurveMarkerParameters = {
//  amplitude:number,         // [0, 100]%    variation amplitude triggering a detection
//  range:number,             // [0, ...]     range over which the above variation is assessed
//  smoothingWindow:number,   // [0, ...]     averaging range over raw curve, to produced the smoothed curve
//  lookahead:number          // [0, ...]     number of points to lookahead when performing slope detection
// };
//
// class CurveMarker: Working class using the type CurvePoint.
//                    Apply transformation to the raw data to perform marker detection.
//                    Main working class!
//
// class Curve: convenience wrapper for CurveData and CurveMarker


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Imports
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
import {Option, option, some, none} from 'ts-option';


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Curve Data
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

/**
 * A curve is mainly composed of a an array of points (wavelength, reflectance).
 * This class is based on such an array and provide access methods acting on that array.
 */

export class CurveData {

  // --- --- --- Fields

  /** Data: an array of points. */
  data:{wavelength:number, reflectance:number}[];

  // --- --- --- Constructor

  /** Build a new curve with a given length. */
  constructor(length:number){
    this.data = new Array<{wavelength:number, reflectance:number}>(length);
  }

  // --- --- --- Reading methods

  /** Get the length of the curve in number of points */
  public length():number { return this.data.length; }

  /** Read a record {wavelength:number, reflectance:number} at the given index. */
  public get(idx:number):{wavelength:number, reflectance:number}{
    return this.data[idx];
  }

  /** Read the wavelength at a given index. */
  public getWavelength = (idx:number):number => { return this.get(idx).wavelength; }

  /** Read the reflectance at a given index. */
  public getReflectance = (idx:number):number => { return this.get(idx).reflectance; }

  // --- --- --- Writing methods

  /** Write a record {wavelength:number, reflectance:number} at the given index. */
  public set(idx:number, wavelength:number, reflectance:number){
    this.data[idx] = {wavelength:wavelength, reflectance:reflectance};
  }

}


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Working Curve
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

/** Type of point use in the CurveWork class. */
export type CurvePoint = {wavelength:number, reflectance:number, monotonicChange:boolean, markerPoint:boolean};

/** Marker detection parameter. */
export type CurveMarkerParameters = {
  /** [0, 100]%    variation amplitude triggering a detection. */
  amplitude:number,
  /** [0, ...]     range over which the above variation is assessed. */
  range:number,
  /** [0, ...]     averaging range over raw curve, to produced the smoothed curve. */
  smoothingWindow:number,
  /** [0, ...]     number of points to lookahead when performing slope detection. */
  lookahead:number
};

/** Working class: put marker on a curve obtain from CurveData */
export class CurveMarker {

  // --- --- --- Fields

  /** Marker detection parameters */
  parameters:CurveMarkerParameters;

  /** Input raw curve */
  rawCurve:CurveData;

  /** Output smoothed curve*/
  smoothedCurve:CurvePoint[];

  /** Use the improved computation methods. Else, provide same result as the CPP code. See the smooth() method. */
  doCppAlgo:boolean;

  // --- --- --- Constructor

  /** Construct a new CurveMarker with the given parameter. */
  constructor(rawCurve:CurveData, parameters:CurveMarkerParameters, doCppAlgo:boolean = false){
    // --- Store the input data
    this.rawCurve = rawCurve;
    this.parameters = parameters;
    this.doCppAlgo = doCppAlgo;
    // --- Allocate the space for the result
    this.smoothedCurve = new Array<CurvePoint>(this.rawCurve.length());
    // --- Compute
    this.smooth();
    this.markCurveMonotonicallyIncreasingOrDecreasing();
  }

  /** Perform the analysis if parameter are different */
  public analyse(parameters:CurveMarkerParameters){
    if(!Object.is(this.parameters,parameters)){
      const doSmooth = parameters.smoothingWindow !== this.parameters.smoothingWindow;
      this.parameters = parameters;
      if(doSmooth){
        // This will rebuild a new smoothed curve, erasing the result of the analysis
        this.smooth();
      } else {
        // If we do not smooth, we need to reset the result of the analysis
        // In place modification
        this.smoothedCurve.forEach( (item, idx, selfArray) => selfArray[idx] = {...item, monotonicChange:false, markerPoint:false   } )
      }
      this.markCurveMonotonicallyIncreasingOrDecreasing();
    }
  }

  // --- --- --- Private access methods

  /** Write a curvePoint in the smoothedCurve at a given index. */
  private set(idx:number, wavelength:number, reflectance:number, monotonicChange:boolean, markerPoint:boolean){
    this.smoothedCurve[idx] =
      {wavelength:wavelength, reflectance:reflectance, monotonicChange:monotonicChange, markerPoint:markerPoint};
  }


  // --- --- --- Private computation methods


  // --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // Smoothing

  /** Smooth the input curve. Populate smoothedCurve with smoothed data and monotonicChange=markerPoint=false.
   *  Uniformly averaging the reflectance over smoothingWindow
   *  Note: this is not a Gaussian kernel;
   *        The average is uniformly weighted across all neighbours of a datapoint within +/- smoothingWindow
   *  Note: Smoothing is decomposed in 3 independents steps. The steps 1 and 3 take care of the smoothing
   *        boundaries, putting 0. Step 2 do the main work. We have two methods for the step 2. One inherited from the
   *        CPP code, and an optimized one with a sliding windows (SW). Because the 'number' (64 bits floating numbers)
   *        are sensitive to the order of operation, the final result between the SW and the CPP are different.
   *        The CPP version is kept as a reference, as it produces a resultat 100% equals to the actual cpp code
   *        written by Dr. Alan Dorin.
   */
  private smooth(){
    // --- --- --- Constantes
    const smHalfWin:number = this.parameters.smoothingWindow; // [ HW | item | HW ]  "HW" stands for "Half Window"
    const smSize:number = 2*smHalfWin+1;                      // Size of the full windows: 2*HW + 1
    const length:number = this.rawCurve.length();             // Total length of the curve

    // --- --- --- Smoothing boundaries
    // 1  [0     <HW> Start[    // size HW. Put 0: can not compute average as we don't have enough previous points
    // 2  [Start      Stop[     // size length-2*HW. Do the smoothing
    // 3  [Stop  <HW> Length[   // size HW. Put 0: can not compute average as we don't habe enough next points
    // T e first smoothed item is at index "HW" and the last one is at index length-HW-1.
    const startSmIdx:number = smHalfWin;        // start, included
    const stopSmIdx:number = length-smHalfWin;  // stop, excluded

    // Do 1 and 3 (idx and idxBis), i.e. We can't compute a moving average over the first/last 'smWin' points
    for(let idx=0; idx < smHalfWin; ++idx){
      const idxBis = stopSmIdx + idx;
      this.set(idx, this.rawCurve.getWavelength(idx), 0, false, false);         // [0     ; HW[
      this.set(idxBis, this.rawCurve.getWavelength(idxBis), 0, false, false);   // [Stop  ; Length[
    }

    // Choose the method for the step 2
    if(this.doCppAlgo){
      this.smoothSW_CPP(startSmIdx, stopSmIdx, smHalfWin, smSize);
    } else {
      this.smoothImproved(startSmIdx, stopSmIdx, smHalfWin, smSize);
    }
  }

  /** Smoothing step 2 with a sliding window, the method inherited from the CPP code. */
  private smoothSW_CPP(startSmIdx:number, stopSmIdx:number, smHalfWin:number, smSize:number){
    // Do 2 with sliding window (little modification of the result...)
    for(let idx=startSmIdx; idx<stopSmIdx; ++idx){
      let count = 0;
      for(let idx2 = idx-smHalfWin; idx2 <= idx+smHalfWin; ++idx2){
        count += this.rawCurve.getReflectance(idx2);
      }
      let average = count/smSize;
      this.set(idx, this.rawCurve.getWavelength(idx), average, false, false);
    }
  }

  /** Smoothing step 2 with an improved methods. */
  private smoothImproved(startSmIdx:number, stopSmIdx:number, smHalfWin:number, smSize:number){
    // Do 2
    // Instead of having a sliding windows, we maintain a count of the sum over the smoothing region.
    // When sliding forward, we substract the item leaving the region, and add the one entering it.

    // Initial count and step, centered over "starSmdx": [0 ..<HW>.. Start ..<HW>.. Start + HW]
    // So we range over :                                [0 ; HW*2+1 == smoothing_size[
    let count:number = 0;
    for(let idx=0; idx<smSize; ++idx){ count += this.rawCurve.getReflectance(idx); }
    this.set(startSmIdx, this.rawCurve.getWavelength(startSmIdx), count/smSize, false, false);

    // "Sliding windows", starting at start_smooth +1, centered around idx
    // |idx - (HW + 1 )| [idx - HW ... idx ... idx + HW]
    // ----------------  ===================   +++++++++    // '-': remove   '=': keep   '+': add
    for(let idx = startSmIdx+1; idx < stopSmIdx; ++idx){
      // To be removed: the item leaving the smoothing region:
      const remove:number = this.rawCurve.getReflectance(idx - (smHalfWin+1));
      // To be added: the item entering the smoothing region:
      const add:number = this.rawCurve.getReflectance(idx + smHalfWin); // idx < stop=length-HW  so  idx+HW < length
      count = count - remove + add;
      // Remember to devide by smoothing size!
      this.set(idx, this.rawCurve.getWavelength(idx), count/smSize, false, false);
    }
  }


  // --- --- --- --- --- --- --- --- --- --- --- --- --- ---
  // Marking: mark a point on the curve

  /** Marking: Monotonicity Detection.
   * We do a lookahead to assist in deciding if a curve is continuing to rise or fall regardless
   * of small-scale noise in the data.
   * NOTE: All the operations are based on the smoothed curve.
   *       ** DO NOT USE BEFORE SMOOTHING **
   */
  private markCurveMonotonicallyIncreasingOrDecreasing(){
    // --- --- --- Constantes:
    enum SD{ SRising, SFalling };                         // Enum type for Slop Direction
    const laWin:number = this.parameters.lookahead;       // LookAhead window [item | LA]. Lookahead of 1 = 2 items
    const laSize:number = laWin+1;                        // Size of the lookahead: 1+LA   The current point + LA
    const length:number = this.smoothedCurve.length;      // Total length of the curve

    // --- --- --- LookAhead Boundaries:
    // We look at slopes with index [slopeBegining, slopeEnd].
    // Initially, slopeBeg = 0 and slopeEnd = 1 (we need at least two points). Then we move slopeEnd as far as we can.
    // This means that the lookahead is done on [slopeEnd | LA] with slopeEnd+LA<length, so slopeEnd<length-LA = stopIdx
    const stopIdx:number = length - laWin;  // EXCLUDED last index observed so we have enough lookahead items

    // --- --- --- Monotonicity detection
    let slopeBegining:number = 0;           // Begining of the slope
    let slopDirection:SD = SD.SRising;      // By default we say that the slope is rising

    // --- --- --- Initial lookAhead count [0 ... LA]
    // Note: in the next for loop, we will first look at [1 ... LA+1], ie we will remove [0] and add [LA+1]
    let laCount:number = 0;
    for(let idx=0; idx < laSize; ++idx){ laCount += this.smoothedCurve[idx].reflectance; }

    // --- --- --- Move the end of the slope as far as possible.
    // Maintain a sliding windows for the lookahead.
    for(let slopeEnd:number=1; slopeEnd < stopIdx; ++slopeEnd) {

      // --- Compute the average: "forward mean smoothed reflectance"
      // |item -1| [item ...lookahead... item + LA]
      // --------- ===================== ++++++++++   // '-': remove   '=': keep   '+': add
      // Removal of the item at the very first iteration: see the "Initial lookAhead" note above
      const remove:number = this.smoothedCurve[slopeEnd-1].reflectance;
      const add:number = this.smoothedCurve[slopeEnd+laWin].reflectance; // slopeEnd < length-LA  so  slopeEnd+LA < length
      laCount = laCount - remove + add;
      const average:number = laCount/laSize;

      // --- Compute the direction: if the current point is "higher" than the lookahead average, we are falling.
      // Else, we are rising (and in the unlikely "equal" case, we are still rising...)
      const endValue:number = this.smoothedCurve[slopeEnd].reflectance;
      const endDir:SD = (endValue > average)? SD.SFalling: SD.SRising;

      // --- Decision about the curve: changing direction or last step
      if( endDir !== slopDirection || slopeEnd == stopIdx-1) {
        // We have a change (or we are at the end): mark the slope's sections meeting the gradient criterion.
        this.markSlopeMeetsGradientCriterionNoSubsegmentThreshold(slopeBegining, slopeEnd);
        // --- Prepare for next iteration. Guard needed else we can have out of bound access on this.smoothedCurve
        if(slopeEnd != stopIdx-1){
          slopeBegining = slopeEnd+1;     // New slop start after the end of current slope
          slopeEnd      = slopeEnd+1;     // The for loop increment this, so will put us at slopeEnd+2
          // WARNING: Keep the LookAhead count in sync!!
          const remove:number = this.smoothedCurve[slopeEnd-1].reflectance;
          const add:number = this.smoothedCurve[slopeEnd+laWin].reflectance; // slopeEnd < length-LA  so  slopeEnd+LA < length
          laCount = laCount - remove + add;
          slopDirection = endDir;       // reverse slope direction (as they were different, last step does not matter)
        }
      } // End IF break monotony
    } // END for(slop end...)
  } // END public markCurveMonotonicallyIncreasingOrDecreasing


  // --- Marking the slope [slopBegining, slopeEnd]
  // Check if there are one or more sections that meet the gradient criterion. If there are:
  // - Mark them as "true" for meeting the gradient threshold.
  // - Otherwise, mark them as "false".
  // - Set flags indicating any marker points within the valid gradient ranges.
  private markSlopeMeetsGradientCriterionNoSubsegmentThreshold(slopeBegining:number, slopeEnd:number){
    console.assert(slopeBegining < slopeEnd);

    // --- --- --- Constantes
    const MinVRange:number = this.parameters.amplitude;
    const MaxHRange:number = this.parameters.range;
    const MinGradient:number = MinVRange/MaxHRange;

    // --- --- --- Overall checking
    const fullVRange:number = Math.abs(this.smoothedCurve[slopeEnd].reflectance - this.smoothedCurve[slopeBegining].reflectance);
    // const fullHRange:number = this.smoothedCurve[slopeEnd].wavelength - this.smoothedCurve[slopeBegining].wavelength;
    // Vertical range: we do not need to go further if it is too small.
    // Else, the vertical range matches and, if the full slope is steep enough, mark it
    if( fullVRange < MinVRange ){ return ;}

    // --- --- --- Search if we have a **slope section** that matches the criterion (is steep enough)
    // We need at least two item, so we stop the "begining of the sub slope search" before slopeEnd
    // Possible optimization: sliding window based on the Vrange instead of a fixed size.
    for(let subBeg = slopeBegining; subBeg<slopeEnd; ++subBeg){
      for(let subEnd = subBeg+1; subEnd <= slopeEnd; ++subEnd){    // slopeEnd included!
        const VRange:number = Math.abs(this.smoothedCurve[subEnd].reflectance - this.smoothedCurve[subBeg].reflectance);
        // Check for valid vertical range
        if(VRange >= MinVRange){
          const HRange:number = this.smoothedCurve[subEnd].wavelength - this.smoothedCurve[subBeg].wavelength;
          const gradient:number = (HRange == 0)?0:VRange/HRange;
          // Check for valid gradient. Then mark the WHOLE slope
          if(gradient >= MinGradient){
            this.markSlopeMeetsRangeThresholds(slopeBegining, slopeEnd, true);  // Mark the full slope
            this.markCentreMostPoint(slopeBegining, slopeEnd);                  // Mark the center point
            return;
          } // Else, the current subslope is not steep enough given an already valid VRange: skip to the next point
          else { break; }
        } // End if VRange
      } // End For
    } // End For
  }


  // --- Mark the curve [start, stop] with a boolean the portion of the slope that matches the criterion
  private markSlopeMeetsRangeThresholds(start:number, stop:number, markValue:boolean){
    for(let idx = start; idx <= stop; ++ idx){ this.smoothedCurve[idx].monotonicChange = markValue; }
  }


  // --- Mark the point closest to the vertical mid-point in a region [start, stop]
  private markCentreMostPoint(slopeBegining:number, slopeEnd:number){
    // --- --- --- Constantes:
    const begR:number = this.smoothedCurve[slopeBegining].reflectance;
    const endR:number = this.smoothedCurve[slopeEnd].reflectance;
    const midHeight:number = (begR + endR)/2;

    // --- --- --- Initial state
    let closestDistance:number = Number.POSITIVE_INFINITY;
    let closestStep:number = 0;

    // --- --- --- Find the step the closest to the vertical mid-point
    // Could be optimized too (dichotomic search, early abandoning) but our data are small enough, so keep this simple.
    for(let idx:number=slopeBegining; idx <= slopeEnd; ++idx){
      let midHeightDelta:number = Math.abs(this.smoothedCurve[idx].reflectance - midHeight);
      if(midHeightDelta < closestDistance){
        closestDistance = midHeightDelta;
        closestStep = idx;
      }
    }

    // --- --- --- Mark the curve
    if(closestDistance != Number.POSITIVE_INFINITY){ this.smoothedCurve[closestStep].markerPoint = true; }
  }


  // --- --- --- Public Methods

  /** Configurable printing of a curve point
   *  Point index, Wavelength, raw reflectance, smoothed reflectance, monotonic changes, marker point
   */
  public output(idx:number, doWL:boolean, doRaw:boolean, doSmooth:boolean, doChange:boolean, doMarker:boolean):string {

    let res:string="";
    let doComma = false;

    if(doWL){
      res += this.smoothedCurve[idx].wavelength.toFixed(20);
      doComma = true;
    }

    if(doRaw){
      if(doComma){ res += ','; }
      res += this.rawCurve.getReflectance(idx).toFixed(20);
      doComma = true;
    }

    if(doSmooth){
      if(doComma){ res += ','; }
      res += this.smoothedCurve[idx].reflectance.toFixed(20);
      doComma = true;
    }

    if(doChange){
      if(doComma){ res += ','; }
      if(this.smoothedCurve[idx].monotonicChange){ res += this.smoothedCurve[idx].reflectance.toFixed(20); }
      doComma = true;
    }

    if(doMarker){
      if(doComma){ res += ','; }
      if(this.smoothedCurve[idx].markerPoint){ res += this.smoothedCurve[idx].reflectance.toFixed(20); }
      doComma = true;
    }

    return res;
  }

  /** Detailed output, matching the CPP format */
  public outputDetailedCurveCPP():string{
    let res:string = "";
    for(let idx=0; idx < this.smoothedCurve.length; ++idx ){
      if(this.smoothedCurve[idx].wavelength >= 300.0 && this.smoothedCurve[idx].wavelength <= 701.0){
        res += "\n"
        res += this.output(idx, true, true, true, true, true);
      }
    }
    return res;
  }

  /** Get the list of marker points */
  public getListOfMarker(start:number, end:number): Array<number>{
    const res = new Array();
    for(let idx=0; idx < this.smoothedCurve.length; ++idx ){
      if(this.smoothedCurve[idx].markerPoint && this.smoothedCurve[idx].wavelength >= start && this.smoothedCurve[idx].wavelength <= end+1){
        res.push(this.smoothedCurve[idx].wavelength);
      }
    }
    return res;
  }
}


// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Main usable class
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

/** Simple wrapper class based on CurveData and CurveMarker.
 * This class is mainly a convenience class for building CurveMarker with different parameters.
 * The CurveMarker class can be used directly if needed.
 **/
export class Curve{

  // --- --- --- Fields
  name:string;
  rawCurve:CurveData;
  private markerResult:CurveMarker|null;

  // --- --- --- Constructor

  constructor(name:string, rawCurve:CurveData){
    this.name = name;
    this.rawCurve = rawCurve;
    this.markerResult = null;
  }

  // --- --- --- Public methods

  public analyse(param:CurveMarkerParameters):CurveMarker {
    if(this.markerResult === null){
      // Launch the analysis in the constructor
      this.markerResult = new CurveMarker(this.rawCurve, param)
    } else {
      // Analysis if needed
      this.markerResult.analyse(param)
    }
    return this.markerResult;
  }

  public getResult():Option<CurveMarker>{
    if(this.markerResult === null){
      return none;
    } else {
      return some(this.markerResult);
    }
  }
}

export function doBins(curves:Array<CurveMarker>, start:number, end:number, binWidth:number): Array<number> {
  const range:number = end-start
  const res:Array<number> = new Array<number>(Math.floor(range/binWidth)).fill(0);

  curves.forEach( (c)=>{
    c.smoothedCurve.forEach( (cp) => {
      if(cp.markerPoint && cp.wavelength>=start && cp.wavelength <= end){
        const idx = Math.floor((cp.wavelength - start)/binWidth);
        res[idx]++;
      }
    })
  });

  return res;
}






