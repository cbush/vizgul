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
      const scanlineFactor =
        Math.log2(frequencyData.length) / Math.log2(height / 2);
      const logIndex = (() => {
        const cache: Record<number, number> = {};
        return (i: number): number => {
          if (cache[i] !== undefined) {
            return cache[i];
          }
          if (i === 0) {
            cache[i] = 0;
            return 0;
          }

          const iNormalized = i / height;
          const desiredBucketsPerScanline = Math.pow(
            iNormalized * scanlineFactor,
            6
          );
          const result = logIndex(i - 1) + desiredBucketsPerScanline;
          cache[i] = result;
          return result;
        };
      })();
      const logIndexSubarray = (data: Uint8Array, i: number) => {
        const from = Math.round(logIndex(i));
        const to = Math.round(logIndex(i + 1));
        return data.subarray(from, to + (to === from ? 1 : 0));
      };

      for (let i = 0; i < height; ++i) {
        const y = height - i - 1;
        const subarray = logIndexSubarray(
          frequencyData,
          // It seems the first half of the frequencies are useless
          Math.floor(i * 0.6) + height / 2
        );
        const value =
          subarray.reduce((acc, cur) => acc + cur, 0) / (subarray.length / 3);
        for (let x = 0; x < width; ++x) {
          if (x / width >= value / (256 * 3)) {
            pixels.set(x, y, {
              r: clamp(value - 256, 0, 255),
              g: clamp(value, 0, 255),
              b: clamp(value - 256 * 2, 0, 255),
              a: 255,
            });
          } else {
            const nextPixel = lastFrame.get(
              clamp(Math.floor(x + width * 0.05), 0, width - 1),
              (y + 1) % height
            );
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
