import { useRef, useState } from "react";
import { useFilePicker } from "use-file-picker";
import "./App.css";
import { useAudioSource } from "./useAudioSource";
import { useDecodedAudioBuffer } from "./useDecodedAudioBuffer";
import { Visualizer } from "./Visualizer";
import { Recorder } from "./Recorder";
import { useDrawFrameController } from "./DrawFrameController";

function Player({ buffer }: { buffer: ArrayBuffer | undefined }) {
  const WIDTH = 576 / 4;
  const HEIGHT = 1024 / 4;
  const [audioContext] = useState(new AudioContext());

  const audioBuffer = useDecodedAudioBuffer({ buffer, audioContext });

  const [play, setPlay] = useState(false);
  const [frameMode, setFrameMode] = useState(false);
  const [saveRecordings, setSaveRecordings] = useState(false);
  const [mirror, setMirror] = useState(false);

  const source = useAudioSource({
    buffer: audioBuffer,
    context: audioContext,
    play,
  });

  const { controller, drawFrame } = useDrawFrameController();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  return (
    <div className="Player">
      <Visualizer
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        source={source}
        drawFrame={frameMode ? drawFrame : drawFrame}
        mirror={mirror}
      />
      {source && canvasRef.current && (
        <Recorder
          canvas={canvasRef.current}
          context={audioContext}
          isRecording={play && saveRecordings}
          onRecordingStopped={(url) => {
            if (!saveRecordings) {
              return;
            }
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
        <label>
          <input
            type="checkbox"
            checked={saveRecordings}
            onChange={() => setSaveRecordings(!saveRecordings)}
          />
          Save Recordings
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={mirror}
            onChange={() => setMirror(!mirror)}
          />
          Mirror
        </label>
        <br />

        {controller}
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
