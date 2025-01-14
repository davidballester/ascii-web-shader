export async function feedWebCamToVideoElement(videoElement) {
  const videoFeed = await navigator.mediaDevices.getUserMedia({ video: true });
  videoElement.srcObject = videoFeed;
  videoElement.play();
}
