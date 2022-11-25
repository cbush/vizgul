import { forwardRef, useEffect, useRef } from "react";
import { useForwardedRef } from "./useForwardedRef";

export type VisualizerProps = {
  width: number;
  height: number;
  source: AudioNode | undefined;
  drawFrame(args: DrawFrameArgs): void;
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
  lastFrame: ImageData;

  /**
    The pixel data to write into.
   */
  pixels: Uint8ClampedArray;
};

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
      const pixels = new Uint8ClampedArray(width * height * 4);
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log("no canvas");
        return;
      }
      const canvasContext = canvas.getContext("2d", {
        willReadFrequently: true,
      });
      canvasContext?.clearRect(0, 0, width, height);
      let done = false;

      function draw() {
        if (done || !canvasRef.current || !canvasContext) {
          console.log("done drawing");
          return;
        }

        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(frequencyData);

        const lastFrame = canvasContext.getImageData(0, 0, width, height);
        drawFrame({
          frequencyData,
          width,
          height,
          lastFrame,
          pixels,
        });

        const current = new ImageData(pixels, width, height);
        canvasContext.putImageData(current, 0, 0);
      }
      draw();

      return () => {
        done = true;
        console.log("wiring down");
      };
    }, [width, height, source, drawFrame]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: "1px solid #d3d3d3",
          height: "720px",
          imageRendering: "pixelated",
        }}
      />
    );
  }
);
