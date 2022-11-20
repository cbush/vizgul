import { useEffect, useState } from "react";

export type UsePlaybackArgs = {
  buffer: AudioBuffer | undefined;
  context: AudioContext;
  play: boolean;
};

export const useAudioSource = ({
  buffer,
  context,
  play,
}: UsePlaybackArgs): AudioBufferSourceNode | undefined => {
  const [source, setSource] = useState<AudioBufferSourceNode | undefined>(
    undefined
  );

  useEffect(() => {
    const onEnded = () => {
      source?.disconnect();
      setSource(undefined);
    };

    const stop = () => {
      if (!source) {
        return;
      }
      source.stop();
      source.disconnect();
      source.removeEventListener("ended", onEnded);
      setSource(undefined);
    };

    if (!buffer || !play) {
      stop();
      return;
    }

    if (source !== undefined) {
      return;
    }

    const newSource = context.createBufferSource();
    newSource.buffer = buffer;
    newSource.addEventListener("ended", onEnded);
    newSource.connect(context.destination);
    newSource.start();
    setSource(newSource);
    return () => {
      stop();
    };
  }, [buffer, context, play, source, setSource]);

  return source;
};
