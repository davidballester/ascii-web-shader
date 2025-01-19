import { videoToAscii } from "./asciiRenderer.js";
import { waitMs } from "./utils.js";
import { feedWebCamToVideoElement } from "./webcamFeed.js";

const enableWebcamButton = document.getElementById("enable-webcam");
enableWebcamButton.addEventListener("click", async () => {
  enableWebcamButton.setAttribute("disabled", "");
  const startTime = Date.now();
  const video = document.getElementById("original");
  try {
    await feedWebCamToVideoElement(video);
    enableWebcamButton.classList.add("hidden", "live");
    videoToAscii({
      video,
      canvas: document.getElementById("ascii-canvas"),
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
