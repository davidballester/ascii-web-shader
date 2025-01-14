import { renderAscii } from "./asciiRenderer.js";

runAsciiRenderer({
  pixelsPerChar: 8,
  frameRate: 30,
});

async function runAsciiRenderer({ pixelsPerChar, frameRate }) {
  const video = document.getElementById("original");
  await feedWebCamToVideoElement(video);
  await asyncEvent(video, "canplay");
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
  const intensities = getIntensity(imageData);
  renderAscii({ canvas, imageData: intensities, columns });
}

async function asyncEvent(element, eventName) {
  return new Promise((resolve) => element.addEventListener(eventName, resolve));
}

async function feedWebCamToVideoElement(videoElement) {
  const videoFeed = await navigator.mediaDevices.getUserMedia({ video: true });
  videoElement.srcObject = videoFeed;
  videoElement.play();
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

function getIntensity(imageData) {
  const ans = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    // CIE 1931 conversion
    const intensity = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    ans.push(intensity / 256);
  }
  return ans;
}
