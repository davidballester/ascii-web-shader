import { videoToAscii } from "./asciiRenderer.js";
import { asyncEvent, waitMs } from "./utils.js";
import { feedWebCamToVideoElement } from "./webcamFeed.js";

const FRAME_RATE = 30;

let stopCurrentStreaming = null;
let currentVideoFile = null;

document
  .getElementById("enable-webcam")
  .addEventListener("click", runAsciiShaderOnWebcamFeed);
document
  .getElementById("user-submitted-video")
  .addEventListener("change", async (evt) => {
    const videoFile = evt.target.files[0];
    currentVideoFile = videoFile;
    if (!videoFile) {
      return;
    }
    runAsciiShaderOnVideoFile({ videoFile });
  });
document.getElementById("stop").addEventListener("click", reset);
window.addEventListener("orientationchange", async () => {
  if (!stopCurrentStreaming) {
    return;
  }
  const video = document.getElementById("video");
  const isWebcam = video.classList.contains("webcam");
  const currentTime = video.currentTime;
  reset();
  if (isWebcam) {
    runAsciiShaderOnWebcamFeed();
  } else {
    await runAsciiShaderOnVideoFile({ videoFile: currentVideoFile });
    document.getElementById("video").currentTime = currentTime;
  }
});

async function runAsciiShaderOnWebcamFeed() {
  disableInputs();
  const startTime = Date.now();
  const video = createVideo();
  video.classList.add("webcam");
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
    console.error(err);
    const elapsedTime = Date.now() - startTime;
    const remainingTimeForSmoothAnimation = 3e3 - elapsedTime;
    await waitMs(remainingTimeForSmoothAnimation);
    reset();
  }
}

async function runAsciiShaderOnVideoFile({ videoFile }) {
  disableInputs();
  const videoElement = createVideo();
  videoElement.classList.add("video-upload");
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
}

function reset() {
  stopCurrentStreaming?.();
  stopCurrentStreaming = null;
  disableVideo();
  destroyVideo();
  destroyCanvas();
  enableInputs();
  document.getElementById("user-submitted-video").value = null;
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
