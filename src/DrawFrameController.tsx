import { useEffect, useRef, useState } from "react";
import { Slider } from "rsuite";
import { DrawFrameArgs, DrawFrameFunction } from "./Visualizer";
import { mix } from "./Color";

export function useDrawFrameController() {
  const drawFrameRef = useRef<DrawFrameFunction>((args) => {});
  const [something, setSomething] = useState(0);

  useEffect(() => {
    const drawFrame = ({
      frequencyData,
      waveformData,
      width,
      height,
      pixels,
      lastFrame,
    }: DrawFrameArgs) => {
      for (let y = 0; y < height; ++y) {
        const value = frequencyData[frequencyData.length - Math.floor(y) - 1];
        const amplitude = Math.floor(
          (waveformData[Math.floor(y * 2)] + 128) * (something / 100)
        );

        for (let x = 0; x < width; ++x) {
          if (x === amplitude) {
            pixels.set(x, y, { r: 5, g: 200, b: 244, a: 255 });
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
    drawFrame: (args: DrawFrameArgs) => {
      drawFrameRef.current(args);
    },
    controller,
  };
}
