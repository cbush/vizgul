import { forwardRef, useEffect } from "react";
import { MutableRaster, Raster } from "./Raster";
import { useForwardedRef } from "./useForwardedRef";

export type VisualizerProps = {
  width: number;
  height: number;
  source: AudioNode | undefined;
  drawFrame: DrawFrameFunction;
};

export type DrawFrameArgs = {
  width: number;
  height: number;

  /**
    FFT frequency analysis data for the current frame.
   */
  frequencyData: Uint8Array;

  /**
    Previous frame's image data.
   */
  lastFrame: Raster;

  /**
    The pixel data to write into.
   */
  pixels: MutableRaster;
};

export type DrawFrameFunction = (args: DrawFrameArgs) => void;

export const Visualizer = forwardRef<HTMLCanvasElement, VisualizerProps>(
  ({ width, height, source, drawFrame }, ref) => {
    const canvasRef = useForwardedRef<HTMLCanvasElement>(ref);

    useEffect(() => {
      console.log("entry");
      if (!source) {
        console.log("no source");
        return;
      }
      console.log("wiring up");
      const analyser = source.context.createAnalyser();
      analyser.fftSize = height * 2;
      source.connect(analyser);

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const pixels = new MutableRaster(width, height);
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log("no canvas");
        return;
      }
      const canvasContext = canvas.getContext("2d", {
        willReadFrequently: false,
      });
      canvasContext?.clearRect(0, 0, width, height);
      let done = false;

      const frames = [
        new MutableRaster(width, height),
        new MutableRaster(width, height),
      ];
      let frameFlop = true;
      const current = new ImageData(width, height);

      function draw() {
        if (done || !canvasRef.current || !canvasContext) {
          console.log("done drawing");
          return;
        }

        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(frequencyData);

        frameFlop = !frameFlop;

        const pixels = frames[frameFlop ? 0 : 1];
        drawFrame({
          frequencyData,
          width,
          height,
          lastFrame: frames[frameFlop ? 1 : 0],
          pixels,
        });

        current.data.set(pixels.data);
        canvasContext.putImageData(current, 0, 0);
      }
      draw();

      return () => {
        done = true;
        console.log("wiring down");
      };
    }, [width, height, source, drawFrame, canvasRef]);

    return <canvas ref={canvasRef} width={width} height={height} />;
  }
);
