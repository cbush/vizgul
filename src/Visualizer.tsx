import { forwardRef, useEffect } from "react";
import { MutableRaster, Raster } from "./Raster";
import { useForwardedRef } from "./useForwardedRef";
import { EXPECTED_FFT_SIZE } from "./frequencyAnalysis";

export type VisualizerProps = {
  width: number;
  height: number;
  source: AudioNode | undefined;
  drawFrame: DrawFrameFunction;
  mirror?: boolean;
};

export type DrawFrameArgs = {
  width: number;
  height: number;

  /**
    FFT frequency analysis data for the current frame.
   */
  frequencyData: Uint8Array;

  /**
    Waveform data for the current frame.
   */
  waveformData: Uint8Array;

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
  ({ width, height, source, drawFrame, mirror = true }, ref) => {
    const canvasWidth = 720;
    const canvasHeight = 1280;
    const canvasRef = useForwardedRef<HTMLCanvasElement>(ref);

    useEffect(() => {
      if (!source) {
        console.log("no source");
        return;
      }
      const analyser = source.context.createAnalyser();
      analyser.fftSize = EXPECTED_FFT_SIZE;
      source.connect(analyser);

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const waveformData = new Uint8Array(analyser.fftSize);
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log("no canvas");
        return;
      }
      const canvasContext = canvas.getContext("2d", {
        willReadFrequently: false,
      });

      let done = false;

      const frames = [
        new MutableRaster(width, height),
        new MutableRaster(width, height),
      ];
      let frameFlop = true;
      const current = new ImageData(width, height);

      const offscreenCanvas = new OffscreenCanvas(width, height);
      const offscreenCanvasContext = offscreenCanvas.getContext(
        "2d"
      ) as OffscreenCanvasRenderingContext2D;
      if (!offscreenCanvasContext) {
        console.log("no offscreen canvas");
        return;
      }
      function draw() {
        if (
          done ||
          !canvasRef.current ||
          !canvasContext ||
          !offscreenCanvasContext
        ) {
          return;
        }

        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(waveformData);

        frameFlop = !frameFlop;

        const pixels = frames[frameFlop ? 0 : 1];
        drawFrame({
          frequencyData,
          waveformData,
          width,
          height,
          lastFrame: frames[frameFlop ? 1 : 0],
          pixels,
        });

        current.data.set(pixels.data);
        offscreenCanvasContext.putImageData(current, 0, 0);
        canvasContext.clearRect(0, 0, width * 2, height * 2);

        const scaleX = canvasWidth / width;
        const scaleY = canvasHeight / height;
        canvasContext.resetTransform();
        if (!mirror) {
          canvasContext.scale(scaleX, scaleY);
          canvasContext.drawImage(offscreenCanvas, 0, 0);
        } else {
          const halfScaleX = scaleX / 2;
          const halfScaleY = scaleY / 2;
          canvasContext.scale(halfScaleX, halfScaleY);
          canvasContext.drawImage(offscreenCanvas, 0, 0);
          canvasContext.scale(1, -1);
          canvasContext.drawImage(offscreenCanvas, 0, height * -2);
          canvasContext.scale(-1, -1);
          canvasContext.drawImage(offscreenCanvas, width * -2, 0);
          canvasContext.scale(1, -1);
          canvasContext.drawImage(offscreenCanvas, width * -2, height * -2);
        }
      }
      draw();

      return () => {
        done = true;
      };
    }, [width, height, source, drawFrame, canvasRef, mirror]);

    return (
      <canvas
        key="visualizer"
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
      />
    );
  }
);
