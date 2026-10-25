import { createPlayableVideoUrl, renderUploadedVideoWithFrame } from '@/lib/buzon/video-frame-processor';
jest.mock('@/lib/buzon/video-frame-canvas', () => ({ drawBuzonVideoFrame: jest.fn(), drawVideoContained: jest.fn() }));

function pipeline(mode: 'running' | 'rejected' | 'suspended' | 'no-track') {
  const stopVideo = jest.fn(), stopAudio = jest.fn();
  const track = { stop: stopAudio } as unknown as MediaStreamTrack;
  const tracks = [{ stop: stopVideo } as unknown as MediaStreamTrack];
  const output = { getTracks: () => tracks, addTrack: jest.fn((t: MediaStreamTrack) => tracks.push(t)) };
  const source = { connect: jest.fn() }, destination = { stream: { getAudioTracks: () => mode === 'no-track' ? [] : [track] } };
  const audio = { state: mode === 'suspended' ? 'suspended' : 'running', resume: jest.fn(() => mode === 'rejected' ? Promise.reject(new Error('denied')) : Promise.resolve()), close: jest.fn().mockResolvedValue(undefined), createMediaElementSource: jest.fn(() => source), createMediaStreamDestination: jest.fn(() => destination) };
  const ctor = jest.fn(() => audio), recorders: FakeRecorder[] = [];
  class FakeRecorder {
    static isTypeSupported = () => true;
    state = 'inactive'; mimeType = 'video/webm';
    ondataavailable?: (e: { data: Blob }) => void;
    onstop?: () => void; onerror?: () => void;
    constructor(public stream: unknown) { recorders.push(this); }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['encoded'], { type: this.mimeType }) }); this.onstop?.(); }
  }
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: ctor });
  Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: FakeRecorder });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:qa653') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  const create = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    const element = create(tag);
    if (tag === 'video') {
      const video = element as HTMLVideoElement;
      Object.defineProperties(video, { duration: { value: 1 }, readyState: { value: 2 }, videoWidth: { value: 640 }, videoHeight: { value: 480 }, currentTime: { value: 0, writable: true }, ended: { value: false, writable: true } });
      video.load = () => { queueMicrotask(() => video.onloadedmetadata?.(new Event('loadedmetadata'))); };
      video.play = jest.fn(async () => { setTimeout(() => { Object.defineProperty(video, 'ended', { value: true }); video.currentTime = 1; video.onended?.(new Event('ended')); }, 800); });
      video.pause = jest.fn();
    }
    if (tag === 'canvas') {
      Object.defineProperty(element, 'getContext', { value: () => ({}) });
      Object.defineProperty(element, 'captureStream', { value: () => output });
    }
    return element;
  }) as typeof document.createElement);
  return { audio, ctor, source, destination, output, recorders, stopVideo, stopAudio };
}

describe('audio del archivo procesado', () => {
  afterEach(() => jest.restoreAllMocks());
  it.each(['rejected', 'suspended', 'no-track'] as const)('no convierte un fallo de audio (%s) en exito silencioso', async (mode) => {
    const p = pipeline(mode);
    const pending = renderUploadedVideoWithFrame({ file: new File(['video'], 'qa.mp4', { type: 'video/mp4' }), displayText: 'QA ficticio' });
    const observed = pending.then(() => ({ rejected: false }), () => ({ rejected: true }));
    const outcome = await observed;
    expect(p.ctor).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({ rejected: true });
    expect(p.recorders).toHaveLength(0);
    expect(p.audio.close).toHaveBeenCalled();
    expect(p.stopVideo).toHaveBeenCalled();
  });
  it('conecta la pista de origen y libera video/audio/contexto al terminar', async () => {
    const p = pipeline('running');
    const pending = renderUploadedVideoWithFrame({ file: new File(['video'], 'qa.mp4', { type: 'video/mp4' }), displayText: 'QA ficticio' });
    const observed = pending.then(result => ({ result }), error => ({ error }));
    await observed;
    expect(await observed).toMatchObject({ result: { file: expect.any(File), url: 'blob:qa653' } });
    expect(p.source.connect).toHaveBeenCalledWith(p.destination);
    expect(p.output.addTrack).toHaveBeenCalled();
    expect(p.stopAudio).toHaveBeenCalled();
    expect(p.stopVideo).toHaveBeenCalled();
    expect(p.audio.close).toHaveBeenCalled();
  });

  it('rechaza archivo vacio antes de crear una URL de revision', async () => {
    pipeline('running');
    await expect(createPlayableVideoUrl(new Blob([], { type: 'video/webm' }))).rejects.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('no considera reproducible un blob con metadata pero sin dimensiones de video', async () => {
    pipeline('running');
    (document.createElement as jest.Mock).mockRestore();
    const create = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const element = create(tag);
      if (tag === 'video') {
        const video = element as HTMLVideoElement;
        Object.defineProperties(video, { videoWidth: { value: 0 }, videoHeight: { value: 0 } });
        video.load = () => queueMicrotask(() => {
          video.onloadedmetadata?.(new Event('loadedmetadata'));
          queueMicrotask(() => video.onerror?.(new Event('error')));
        });
      }
      return element;
    }) as typeof document.createElement);
    await expect(createPlayableVideoUrl(new Blob(['invalid'], { type: 'video/webm' }))).rejects.toThrow();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qa653');
  });
});
