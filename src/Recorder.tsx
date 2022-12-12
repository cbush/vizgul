import { useEffect, useState } from "react";

export type RecorderProps = {
  context: AudioContext;
  source: AudioNode;
  canvas: HTMLCanvasElement;
  isRecording: boolean;
  onRecordingStopped(dataUrl: string): void;
};

export const Recorder = ({
  context,
  source,
  canvas,
  isRecording,
  onRecordingStopped,
}: RecorderProps): JSX.Element => {
  const [chunks] = useState<Blob[]>(() => []);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | undefined>(
    undefined
  );

  // Connect streams, initialize media recorder
  useEffect(() => {
    const mediaStreamDestination = context.createMediaStreamDestination();
    const audioTrack = mediaStreamDestination.stream.getAudioTracks()[0];
    source.connect(mediaStreamDestination);

    const captureStream = canvas.captureStream(30);
    captureStream.addTrack(audioTrack);

    const mediaRecorder = new MediaRecorder(captureStream, {
      mimeType: "video/webm; codecs=h264",
      videoBitsPerSecond: 8 * 1024 * 1024,
    });
    console.log(
      `MediaRecorder video bitrate: ${mediaRecorder.videoBitsPerSecond}, audio bitrate: ${mediaRecorder.audioBitsPerSecond}`
    );
    const onDataAvailable = (event: BlobEvent) => {
      chunks.push(event.data);
    };
    mediaRecorder.addEventListener("dataavailable", onDataAvailable);

    setMediaRecorder(mediaRecorder);

    return () => {
      chunks.length = 0;
      mediaRecorder.removeEventListener("dataavailable", onDataAvailable);
      captureStream.removeTrack(audioTrack);
      mediaStreamDestination.disconnect();
      setMediaRecorder(undefined);
    };
  }, [context, canvas, source, chunks]);

  // Control the recorder
  useEffect(() => {
    if (!mediaRecorder) {
      return;
    }

    if (isRecording && mediaRecorder.state === "inactive") {
      mediaRecorder.start(500);
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
      }, 0);
    };
  }, [mediaRecorder, chunks, isRecording, onRecordingStopped]);

  return <></>;
};
