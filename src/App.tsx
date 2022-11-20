import { useState, useEffect, useRef } from "react";
import { useFilePicker } from "use-file-picker";
import "./App.css";
import { useAudioSource } from "./useAudioSource";
import { useDecodedAudioBuffer } from "./useDecodedAudioBuffer";

function Visualizer({ buffer }: { buffer: ArrayBuffer | undefined }) {
  const WIDTH = 288 * 2;
  const HEIGHT = 512 * 2;
  const [audioContext] = useState(new AudioContext());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioBuffer = useDecodedAudioBuffer({ buffer, audioContext });

  const [play, setPlay] = useState(false);

  const source = useAudioSource({
    buffer: audioBuffer,
    context: audioContext,
    play,
  });

  useEffect(() => {
    console.log("entry");
    if (!source) {
      console.log("no source");
      return;
    }
    console.log("wiring up");
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = HEIGHT * 2;
    source.connect(analyser);
    source.connect(audioContext.destination);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const imageDataArray = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
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
        for (let x = 0; x < WIDTH / 2 + 1; ++x) {
          const pixelIndex = (y * WIDTH + x) * 4;
          imageDataArray[pixelIndex + 3] = 255;
          if (x === WIDTH / 2) {
            imageDataArray[pixelIndex + 2] = imageDataArray[pixelIndex + 1];
            imageDataArray[pixelIndex + 1] = imageDataArray[pixelIndex];
            imageDataArray[pixelIndex] = value;
          } else {
            const nextPixel = (y * WIDTH + x + 1) * 4;
            imageDataArray[pixelIndex] = imageDataArray[nextPixel];
            imageDataArray[pixelIndex + 1] = imageDataArray[nextPixel + 1];
            imageDataArray[pixelIndex + 2] = imageDataArray[nextPixel + 2];
          }
        }
        for (let x = WIDTH - 1; x > WIDTH / 2; --x) {
          const pixelIndex = (y * WIDTH + x) * 4;
          const nextPixel = (y * WIDTH + x - 1) * 4;
          imageDataArray[pixelIndex] = imageDataArray[nextPixel];
          imageDataArray[pixelIndex + 1] = imageDataArray[nextPixel + 1];
          imageDataArray[pixelIndex + 2] = imageDataArray[nextPixel + 2];
          imageDataArray[pixelIndex + 3] = 255;
        }
      }

      const current = new ImageData(imageDataArray, WIDTH, HEIGHT);
      canvasContext.putImageData(current, 0, 0);
    }
    draw();

    return () => {
      done = true;
      console.log("wiring down");
    };
  }, [HEIGHT, WIDTH, audioContext, source]);

  /*
    // Recording
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    analyser.connect(mediaStreamDestination);
    const captureStream = canvas.captureStream(30);
    captureStream.addTrack(mediaStreamDestination.stream.getAudioTracks()[0]);
    const mediaRecorder = new MediaRecorder(captureStream, {
      mimeType: "video/webm; codecs=h264",
    });
    const chunks: Blob[] = [];
    mediaRecorder.addEventListener("dataavailable", (event) => {
      chunks.push(event.data);
    });

    player.addEventListener("stopped", () => {
      mediaRecorder.stop();
      if (!canvasRef.current) {
        return;
      }

      const blob = new Blob(chunks, { type: "video/webm; codecs=h264" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("style", "display: none;");
      a.href = url;
      a.download = "video.webm";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);
    });

    mediaRecorder.start(500);

    // Testing without wiring up a stop button
    setTimeout(() => {
      player.stop();
    }, 10000);
    */

  return (
    <>
      <button onClick={() => setPlay(!play)}>{play ? "Stop" : "Play"}</button>
      <br />
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          border: "1px solid #d3d3d3",
          height: "720px",
          imageRendering: "pixelated",
        }}
      />
    </>
  );
}

function App() {
  const [openFileSelector, { filesContent, loading, errors }] = useFilePicker({
    multiple: false,
    accept: "audio/*",
    readAs: "ArrayBuffer",
    readFilesContent: true,
  });

  const [canCreateAudioContext, setCanCreateAudioContext] = useState(false);

  if (errors.length) {
    return (
      <div>
        <button onClick={() => openFileSelector()}>
          Something went wrong, retry!
        </button>
        {errors[0].fileSizeTooSmall && "File size is too small!"}
        {errors[0].fileSizeToolarge && "File size is too large!"}
        {errors[0].readerError && "Problem occured while reading file!"}
        {errors[0].maxLimitExceeded && "Too many files"}
        {errors[0].minLimitNotReached && "Not enought files"}
      </div>
    );
  }

  return (
    <div className="App">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <button
          onClick={() => {
            setCanCreateAudioContext(true);
            openFileSelector();
          }}
        >
          Select files
        </button>
      )}
      <br />
      {canCreateAudioContext && (
        <Visualizer
          key="visualizer"
          buffer={
            filesContent[0] &&
            (filesContent[0].content as unknown as ArrayBuffer)
          }
        />
      )}
    </div>
  );
}

export default App;
