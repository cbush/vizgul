import { useEffect, useRef, useCallback, useState } from "react";
import { Slider } from "rsuite";
import { DrawFrameArgs, DrawFrameFunction } from "./Visualizer";
import { mix } from "./Color";

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
      for (let y = 0; y < height; ++y) {
        const index = frequencyData.length - Math.floor(y) - 1;
        const value = frequencyData[index];
        for (let x = 0; x < width; ++x) {
          if (maxIndex === index) {
            pixels.set(x, y, { r: 255, g: 255, b: 0, a: 255 });
          } else if (x / ((value / 255) * width) >= value / 255) {
            pixels.set(x, y, (c) =>
              mix(
                c,
                {
                  r: (value * (something / 100)) % 255,
                  g: value % 255,
                  b: (value * x * (something / 100)) % 255,
                  a: 255,
                },
                1
              )
            );
          } else {
            const nextPixel = lastFrame.get(
              Math.min(x + 1, width - 1),
              Math.floor(y + something * 0.1) % frequencyData.length
            );
            pixels.set(x, y, (c) => mix(nextPixel, c, 0));
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
