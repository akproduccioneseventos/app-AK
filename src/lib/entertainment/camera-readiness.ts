export interface VideoFrameState {
  readyState: number;
  videoWidth: number;
  videoHeight: number;
}

export function isVideoFrameReady(video: VideoFrameState | null | undefined) {
  return Boolean(
    video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
  );
}
