export function isUsableRecordedVideo(blob: Blob): boolean {
  return blob.size > 0 && blob.type.startsWith('video/');
}

export function stopRecorderStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
