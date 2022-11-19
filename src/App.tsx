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
  const WIDTH = 45;
  const HEIGHT = 80;
  const [audioContext] = useState(new AudioContext());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioBuffer = useDecodedAudioBuffer({ buffer, audioContext });

  useEffect(() => {
    if (!audioBuffer) {
      return;
    }
    const source = audioContext.createBufferSource();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    source.buffer = audioBuffer;
    source.start();

    const bufferLength = analyser.frequencyBinCount;
    console.log(bufferLength);
    const dataArray = new Uint8Array(bufferLength);
    const imageDataArray = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
    function draw() {
      const canvas = canvasRef.current;
      const canvasContext = canvas?.getContext("2d");
      if (!canvasContext) {
        return;
      }

      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      for (let y = 0; y < bufferLength; ++y) {
        const value = dataArray[y];
        for (let x = 0; x < WIDTH; ++x) {
          const pixelIndex = (y * WIDTH + x) * 4;
          imageDataArray[pixelIndex] = value;
          imageDataArray[pixelIndex + 3] = 255;
        }
      }

      canvasContext.putImageData(
        new ImageData(imageDataArray, WIDTH, HEIGHT),
        0,
        0
      );
    }
    draw();
    return () => {
      canvasRef.current = null;
    };
  }, [audioBuffer, audioContext]);

  return (
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
