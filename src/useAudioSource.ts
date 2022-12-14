import { useEffect, useRef, useState } from "react";

export type UseAudioSourceArgs = {
  buffer: AudioBuffer | undefined;
  context: AudioContext;

  /**
    Whether the source may play. Stops playback when set to false.
   */
  isEnabled: boolean;

  /**
    Whether to start the playback immediately upon load.
   */
  autoplay?: boolean;

  /**
    Called when the source playback ended.
   */
  onPlaybackEnded?(): void;
};

export const useAudioSource = ({
  buffer,
  context,
  isEnabled,
  onPlaybackEnded,
  autoplay = false,
}: UseAudioSourceArgs): AudioBufferSourceNode | undefined => {
  const [source, setSource] = useState<AudioBufferSourceNode | undefined>(
    undefined
  );

  useEffect(() => {
    const onEnded = () => {
      source?.disconnect();
      setSource(undefined);
      onPlaybackEnded && onPlaybackEnded();
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

    if (!buffer || !isEnabled) {
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
    setSource(newSource);
    return () => {
      stop();
    };
  }, [
    buffer,
    context,
    isEnabled,
    autoplay,
    source,
    onPlaybackEnded,
    setSource,
  ]);

  useAutoplay({ source, autoplay });

  return source;
};

function useAutoplay({
  source,
  autoplay,
}: {
  source: AudioBufferSourceNode | undefined;
  autoplay: boolean;
}) {
  const isStartedRef = useRef(false);
  useEffect(() => {
    if (autoplay && source && !isStartedRef.current) {
      // You may not want to autoplay if, say, recording, lest the recorder miss
      // the first few frames of playback while it's being set up.
      source.start();
      isStartedRef.current = true;
    } else if (!source) {
      isStartedRef.current = false;
    }
  }, [source, autoplay]);
}
