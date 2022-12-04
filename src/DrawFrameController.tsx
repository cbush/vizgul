import { useEffect, useRef, useCallback, useState } from "react";
import { Slider } from "rsuite";
import { DrawFrameArgs, DrawFrameFunction } from "./Visualizer";
import { mix } from "./Color";
import clamp from "clamp";
import {
  fftIndexToHz,
  EXPECTED_FIRST_USEFUL_FFT_INDEX,
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
      const [, maxIndex] = frequencyData.reduce(
        (acc, cur, i) => (cur > acc[0] ? [cur, i] : acc),
        [0, 0]
      );

      /*
      const frequency = fftIndexToHz(maxIndex);      
      console.log(
        noteInfoFromFrequency(frequency[0] + (frequency[1] - frequency[0]) / 2)
          .nameAndOctave
      );
      */

      const logIndex = (i: number) =>
        Math.floor(Math.pow(2, (i / height) * Math.log2(frequencyData.length)));

      const logIndexSubarray = (data: Uint8Array, i: number) => {
        const from = logIndex(i) + EXPECTED_FIRST_USEFUL_FFT_INDEX;
        const to = logIndex(i + 1) + EXPECTED_FIRST_USEFUL_FFT_INDEX;

        return data.subarray(from, from === to ? to + 1 : to);
      };

      for (let i = 0; i < height; ++i) {
        const y = height - i - 1;
        const subarray = logIndexSubarray(frequencyData, i);
        const value =
          subarray.reduce((acc, cur) => acc + cur, 0) / (subarray.length / 3);
        for (let x = 0; x < width; ++x) {
          if (x / ((value / (255 * 3)) * width) >= value / (255 * 3)) {
            pixels.set(x, y, {
              r: clamp(value, 0, 255),
              g: clamp(value - 255, 0, 255),
              b: clamp(value - 255 * 2, 0, 255),
              a: 255,
            });
          } else {
            const nextPixel = lastFrame.get(
              Math.min(x + 1, width - 1),
              Math.floor(y + something * 0.1) % height
            );
            pixels.set(x, y, (c) => mix(nextPixel, c, 0.4));
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
