import { useEffect, useRef } from "react";

export type VisualizerProps = {
  width: number;
  height: number;
  source: AudioNode | undefined;
};

export function Visualizer({ width, height, source }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const imageDataArray = new Uint8ClampedArray(width * height * 4);
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("no canvas");
      return;
    }
    const canvasContext = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    let done = false;

    function draw() {
      if (done || !canvasRef.current || !canvasContext) {
        console.log("done drawing");
        return;
      }

      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      for (let y = 0; y < bufferLength; ++y) {
        const value = dataArray[y];
        for (let x = 0; x < width / 2 + 1; ++x) {
          const pixelIndex = (y * width + x) * 4;
          imageDataArray[pixelIndex + 3] = 255;
          if (x === width / 2) {
            imageDataArray[pixelIndex + 2] = imageDataArray[pixelIndex + 1];
            imageDataArray[pixelIndex + 1] = imageDataArray[pixelIndex];
            imageDataArray[pixelIndex] = value;
          } else {
            const nextPixel = (y * width + x + 1) * 4;
            imageDataArray[pixelIndex] = imageDataArray[nextPixel];
            imageDataArray[pixelIndex + 1] = imageDataArray[nextPixel + 1];
            imageDataArray[pixelIndex + 2] = imageDataArray[nextPixel + 2];
          }
        }
        for (let x = width - 1; x > width / 2; --x) {
          const pixelIndex = (y * width + x) * 4;
          const nextPixel = (y * width + x - 1) * 4;
          imageDataArray[pixelIndex] = imageDataArray[nextPixel];
          imageDataArray[pixelIndex + 1] = imageDataArray[nextPixel + 1];
          imageDataArray[pixelIndex + 2] = imageDataArray[nextPixel + 2];
          imageDataArray[pixelIndex + 3] = 255;
        }
      }

      const current = new ImageData(imageDataArray, width, height);
      canvasContext.putImageData(current, 0, 0);
    }
    draw();

    return () => {
      done = true;
      console.log("wiring down");
    };
  }, [width, height, source]);

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
