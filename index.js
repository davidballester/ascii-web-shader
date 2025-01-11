runAsciiRenderer({
  pixelsPerChar: 8,
  frameRate: 12,
  asciiCharactersByIntensity: "$#@MNBX0QOI*i;:,.    ".split(""),
});

async function runAsciiRenderer({
  pixelsPerChar,
  frameRate,
  asciiCharactersByIntensity,
}) {
  const video = document.getElementById("original");
  await feedWebCamToVideoElement(video);
  await asyncEvent(video, "canplay");
  const canvas = document.getElementById("ascii-canvas");
  const asciiOutput = document.getElementById("ascii-output");
  const scaleFactor = 1 / pixelsPerChar;
  streamVideoElementToCanvas({
    videoElement: video,
    canvasElement: canvas,
    scaleFactor,
    frameRate,
    onNewFrame: (imageData) =>
      renderAscii({
        imageData,
        asciiCharactersByIntensity,
        outputElement: asciiOutput,
        columns: Math.floor(video.videoWidth * scaleFactor),
      }),
  });
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

function renderAscii({
  imageData,
  asciiCharactersByIntensity,
  columns,
  outputElement,
}) {
  const intensities = getIntensity(imageData);
  const asciiCharacters = intensities.map((intensity) =>
    getAsciiCharForIntensity({ intensity, asciiCharactersByIntensity })
  );
  outputElement.textContent = "";
  for (let i = 0; i < asciiCharacters.length; i++) {
    const asciiCharacter = asciiCharacters[i];
    const requiresLineBreak = i > 0 && i % columns === 0;
    if (requiresLineBreak) {
      outputElement.textContent += "\n";
    }
    outputElement.textContent += asciiCharacter;
  }
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

function getAsciiCharForIntensity({ intensity, asciiCharactersByIntensity }) {
  const index = Math.floor(intensity * asciiCharactersByIntensity.length);
  return asciiCharactersByIntensity[index];
}

async function waitMs(ms) {
  if (ms <= 0) {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
