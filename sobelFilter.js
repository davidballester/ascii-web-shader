const kernelX = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

const kernelY = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

const intensityThreshold = 0.5;

export function getEdgesMask({ imageData, columns }) {
  const pixelAt = (x, y) => imageData[x + columns * y] || 0;
  const rows = imageData.length / columns;
  const sobelData = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const pixelX =
        kernelX[0][0] * pixelAt(x - 1, y - 1) +
        kernelX[0][1] * pixelAt(x, y - 1) +
        kernelX[0][2] * pixelAt(x + 1, y - 1) +
        kernelX[1][0] * pixelAt(x - 1, y) +
        kernelX[1][1] * pixelAt(x, y) +
        kernelX[1][2] * pixelAt(x + 1, y) +
        kernelX[2][0] * pixelAt(x - 1, y + 1) +
        kernelX[2][1] * pixelAt(x, y + 1) +
        kernelX[2][2] * pixelAt(x + 1, y + 1);
      const pixelY =
        kernelY[0][0] * pixelAt(x - 1, y - 1) +
        kernelY[0][1] * pixelAt(x, y - 1) +
        kernelY[0][2] * pixelAt(x + 1, y - 1) +
        kernelY[1][0] * pixelAt(x - 1, y) +
        kernelY[1][1] * pixelAt(x, y) +
        kernelY[1][2] * pixelAt(x + 1, y) +
        kernelY[2][0] * pixelAt(x - 1, y + 1) +
        kernelY[2][1] * pixelAt(x, y + 1) +
        kernelY[2][2] * pixelAt(x + 1, y + 1);
      const intensity = Math.sqrt(Math.pow(pixelX, 2) + Math.pow(pixelY, 2));
      const maskChar = intensity > intensityThreshold ? " " : "";
      sobelData.push(maskChar);
    }
  }
  return sobelData;
}
