import { useState } from "react";
import { useFilePicker } from "use-file-picker";
import "./App.css";
import { useAudioSource } from "./useAudioSource";
import { useDecodedAudioBuffer } from "./useDecodedAudioBuffer";
import { Visualizer, DrawFrameArgs } from "./Visualizer";

const drawFrame = ({
  bufferLength,
  dataArray,
  frameWidth,
  imageDataArray,
}: DrawFrameArgs) => {
  for (let y = 0; y < bufferLength; ++y) {
    const value = dataArray[y];
    for (let x = 0; x < frameWidth / 2 + 1; ++x) {
      const pixelIndex = (y * frameWidth + x) * 4;
      imageDataArray[pixelIndex + 3] = 255;
      if (x === frameWidth / 2) {
        imageDataArray[pixelIndex + 2] = imageDataArray[pixelIndex + 1];
        imageDataArray[pixelIndex + 1] = imageDataArray[pixelIndex];
        imageDataArray[pixelIndex] = value;
      } else {
        const nextPixel = (y * frameWidth + x + 1) * 4;
        imageDataArray[pixelIndex] = imageDataArray[nextPixel];
        imageDataArray[pixelIndex + 1] = imageDataArray[nextPixel + 1];
        imageDataArray[pixelIndex + 2] = imageDataArray[nextPixel + 2];
      }
    }
    for (let x = frameWidth - 1; x > frameWidth / 2; --x) {
      const pixelIndex = (y * frameWidth + x) * 4;
      const nextPixel = (y * frameWidth + x - 1) * 4;
      imageDataArray[pixelIndex] = imageDataArray[nextPixel];
      imageDataArray[pixelIndex + 1] = imageDataArray[nextPixel + 1];
      imageDataArray[pixelIndex + 2] = imageDataArray[nextPixel + 2];
      imageDataArray[pixelIndex + 3] = 255;
    }
  }
};

const drawFrame2 = ({
  bufferLength,
  dataArray,
  frameWidth,
  imageDataArray,
}: DrawFrameArgs) => {
  for (let y = 0; y < bufferLength; ++y) {
    const value = dataArray[y];
    for (let x = 0; x < frameWidth / 2 + 1; ++x) {
      const pixelIndex = (y * frameWidth + x) * 4;
      imageDataArray[pixelIndex + 3] = 255;
      if (x === frameWidth / 2) {
        imageDataArray[pixelIndex + 2] = imageDataArray[pixelIndex + 1];
        imageDataArray[pixelIndex + 1] = imageDataArray[pixelIndex];
        imageDataArray[pixelIndex] = value;
      } else {
        const nextPixel = (y * frameWidth + x + 1) * 4;
        const valueFactor = value * (x / frameWidth / 2) * 0.1;
        imageDataArray[pixelIndex] =
          imageDataArray[nextPixel] + valueFactor * 0.2;
        imageDataArray[pixelIndex + 1] =
          imageDataArray[nextPixel + 1] + valueFactor * 0.4;
        imageDataArray[pixelIndex + 2] =
          imageDataArray[nextPixel + 2] + valueFactor;
      }
    }
    for (let x = frameWidth - 1; x > frameWidth / 2; --x) {
      const pixelIndex = (y * frameWidth + x) * 4;
      const nextPixel = (y * frameWidth + x - 1) * 4;
      const valueFactor = value * (x / frameWidth / 2) * 0.1;
      imageDataArray[pixelIndex] = imageDataArray[nextPixel] + valueFactor;
      imageDataArray[pixelIndex + 1] =
        imageDataArray[nextPixel + 1] + valueFactor;
      imageDataArray[pixelIndex + 2] =
        imageDataArray[nextPixel + 2] + valueFactor / 2;
      imageDataArray[pixelIndex + 3] = 255;
    }
  }
};

function Player({ buffer }: { buffer: ArrayBuffer | undefined }) {
  const WIDTH = 288 * 2;
  const HEIGHT = 512 * 2;
  const [audioContext] = useState(new AudioContext());

  const audioBuffer = useDecodedAudioBuffer({ buffer, audioContext });

  const [play, setPlay] = useState(false);
  const [frameMode, setFrameMode] = useState(false);

  const source = useAudioSource({
    buffer: audioBuffer,
    context: audioContext,
    play,
  });

  return (
    <>
      <button onClick={() => setPlay(!play)}>{play ? "Stop" : "Play"}</button>
      <button onClick={() => setFrameMode(!frameMode)}>
        {frameMode ? "Frame Mode 2" : "Frame Mode 2"}
      </button>
      <br />
      <Visualizer
        width={WIDTH}
        height={HEIGHT}
        source={source}
        drawFrame={frameMode ? drawFrame2 : drawFrame}
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
