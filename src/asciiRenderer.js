import { getEdgesMask } from "./sobelFilter.js";
import { getIntensity } from "./imageProcessing.js";
import { waitMs } from "./utils.js";

const ASCII_CHARACTERS = "$#@MXxoi;:,. ".split("");
const COLUMNS = 80;
const getTextColor = buildGetTextColor();

export function videoToAscii({
  video,
  canvas: asciiCanvas,
  frameRate,
  mirror = false,
}) {
  const { fontSize, scaleFactor } = prepareAsciiCanvas({
    canvas: asciiCanvas,
    video,
  });
  const fontSizeWithSpacing = fontSize;
  const lineHeight = fontSize * 1.2;
  const frameGenerator = generateFrames({
    videoElement: video,
    scaleFactor,
    mirror,
  });
  const context = asciiCanvas.getContext("2d");
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
        const yOffset = (row + 1) * lineHeight;
        asciiLine.forEach((asciiChar, index) => {
          context.fillText(asciiChar, index * fontSizeWithSpacing, yOffset);
        });
      }
      const elapsedTime = Date.now() - startTime;
      await waitMs(Math.max(20, msBetweenFrames - elapsedTime));
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

function prepareAsciiCanvas({ canvas, video }) {
  const { width, height } = video.getBoundingClientRect();
  // Setting the dimension for video as well prevents any undesired resizing
  canvas.style.width = video.style.width = `${width}px`;
  canvas.style.height = video.style.height = `${height}px`;
  canvas.width = width;
  canvas.height = height;
  const fontSize = width / COLUMNS;
  const context = canvas.getContext("2d");
  context.font = `${fontSize.toFixed(2)}px monospace`;
  context.fillStyle = getTextColor(canvas);
  const pixelsPerChar = video.videoWidth / COLUMNS;
  const scaleFactor = 1 / pixelsPerChar;
  return {
    fontSize,
    scaleFactor,
  };
}

function* generateFrames({ videoElement, scaleFactor, mirror }) {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth * scaleFactor;
  canvas.height = videoElement.videoHeight * scaleFactor;
  const canvasContext = canvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (mirror) {
    canvasContext.scale(-1, 1);
  }
  while (true) {
    canvasContext.drawImage(
      videoElement,
      0,
      0,
      mirror ? -canvas.width : canvas.width,
      canvas.height
    );
    const imageData = canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
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
