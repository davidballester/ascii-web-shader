export function getIntensity({ imageData }) {
  const ans = [];
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    // CIE 1931 conversion
    const intensity = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    ans.push(intensity / 256);
  }
  return ans;
}
