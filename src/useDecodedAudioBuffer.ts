import { useState, useEffect } from "react";
import { EXPECTED_SAMPLERATE_HZ } from "./frequencyAnalysis";

export const useDecodedAudioBuffer = ({
  buffer,
  audioContext,
}: {
  buffer: ArrayBuffer | undefined;
  audioContext: AudioContext;
}): AudioBuffer | undefined => {
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
      if (newDecodedData.sampleRate !== EXPECTED_SAMPLERATE_HZ) {
        console.warn(
          `Unexpected sample rate of ${newDecodedData.sampleRate}. Things may not work properly.`
        );
      }
      setDecodedData(newDecodedData);
    });
    return () => {
      tornDown = true;
    };
  }, [buffer, audioContext, setDecodedData]);
  return decodedData;
};
