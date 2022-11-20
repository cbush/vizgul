import { useEffect, useState } from "react";

export function AudioBufferPlayer(props: {
  context: AudioContext;
  buffer: AudioBuffer | undefined;
  play: boolean;
  onStart(source: AudioBufferSourceNode): (() => void) | void;
}) {
  const { buffer, play } = props;
  const [isPlaybackActive, setIsPlaybackActive] = useState(play);
  return (
    <>
      {buffer && play && isPlaybackActive && (
        <Playback
          {...props}
          buffer={buffer}
          onStart={(source) => {
            setIsPlaybackActive(true);
            props.onStart(source);
          }}
          onStop={() => {
            setIsPlaybackActive(false);
          }}
        />
      )}
    </>
  );
}

function Playback({
  context,
  buffer,
  onStop,
  onStart,
}: {
  context: AudioContext;
  buffer: AudioBuffer;
  onStop(): void;
  onStart(source: AudioBufferSourceNode): (() => void) | void;
}) {
  useEffect(() => {
    console.log("start");
    const source = context.createBufferSource();
    source.buffer = buffer;

    const cleanup = onStart(source);

    source.start();

    const stop = () => {
      console.log("stop");
      source.disconnect();
      cleanup && cleanup();
      onStop();
    };
    source.addEventListener("ended", () => {
      stop();
    });
    return () => {
      stop();
    };
  }, [buffer, onStart, onStop, context]);
  return <></>;
}
