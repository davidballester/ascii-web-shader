import { videoToAscii } from "./asciiRenderer.js";
import { asyncEvent, waitMs } from "./utils.js";
import { feedWebCamToVideoElement } from "./webcamFeed.js";

const FRAME_RATE = 30;

let stopCurrentStreaming = null;

document.getElementById("enable-webcam").addEventListener("click", async () => {
  disableInputs();
  const startTime = Date.now();
  const video = createVideo();
  const canvas = createCanvas();
  try {
    await feedWebCamToVideoElement(video);
    enableVideo();
    mirrorVideo();
    await asyncEvent({ element: video, eventName: "canplay" });
    stopCurrentStreaming = videoToAscii({
      video,
      canvas,
      frameRate: FRAME_RATE,
    });
  } catch (err) {
    const elapsedTime = Date.now() - startTime;
    const remainingTimeForSmoothAnimation = 3e3 - elapsedTime;
    await waitMs(remainingTimeForSmoothAnimation);
    reset();
  }
});

const userSubmittedVideoInput = document.getElementById("user-submitted-video");
userSubmittedVideoInput.addEventListener("change", async (evt) => {
  const videoFile = evt.target.files[0];
  if (!videoFile) {
    return;
  }
  userSubmittedVideoInput.value = null;
  disableInputs();
  const videoElement = createVideo();
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
  videoElement.setAttribute("controls", "");
  const { error } = await videoReady;
  if (error) {
    reset();
    return;
  }
  const canvas = createCanvas();
  enableVideo();
  stopCurrentStreaming = videoToAscii({
    video: videoElement,
    canvas,
    frameRate: FRAME_RATE,
  });
});

document.getElementById("stop").addEventListener("click", reset);

function reset() {
  stopCurrentStreaming?.();
  disableVideo();
  destroyVideo();
  destroyCanvas();
  enableInputs();
}

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

function disableVideo() {
  document.getElementById("enable-webcam").classList.remove("hidden", "live");
  document
    .getElementById("user-submitted-video-button")
    .classList.remove("hidden", "live");
}

function mirrorVideo() {
  document.getElementById("canvas").classList.add("mirrored");
  document.getElementById("video").classList.add("mirrored");
}

function createVideo() {
  const videoTemplate = document.getElementById("video-template");
  const video = videoTemplate.cloneNode();
  video.id = "video";
  video.classList.remove("hidden");
  videoTemplate.before(video);
  return video;
}

function destroyVideo() {
  document.getElementById("video").remove();
}

function createCanvas() {
  const canvasTemplate = document.getElementById("canvas-template");
  const canvas = canvasTemplate.cloneNode();
  canvas.id = "canvas";
  canvas.classList.remove("hidden");
  canvasTemplate.before(canvas);
  return canvas;
}

function destroyCanvas() {
  document.getElementById("canvas").remove();
}
