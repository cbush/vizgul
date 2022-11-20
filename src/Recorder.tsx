export {};
/*
    // Recording
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    analyser.connect(mediaStreamDestination);
    const captureStream = canvas.captureStream(30);
    captureStream.addTrack(mediaStreamDestination.stream.getAudioTracks()[0]);
    const mediaRecorder = new MediaRecorder(captureStream, {
      mimeType: "video/webm; codecs=h264",
    });
    const chunks: Blob[] = [];
    mediaRecorder.addEventListener("dataavailable", (event) => {
      chunks.push(event.data);
    });

    player.addEventListener("stopped", () => {
      mediaRecorder.stop();
      if (!canvasRef.current) {
        return;
      }

      const blob = new Blob(chunks, { type: "video/webm; codecs=h264" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("style", "display: none;");
      a.href = url;
      a.download = "video.webm";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);
    });

    mediaRecorder.start(500);

    // Testing without wiring up a stop button
    setTimeout(() => {
      player.stop();
    }, 10000);
    */
