import { useEffect, useState } from "react";

export type RecorderProps = {
  context: AudioContext;
  source: AudioNode;
  canvas: HTMLCanvasElement;
  isEnabled: boolean;
  onRecordingStarted(): void;
  onRecordingStopped(dataUrl: string): void;
};

export const Recorder = ({
  context,
  source,
  canvas,
  isEnabled,
  onRecordingStopped,
  onRecordingStarted,
}: RecorderProps): JSX.Element => {
  const [chunks] = useState<Blob[]>(() => []);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | undefined>(
    undefined
  );

  // Connect streams, initialize media recorder
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    chunks.length = 0;
    const mediaStreamDestination = context.createMediaStreamDestination();
    const audioTrack = mediaStreamDestination.stream.getAudioTracks()[0];
    source.connect(mediaStreamDestination);

    const captureStream = canvas.captureStream(30);
    captureStream.addTrack(audioTrack);

    const newMediaRecorder = new MediaRecorder(captureStream, {
      mimeType: "video/webm; codecs=h264",
      videoBitsPerSecond: 8 * 1024 * 1024,
    });
    console.log(
      `MediaRecorder video bitrate: ${newMediaRecorder.videoBitsPerSecond}, audio bitrate: ${newMediaRecorder.audioBitsPerSecond}`
    );
    const onDataAvailable = (event: BlobEvent) => {
      chunks.push(event.data);
    };
    newMediaRecorder.addEventListener("dataavailable", onDataAvailable);

    setMediaRecorder(newMediaRecorder);

    return () => {
      newMediaRecorder.removeEventListener("dataavailable", onDataAvailable);
      captureStream.removeTrack(audioTrack);
      mediaStreamDestination.disconnect();
      setMediaRecorder(undefined);
    };
  }, [context, canvas, source, chunks, isEnabled]);

  // Control the recorder
  useEffect(() => {
    if (!mediaRecorder) {
      return;
    }

    if (isEnabled && mediaRecorder.state === "inactive") {
      mediaRecorder.start(500);
      onRecordingStarted();
    }

    return () => {
      if (mediaRecorder.state === "inactive") {
        return;
      }
      mediaRecorder.stop();
      const blob = new Blob(chunks, { type: "video/webm; codecs=h264" });
      const url = URL.createObjectURL(blob);
      onRecordingStopped(url);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 20);
      chunks.length = 0;
    };
  }, [
    mediaRecorder,
    chunks,
    isEnabled,
    onRecordingStopped,
    onRecordingStarted,
  ]);

  return <></>;
};
