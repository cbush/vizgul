import { useState, useEffect, useMemo, useRef } from "react";
import { TypedEventTarget } from "./TypedEventTarget";

export type UsePlayerArgs = {
  audioBuffer: AudioBuffer | undefined;
  audioContext: AudioContext;
};

class PlayerStoppedEvent extends Event {
  constructor() {
    super("stopped");
  }
}

export interface Player
  extends TypedEventTarget<{ stopped: PlayerStoppedEvent }> {
  start(): void;
  stop(): void;
  connect(nextNode: AudioNode): void;
  audioContext: AudioContext;
}
export class Player extends TypedEventTarget<{ stopped: PlayerStoppedEvent }> {
  constructor({
    audioContext,
    setIsPlaying,
  }: {
    audioContext: AudioContext;
    setIsPlaying(isPlaying: boolean): void;
  }) {
    super();
    this._audioNode = audioContext.createGain();
    this.audioContext = audioContext;
    this.start = () => setIsPlaying(true);
    this.stop = () => setIsPlaying(false);
    this.connect = (nextNode: AudioNode) => this._audioNode.connect(nextNode);
  }
  _audioNode: AudioNode;
}

export const usePlayer = ({
  audioBuffer,
  audioContext,
}: UsePlayerArgs): { player: Player; isPlaying: boolean } => {
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useMemo(
    () => new Player({ audioContext, setIsPlaying }),
    [audioContext, setIsPlaying]
  );
  let sourceRef = useRef<AudioBufferSourceNode | undefined>(undefined);

  useEffect(() => {
    const stop = () => {
      sourceRef.current?.stop();
      sourceRef.current = undefined;
    };

    if (audioBuffer === undefined) {
      stop();
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      if (sourceRef.current !== undefined) {
        stop();
      }
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(player._audioNode);
      source.start();

      source.addEventListener("ended", () => {
        player.dispatchEvent(new PlayerStoppedEvent());
      });
      sourceRef.current = source;
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [isPlaying, player, audioBuffer, audioContext]);

  return { player, isPlaying };
};
