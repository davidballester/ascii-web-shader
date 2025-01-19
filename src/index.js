import { videoToAscii } from "./asciiRenderer.js";
import { asyncEvent, waitMs } from "./utils.js";
import { feedWebCamToVideoElement } from "./webcamFeed.js";

document.getElementById("enable-webcam").addEventListener("click", async () => {
  disableInputs();
  const startTime = Date.now();
  const video = document.getElementById("original");
  try {
    await feedWebCamToVideoElement(video);
    enableVideo();
    await asyncEvent({ element: video, eventName: "canplay" });
    videoToAscii({
      video,
      canvas: document.getElementById("ascii-canvas"),
      pixelsPerChar: 8,
      frameRate: 30,
    });
  } catch (err) {
    const elapsedTime = Date.now() - startTime;
    const remainingTimeForSmoothAnimation = 3e3 - elapsedTime;
    await waitMs(remainingTimeForSmoothAnimation);
    enableInputs();
  }
});

document
  .getElementById("user-submitted-video")
  .addEventListener("change", async (evt) => {
    const videoFile = evt.target.files[0];
    if (!videoFile) {
      return;
    }
    disableInputs();
    const videoElement = document.getElementById("original");
    const videoReady = Promise.race([
      asyncEvent({ element: videoElement, eventName: "canplay" }).then(
        () => ({})
      ),
      asyncEvent({ element: videoElement, eventName: "error" }).then(() => ({
        error: true,
      })),
    ]);
    videoElement.src = URL.createObjectURL(videoFile);
    videoElement.load();
    videoElement.play();
    const { error } = await videoReady;
    if (error) {
      enableInputs();
      return;
    }
    enableVideo();
    videoToAscii({
      video: videoElement,
      canvas: document.getElementById("ascii-canvas"),
      pixelsPerChar: 8,
      frameRate: 30,
    });
  });

function disableInputs() {
  document.getElementById("enable-webcam").setAttribute("disabled", "");
  document
    .getElementById("user-submitted-video-button")
    .setAttribute("aria-disabled", "true");
}

function enableInputs() {
  document.getElementById("enable-webcam").removeAttribute("disabled");
  document
    .getElementById("user-submitted-video-button")
    .removeAttribute("aria-disabled");
}

function enableVideo() {
  document.getElementById("enable-webcam").classList.add("hidden", "live");
  document
    .getElementById("user-submitted-video-button")
    .classList.add("hidden", "live");
}
