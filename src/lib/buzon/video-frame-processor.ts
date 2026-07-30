import { drawBuzonVideoFrame, drawVideoContained } from './video-frame-canvas';

const OUTPUT_WIDTH = 640;
const OUTPUT_HEIGHT = 480;
const OUTPUT_FPS = 20;

function selectRecorderMimeType(): string {
  const candidates = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

async function loadVideoMetadata(video: HTMLVideoElement, sourceUrl: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('No se pudo leer el video seleccionado.'));
    video.src = sourceUrl;
    video.load();
  });
}

async function createPlayableVideoUrl(blob: Blob): Promise<string> {
  if (blob.size === 0) {
    throw new Error('El navegador generó un video vacío.');
  }

  const outputUrl = URL.createObjectURL(blob);
  const probe = document.createElement('video');
  probe.preload = 'auto';
  probe.muted = true;
  probe.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(
        () => reject(new Error('El video procesado no se pudo verificar.')),
        5_000,
      );
      const finish = (callback: () => void) => {
        window.clearTimeout(timeoutId);
        callback();
      };
      probe.onloadeddata = () => finish(resolve);
      probe.onerror = () => finish(() => reject(new Error('El video procesado no es reproducible.')));
      probe.src = outputUrl;
      probe.load();
    });
    return outputUrl;
  } catch (error) {
    URL.revokeObjectURL(outputUrl);
    throw error;
  }
}

export async function renderUploadedVideoWithFrame(input: {
  file: File;
  template?: string;
  displayText: string;
  onProgress?: (progress: number) => void;
}): Promise<{ file: File; url: string; durationSeconds: number }> {
  const sourceUrl = URL.createObjectURL(input.file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.playsInline = true;

  let audioContext: AudioContext | null = null;
  let animationFrame = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let outputStream: MediaStream | null = null;

  try {
    await loadVideoMetadata(video, sourceUrl);
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 16.5) {
      throw new Error('El video debe durar como máximo 15 segundos.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context || typeof canvas.captureStream !== 'function') {
      throw new Error('Este navegador no permite preparar el video con marco.');
    }

    outputStream = canvas.captureStream(OUTPUT_FPS);
    try {
      audioContext = new AudioContext();
      await audioContext.resume();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      destination.stream.getAudioTracks().forEach((track) => outputStream?.addTrack(track));
    } catch {
      await audioContext?.close().catch(() => undefined);
      audioContext = null;
    }

    const mimeType = selectRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(outputStream, { mimeType })
      : new MediaRecorder(outputStream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const blobPromise = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error('No se pudo procesar el video.'));
      recorder.onstop = () => {
        const outputType = recorder.mimeType || mimeType || 'video/webm';
        resolve(new Blob(chunks, { type: outputType }));
      };
    });

    const frameInterval = 1000 / OUTPUT_FPS;
    let lastFrameAt = -frameInterval;
    const renderFrame = (timestamp: number) => {
      if (timestamp - lastFrameAt >= frameInterval) {
        lastFrameAt = timestamp;
        drawVideoContained(context, video, OUTPUT_WIDTH, OUTPUT_HEIGHT);
        drawBuzonVideoFrame(
          context,
          input.template,
          input.displayText,
          OUTPUT_WIDTH,
          OUTPUT_HEIGHT,
        );
        input.onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
      }
      if (!video.ended && !video.paused) {
        animationFrame = requestAnimationFrame(renderFrame);
      }
    };

    video.onended = () => {
      drawVideoContained(context, video, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawBuzonVideoFrame(
        context,
        input.template,
        input.displayText,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
      );
      input.onProgress?.(100);
      if (recorder.state !== 'inactive') recorder.stop();
    };

    recorder.start(500);
    await video.play();
    animationFrame = requestAnimationFrame(renderFrame);
    timeoutId = setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, Math.ceil(video.duration * 1000) + 5_000);

    const blob = await blobPromise;
    const outputType = blob.type || 'video/webm';
    const extension = outputType.includes('mp4') ? 'mp4' : 'webm';
    const outputFile = new File(
      [blob],
      `capsula-video-${Date.now()}.${extension}`,
      { type: outputType },
    );
    const outputUrl = await createPlayableVideoUrl(blob);

    return {
      file: outputFile,
      url: outputUrl,
      durationSeconds: video.duration,
    };
  } finally {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (timeoutId) clearTimeout(timeoutId);
    video.pause();
    outputStream?.getTracks().forEach((track) => track.stop());
    await audioContext?.close().catch(() => undefined);
    URL.revokeObjectURL(sourceUrl);
  }
}
