import { useEffect, useRef } from "react";

export type VisualizerProps = {
  width: number;
  height: number;
  source: AudioNode | undefined;
  drawFrame(args: DrawFrameArgs): void;
};

export type DrawFrameArgs = {
  bufferLength: number;
  dataArray: Uint8Array;
  frameWidth: number;
  frameHeight: number;
  imageDataArray: Uint8ClampedArray;
};

export function Visualizer({
  width,
  height,
  source,
  drawFrame,
}: VisualizerProps) {
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

      drawFrame({
        bufferLength,
        dataArray,
        frameHeight: height,
        frameWidth: width,
        imageDataArray,
      });

      const current = new ImageData(imageDataArray, width, height);
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
