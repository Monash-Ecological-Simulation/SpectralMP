import { Chart } from "chart.js";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Create a chart on a off screen canvas and export it as a blob
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

// Plugin: white background
const whiteBackgroundPlugin = {
  beforeDraw(chart: Chart) {
    const canvas = chart.canvas;
    const context = chart.ctx;
    if (context && canvas) {
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
};

interface Dimension {
  width: number;
  height: number;
}

export default class ChartRenderer {
  // --- --- --- Internal Fields
  private pixel_ratio: number;
  private dim: Dimension;
  private canvasWAtt: string;
  private canvasHAtt: string;
  private plugins: any;

  // --- --- --- Constructor
  constructor(pixel_ratio: number, width: number, height: number, isTransparent: boolean) {
    this.pixel_ratio = pixel_ratio;
    this.dim = { width: width, height: height };
    this.canvasWAtt = String(width / pixel_ratio);
    this.canvasHAtt = String(height / pixel_ratio);
    if (!isTransparent) {
      this.plugins = [whiteBackgroundPlugin];
    }
  }

  // --- --- --- Public methods
  public render = (chartConf: Chart.ChartConfiguration): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Create a new canvas
      const canvas = document.createElement("canvas");
      canvas.setAttribute("width", this.canvasWAtt);
      canvas.setAttribute("height", this.canvasHAtt);
      // Create a new chart on the canvas
      new Chart(canvas, {
        ...chartConf,
        plugins: this.plugins,
        options: {
          ...chartConf.options,
          devicePixelRatio: this.pixel_ratio,
          animation: {
            duration: 0,
            onComplete: (): void => {
              this.canvasToBlob(canvas, blob => {
                if (!blob) reject(new Error("Failed to convert canvas to blob"));
                else resolve(blob);
              });
            }
          },
          responsive: false
          // the "any" cast below is needed to support the "devicePixelRatio" option
          // see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24926
        } as any
      });
    });
  };

  // --- --- --- Private methods
  // Polyfill taken from https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
  private canvasToBlob = (
    canvas: HTMLCanvasElement,
    cback: (b: Blob | null) => void,
    type?: string,
    quality?: number
  ): void => {
    if (canvas.toBlob) {
      canvas.toBlob(cback, type, quality);
    } else {
      setTimeout(function() {
        var binStr = atob(canvas.toDataURL(type, quality).split(",")[1]),
          len = binStr.length,
          arr = new Uint8Array(len);

        for (var i = 0; i < len; i++) {
          arr[i] = binStr.charCodeAt(i);
        }

        cback(new Blob([arr], { type: type || "image/png" }));
      });
    }
  };
}
