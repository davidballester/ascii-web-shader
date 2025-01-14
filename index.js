import { renderAscii } from "./asciiRenderer.js";
import { getIntensity } from "./imageProcessing.js";
import { asyncEvent } from "./utils.js";
import { feedWebCamToVideoElement } from "./webcamFeed.js";

runAsciiRenderer({
  pixelsPerChar: 8,
  frameRate: 30,
});

async function runAsciiRenderer({ pixelsPerChar, frameRate }) {
  const video = document.getElementById("original");
  await feedWebCamToVideoElement(video);
  await asyncEvent({ element: video, eventName: "canplay" });
  const workingCanvas = document.createElement("canvas");
  const asciiCanvas = document.getElementById("ascii-canvas");
  asciiCanvas.width = video.videoWidth;
  asciiCanvas.height = video.videoHeight;
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
