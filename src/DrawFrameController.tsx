import { useEffect, useRef, useCallback, useState } from "react";
import { Slider } from "rsuite";
import { DrawFrameArgs, DrawFrameFunction } from "./Visualizer";

import clamp from "clamp";
import {
  EXPECTED_FIRST_USEFUL_FFT_INDEX,
  FFT_BUCKET_FREQ_SIZE,
} from "./frequencyAnalysis";

export function useDrawFrameController() {
  const drawFrameRef = useRef<DrawFrameFunction>((args) => {});
  const [something, setSomething] = useState(0);

  // Don't actually re-render due to frame function change -- the visualizer
  // animation callback is already running every frame
  const drawFrame = useCallback((args: DrawFrameArgs) => {
    drawFrameRef.current(args);
  }, []);

  useEffect(() => {
    const drawFrame = ({
      frequencyData,
      width,
      height,
      pixels,
      lastFrame,
    }: DrawFrameArgs) => {
      const logIndex = (i: number): number => {
        if (i === 0) {
          return 0;
        }
        const iNormalized = i / height;
        const desiredBucketsPerScanline = Math.pow(
          iNormalized *
            (Math.log2(frequencyData.length / 2) / Math.log2(height)),
          6
        );
        return logIndex(i - 1) + desiredBucketsPerScanline;
      };
      const logIndexSubarray = (data: Uint8Array, i: number) => {
        const from = Math.round(logIndex(i));
        const to = Math.round(logIndex(i + 1));
        // console.log(`${i}, ${from}, ${to}, ${to - from}`);
        return data.subarray(from, to + (to === from ? 1 : 0));
      };

      for (let i = 0; i < height; ++i) {
        const y = height - i - 1;
        const subarray = logIndexSubarray(frequencyData, i);
        const value =
          subarray.reduce((acc, cur) => acc + cur, 0) / subarray.length;
        for (let x = 0; x < width; ++x) {
          if (x === width - 1) {
            pixels.set(x, y, {
              r: clamp(value - 256 * 2, 0, 255),
              g: clamp(value, 0, 255),
              b: clamp(value - 256, 0, 255),
              a: 255,
            });
          } else {
            const nextPixel = lastFrame.get(clamp(x + 1, 0, width - 1), y);
            pixels.set(x, y, nextPixel);
          }
        }
      }
    };
    drawFrameRef.current = drawFrame;
  }, [something]);

  const controller = (
    <div className="DrawFrameController">
      <Slider onChange={setSomething} value={something} />
    </div>
  );
  return {
    drawFrame,
    controller,
  };
}
