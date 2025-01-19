import { getEdgesMask } from "./sobelFilter.js";
import { asyncEvent } from "./utils.js";
import { getIntensity } from "./imageProcessing.js";

const ASCII_CHARACTERS = "$#@MXxoi;:,. ".split("");
const getTextColor = buildGetTextColor();

export async function videoToAscii({
  video,
  canvas: asciiCanvas,
  pixelsPerChar,
  frameRate,
}) {
  await asyncEvent({ element: video, eventName: "canplay" });
  const workingCanvas = document.createElement("canvas");
  prepareAsciiCanvas({ canvas: asciiCanvas, video });
  const scaleFactor = 1 / pixelsPerChar;
  const columns = Math.floor(video.videoWidth * scaleFactor);
  streamVideoElementToCanvas({
    videoElement: video,
    canvasElement: workingCanvas,
    scaleFactor,
    frameRate,
    onNewFrame: (imageData) => {
      const intensities = getIntensity({ imageData: imageData.data });
      frameToAscii({ canvas: asciiCanvas, imageData: intensities, columns });
    },
  });
}

function frameToAscii({ canvas, imageData, columns }) {
  clearCanvas(canvas);
  const edgesMask = getEdgesMask({ imageData, columns });
  const ascii = imageData.map(valueToAscii);
  const asciiWithEdges = ascii.map((value, i) => edgesMask[i] || value);
  for (let i = 0; i < columns; i++) {
    const asciiLine = asciiWithEdges.slice(i * columns, (i + 1) * columns);
    lineToAscii({ canvas, asciiLine, lineNumber: i + 1 });
  }
}

function lineToAscii({ canvas, asciiLine, lineNumber }) {
  canvas.style.letterSpacing = "3.25px";
  const context = canvas.getContext("2d");
  context.font = "8px monospace";
  context.fillStyle = getTextColor(canvas);
  context.fillText(asciiLine.join(""), 0, lineNumber * 8);
}

function valueToAscii(value) {
  const index = Math.floor(value * ASCII_CHARACTERS.length);
  return ASCII_CHARACTERS[index];
}

function clearCanvas(canvas) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
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

function buildGetTextColor() {
  let textColor;
  return (canvas) => {
    if (!textColor) {
      textColor = getComputedStyle(canvas).color;
    }
    return textColor;
  };
}
