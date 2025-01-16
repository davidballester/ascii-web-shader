import { getEdgesMask } from "./sobelFilter.js";

const ASCII_CHARACTERS = "$#@MNBX0QOI*i;:,.    ".split("");

export function renderAscii({ canvas, imageData, columns }) {
  clearCanvas(canvas);
  const edgesMask = getEdgesMask({ imageData, columns });
  const ascii = imageData.map(getAscii);
  const asciiWithEdges = ascii.map((value, i) => edgesMask[i] || value);
  for (let i = 0; i < columns; i++) {
    const asciiLine = asciiWithEdges.slice(i * columns, (i + 1) * columns);
    renderAsciiLine({ canvas, asciiLine, lineNumber: i });
  }
}

function clearCanvas(canvas) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function renderAsciiLine({ canvas, asciiLine, lineNumber }) {
  canvas.style.letterSpacing = "3.25px";
  const context = canvas.getContext("2d");
  context.font = "8px monospace";
  context.fillText(asciiLine.join(""), 0, lineNumber * 8);
}

function getAscii(value) {
  const index = Math.floor(value * ASCII_CHARACTERS.length);
  return ASCII_CHARACTERS[index];
}
