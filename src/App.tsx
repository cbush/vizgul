import { useState, useEffect, useRef } from "react";
import { useFilePicker, FileContent } from "use-file-picker";
import "./App.css";

const useAudio = ({
  fileContent,
}: {
  fileContent: FileContent | undefined;
}) => {
  useEffect(() => {
    if (fileContent === undefined) {
      return;
    }
    let tornDown = false;
    const buffer = fileContent.content as unknown as ArrayBuffer;
    const audioContext = new AudioContext();
    audioContext.decodeAudioData(buffer).then((decodedData) => {
      if (tornDown) {
        return;
      }
      const source = audioContext.createBufferSource();
      source.connect(audioContext.destination);
      source.buffer = decodedData;
      source.start();
    });
    return () => {
      tornDown = true;
    };
  }, [fileContent]);
};

function App() {
  const [openFileSelector, { filesContent, loading, errors }] = useFilePicker({
    multiple: false,
    accept: "audio/*",
    readAs: "ArrayBuffer",
    readFilesContent: true,
  });

  useAudio({ fileContent: filesContent[0] });

  if (loading) {
    return <p>Loading...</p>;
  }

  if (errors.length) {
    return (
      <div>
        <button onClick={() => openFileSelector()}>
          Something went wrong, retry!{" "}
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
      <button onClick={() => openFileSelector()}>Select files</button>
    </div>
  );
}

export default App;
