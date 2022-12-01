import { useEffect, useRef, useState } from "react";
import { Slider } from "rsuite";
import { DrawFrameArgs, DrawFrameFunction } from "./Visualizer";

export function useDrawFrameController() {
  const drawFrameRef = useRef<DrawFrameFunction>((args) => {});
  const [something, setSomething] = useState(0);

  useEffect(() => {
    const drawFrame = ({
      frequencyData,
      width,
      pixels,
      lastFrame,
    }: DrawFrameArgs) => {
      for (let y = 0; y < frequencyData.length; ++y) {
        const value = frequencyData[frequencyData.length - y - 1];
        for (let x = 0; x < width; ++x) {
          if (x / width > value / 255) {
            pixels.set(x, y, {
              r: (value * x * 0.02) % 255,
              g: (value * x * 0.01) % 255,
              b: (value * x * (something / 255)) % 255,
              a: 255,
            });
          } else {
            const nextPixel = lastFrame.get(
              Math.min(x + 1, width - 1),
              Math.floor(y + something) % frequencyData.length
            );
            const valueFactor = value * (x / width / 2 - 0.5);
            pixels.set(x, y, (c) => ({ ...c, r: nextPixel.r }));
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
    drawFrame: (args: DrawFrameArgs) => {
      drawFrameRef.current(args);
    },
    controller,
  };
}
