import { renderAscii } from "./asciiRenderer.js";
import { getIntensity } from "./imageProcessing.js";
import { asyncEvent, waitMs } from "./utils.js";
import { feedWebCamToVideoElement } from "./webcamFeed.js";

const enableWebcamButton = document.getElementById("enable-webcam");
enableWebcamButton.addEventListener("click", async () => {
  enableWebcamButton.setAttribute("disabled", "");
  const startTime = Date.now();
  const video = document.getElementById("original");
  try {
    await feedWebCamToVideoElement(video);
    enableWebcamButton.classList.add("hidden", "live");
    runAsciiRenderer({
      video,
      pixelsPerChar: 8,
      frameRate: 30,
    });
  } catch (err) {
    console.error("err");
  }
  const elapsedTime = Date.now() - startTime;
  const remainingTimeForSmoothAnimation = 3e3 - elapsedTime;
  await waitMs(remainingTimeForSmoothAnimation);
  enableWebcamButton.removeAttribute("disabled");
});

async function runAsciiRenderer({ video, pixelsPerChar, frameRate }) {
  await asyncEvent({ element: video, eventName: "canplay" });
  const workingCanvas = document.createElement("canvas");
  const asciiCanvas = document.getElementById("ascii-canvas");
  prepareAsciiCanvas({ canvas: asciiCanvas, video });
  const scaleFactor = 1 / pixelsPerChar;
  const columns = Math.floor(video.videoWidth * scaleFactor);
  streamVideoElementToCanvas({
    videoElement: video,
    canvasElement: workingCanvas,
    scaleFactor,
    frameRate,
    onNewFrame: (imageData) =>
      renderFrame({ imageData, canvas: asciiCanvas, columns }),
  });
}

function prepareAsciiCanvas({ canvas, video }) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.width = video.clientWidth;
  canvas.style.height = video.clientHeight;
  canvas
    .getContext("2d")
    .scale(window.devicePixelRatio, window.devicePixelRatio);
}

function renderFrame({ imageData, canvas, columns }) {
  const intensities = getIntensity({ imageData: imageData.data });
  renderAscii({ canvas, imageData: intensities, columns });
}

function streamVideoElementToCanvas({
  videoElement,
  canvasElement,
  scaleFactor,
  frameRate,
  onNewFrame,
}) {
  canvasElement.width = videoElement.videoWidth * scaleFactor;
  canvasElement.height = videoElement.videoHeight * scaleFactor;
  const canvasContext = canvasElement.getContext("2d", {
    willReadFrequently: true,
  });
  setInterval(() => {
    canvasContext.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    const imageData = canvasContext.getImageData(
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    onNewFrame(imageData);
  }, 1e3 / frameRate);
}
