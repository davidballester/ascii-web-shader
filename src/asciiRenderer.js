import { getEdgesMask } from "./sobelFilter.js";
import { getIntensity } from "./imageProcessing.js";
import { waitMs } from "./utils.js";

const ASCII_CHARACTERS = "$#@MXxoi;:,. ".split("");
const COLUMNS = 80;
const getTextColor = buildGetTextColor();
const isIPhone = /iPhone/.test(navigator.userAgent);

export function videoToAscii({ video, canvas: asciiCanvas, frameRate }) {
  const workingCanvas = document.createElement("canvas");
  const context = asciiCanvas.getContext("2d");
  const pixelsPerChar = video.videoWidth / COLUMNS;
  const scaleFactor = 1 / pixelsPerChar;
  const fontSize = video.offsetWidth / COLUMNS;
  prepareAsciiCanvas({ canvas: asciiCanvas, video, fontSize });
  const frameGenerator = streamVideoElementToCanvas({
    videoElement: video,
    canvasElement: workingCanvas,
    scaleFactor,
  });
  const msBetweenFrames = 1e3 / frameRate;
  let finished = false;
  setTimeout(async () => {
    for (const frame of frameGenerator) {
      if (finished) {
        frameGenerator.return();
        break;
      }
      const startTime = Date.now();
      const imageData = frame.data;
      const intensities = getIntensity({ imageData });
      const ascii = frameToAscii({ imageData: intensities });
      context.clearRect(0, 0, asciiCanvas.width, asciiCanvas.height);
      const rows = ascii.length / COLUMNS;
      for (let row = 0; row < rows; row++) {
        const asciiLine = ascii.slice(row * COLUMNS, (row + 1) * COLUMNS);
        // in iPhone we cannot relay in letter spacing to separate the ASCII characters
        const text = isIPhone
          ? asciiLine.join(String.fromCharCode(8202))
          : asciiLine.join("");
        context.fillText(text, 0, (row + 1) * (fontSize * 1.2));
      }
      const elapsedTime = Date.now() - startTime;
      await waitMs(msBetweenFrames - elapsedTime);
    }
  }, 0);
  return () => {
    finished = true;
  };
}

function frameToAscii({ imageData }) {
  const edgesMask = getEdgesMask({ imageData, columns: COLUMNS });
  const ascii = imageData.map(valueToAscii);
  const asciiWithEdges = ascii.map((value, i) => edgesMask[i] || value);
  return asciiWithEdges;
}

function valueToAscii(value) {
  const index = Math.floor(value * ASCII_CHARACTERS.length);
  return ASCII_CHARACTERS[index];
}

function prepareAsciiCanvas({ canvas, video, fontSize }) {
  const { width, height } = video.getBoundingClientRect();
  // Setting the dimension for video as well prevents any undesired resizing
  canvas.style.width = video.style.width = `${width}px`;
  canvas.style.height = video.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;
  canvas.style.letterSpacing = `${(fontSize * 0.4).toFixed(2)}px`;
  const context = canvas.getContext("2d");
  context.font = `${fontSize.toFixed(2)}px monospace`;
  context.fillStyle = getTextColor(canvas);
}

function* streamVideoElementToCanvas({
  videoElement,
  canvasElement,
  scaleFactor,
}) {
  canvasElement.width = videoElement.videoWidth * scaleFactor;
  canvasElement.height = videoElement.videoHeight * scaleFactor;
  const canvasContext = canvasElement.getContext("2d", {
    willReadFrequently: true,
  });
  while (true) {
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
    yield imageData;
  }
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
