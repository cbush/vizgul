import { useRef, useState } from "react";
import { useFilePicker } from "use-file-picker";
import "./App.css";
import { useAudioSource } from "./useAudioSource";
import { useDecodedAudioBuffer } from "./useDecodedAudioBuffer";
import { Visualizer, DrawFrameArgs } from "./Visualizer";
import { Recorder } from "./Recorder";

const drawFrame = ({
  frequencyData,
  width,
  pixels,
  lastFrame,
}: DrawFrameArgs) => {
  for (let y = 0; y < frequencyData.length / 2; ++y) {
    const value = frequencyData[y];
    for (let x = 0; x < width; ++x) {
      if (x === width / 2) {
        pixels.set(x, y, { r: value, g: value, b: 0, a: 255 });
        pixels.set(x, frequencyData.length - y - 1, {
          r: value,
          g: value,
          b: 0,
          a: 255,
        });
      } else {
        const nextPixel = lastFrame.get(x + (x > width / 2 ? -1 : 1), y + 1);

        const valueFactor = value * (x / width / 2 - 0.5) * 0.06;
        pixels.set(x, y, nextPixel.rotate(valueFactor));
        pixels.set(
          x,
          frequencyData.length - y - 1,
          nextPixel.rotate(valueFactor)
        );
      }
    }
  }
};

function Player({ buffer }: { buffer: ArrayBuffer | undefined }) {
  const WIDTH = 576 / 4;
  const HEIGHT = 1024 / 4;
  const [audioContext] = useState(new AudioContext());

  const audioBuffer = useDecodedAudioBuffer({ buffer, audioContext });

  const [play, setPlay] = useState(false);
  const [frameMode, setFrameMode] = useState(false);

  const source = useAudioSource({
    buffer: audioBuffer,
    context: audioContext,
    play,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  return (
    <div className="Player">
      <Visualizer
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        source={source}
        drawFrame={frameMode ? drawFrame : drawFrame}
      />
      {source && canvasRef.current && (
        <Recorder
          canvas={canvasRef.current}
          context={audioContext}
          isRecording={play}
          onRecordingStopped={(url) => {
            const a = document.createElement("a");
            a.setAttribute("style", "display: none;");
            a.href = url;
            a.download = "video.webm";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
            }, 0);
          }}
          source={source}
        />
      )}
      <div className="controlPanel">
        <button onClick={() => setPlay(!play)}>{play ? "Stop" : "Play"}</button>
        <button onClick={() => setFrameMode(!frameMode)}>
          {frameMode ? "Frame Mode 2" : "Frame Mode 1"}
        </button>
      </div>
    </div>
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
        <Player
          key="player"
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
