import { useState, useEffect, useRef } from "react";
import { useFilePicker } from "use-file-picker";
import "./App.css";

const useDecodedAudioBuffer = ({
  buffer,
  audioContext,
}: {
  buffer: ArrayBuffer | undefined;
  audioContext: AudioContext;
}) => {
  const [decodedData, setDecodedData] = useState<AudioBuffer | undefined>(
    undefined
  );
  useEffect(() => {
    let tornDown = false;
    if (!buffer || buffer.byteLength === 0) {
      setDecodedData(undefined);
      return;
    }
    audioContext.decodeAudioData(buffer).then((newDecodedData) => {
      if (tornDown) {
        return;
      }
      setDecodedData(newDecodedData);
    });
    return () => {
      tornDown = true;
    };
  }, [buffer, audioContext, setDecodedData]);
  return decodedData;
};

function Visualizer({ buffer }: { buffer: ArrayBuffer | undefined }) {
  const WIDTH = 200;
  const HEIGHT = 200;
  const [audioContext] = useState(new AudioContext());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioBuffer = useDecodedAudioBuffer({ buffer, audioContext });

  useEffect(() => {
    if (!audioBuffer) {
      return;
    }
    const source = audioContext.createBufferSource();
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    source.buffer = audioBuffer;
    source.start();

    const canvas = canvasRef.current;
    const canvasContext = canvas?.getContext("2d");

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    function draw() {
      if (!canvasContext) {
        return;
      }
      const drawVisual = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasContext.fillStyle = "rgb(0, 0, 0)";
      canvasContext.fillRect(0, 0, WIDTH, HEIGHT);
      const barWidth = (WIDTH / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        canvasContext.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    }
    draw();
  }, [audioBuffer, audioContext]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{ border: "1px solid #d3d3d3" }}
    />
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
