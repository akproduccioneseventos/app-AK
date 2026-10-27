import { isUsableRecordedVideo, stopRecorderStream } from '@/lib/buzon/recorded-video';

describe('grabacion de video del buzon', () => {
  it('rechaza blobs vacios o que no declaran un formato de video', () => {
    expect(isUsableRecordedVideo(new Blob([], { type: 'video/webm' }))).toBe(false);
    expect(isUsableRecordedVideo(new Blob(['bytes'], { type: 'application/octet-stream' }))).toBe(false);
  });

  it('acepta una salida de video no vacia', () => {
    expect(isUsableRecordedVideo(new Blob(['video'], { type: 'video/webm' }))).toBe(true);
  });

  it('libera todas las pistas del flujo auxiliar', () => {
    const stopVideo = jest.fn();
    const stopAudio = jest.fn();
    const stream = { getTracks: () => [{ stop: stopVideo }, { stop: stopAudio }] } as unknown as MediaStream;

    stopRecorderStream(stream);

    expect(stopVideo).toHaveBeenCalledTimes(1);
    expect(stopAudio).toHaveBeenCalledTimes(1);
  });
});
