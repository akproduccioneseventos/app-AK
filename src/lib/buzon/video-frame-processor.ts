import { drawBuzonVideoFrame, drawVideoContained } from './video-frame-canvas';

const OUTPUT_WIDTH = 640;
const OUTPUT_HEIGHT = 480;
const OUTPUT_FPS = 20;

function selectRecorderMimeType(hasAudioTrack = true): string {
  const candidates = hasAudioTrack
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/mp4;codecs=vp9,opus',
        'video/webm',
        'video/mp4',
      ]
    : [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

async function loadVideoMetadata(video: HTMLVideoElement, sourceUrl: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      reject(new Error('El video seleccionado no termino de cargar. Intenta nuevamente.'));
    }, 8_000);
    const finish = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    };
    video.onloadedmetadata = finish;
    video.onloadeddata = finish;
    video.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      reject(new Error('No se pudo leer el video seleccionado.'));
    };
    video.src = sourceUrl;
    video.load();
  });

  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      video.onloadeddata = finish;
      video.oncanplay = finish;
      setTimeout(finish, 300);
    });
  }
}

export async function createPlayableVideoUrl(blob: Blob): Promise<string> {
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
      let settled = false;
      let timeoutId: number | undefined;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
        callback();
      };
      timeoutId = window.setTimeout(
        () => finish(() => reject(new Error('El video procesado no se pudo verificar.'))),
        5_000,
      );
      const checkVideo = () => {
        if (probe.videoWidth > 0 && probe.videoHeight > 0) finish(resolve);
      };
      probe.onloadedmetadata = checkVideo;
      probe.onloadeddata = checkVideo;
      probe.oncanplay = checkVideo;
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
  video.muted = true;

  let animationFrame = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let renderInterval: ReturnType<typeof setInterval> | undefined;
  let outputStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;

  try {
    await loadVideoMetadata(video, sourceUrl);
    if (Number.isFinite(video.duration) && (video.duration <= 0 || video.duration > 16.5)) {
      throw new Error('El video debe durar como máximo 15 segundos.');
    }

    const MIN_RECORDING_MS = 600;
    const targetDuration = Number.isFinite(video.duration) && video.duration >= 0.6
      ? Math.min(video.duration, 15)
      : 1.5;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context || typeof canvas.captureStream !== 'function') {
      throw new Error('Este navegador no permite preparar el video con marco.');
    }

    const paintCurrentFrame = () => {
      drawVideoContained(context, video, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      drawBuzonVideoFrame(
        context,
        input.template,
        input.displayText,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
      );
    };

    // Dibujar el fotograma inicial en el canvas antes de capturar el stream o iniciar la grabación.
    // Esto garantiza que el primer frame nunca sea negro.
    paintCurrentFrame();

    outputStream = canvas.captureStream(OUTPUT_FPS);

    let hasAudioTrack = false;
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error('Este navegador no permite conservar el audio del video. Prueba con otro navegador.');
    }
    audioContext = new AudioContextCtor();
    let resumeTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        audioContext.resume(),
        new Promise<never>((_, reject) => {
          resumeTimeout = setTimeout(() => reject(new Error('No se pudo activar el audio. Intenta nuevamente.')), 1_500);
        }),
      ]);
    } finally {
      if (resumeTimeout) clearTimeout(resumeTimeout);
    }
    if (audioContext.state !== 'running') {
      throw new Error('No se pudo activar el audio. Intenta nuevamente.');
    }
    video.muted = false;
    video.volume = 1;
    const source = audioContext.createMediaElementSource(video);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    const audioTracks = destination.stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No se pudo conservar el audio del video. Intenta nuevamente.');
    }
    audioTracks.forEach((track) => outputStream?.addTrack(track));
    hasAudioTrack = true;

    const mimeType = selectRecorderMimeType(hasAudioTrack);
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
    let isFinished = false;

    // Reasegurar el dibujo del fotograma inicial antes de comenzar a grabar
    paintCurrentFrame();

    let recordingStartedAt = performance.now();
    recorder.start(100);

    const finishRecording = () => {
      if (isFinished) return;
      isFinished = true;
      if (renderInterval) clearInterval(renderInterval);
      paintCurrentFrame();
      input.onProgress?.(100);
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, Math.max(50, Math.ceil(1000 / OUTPUT_FPS)));
    };

    const isPlaybackFinished = () => {
      const elapsedMs = performance.now() - recordingStartedAt;
      if (elapsedMs < MIN_RECORDING_MS) return false;
      if (video.ended) return true;
      if (Number.isFinite(video.duration) && video.duration >= 0.6 && video.currentTime >= video.duration - 0.05) {
        return true;
      }
      if (video.currentTime >= 15 || elapsedMs >= 15_000) return true;
      return false;
    };

    const renderFrame = (timestamp: number) => {
      if (isFinished) return;
      if (timestamp - lastFrameAt >= frameInterval) {
        lastFrameAt = timestamp;
        paintCurrentFrame();
        input.onProgress?.(Math.min(99, Math.round((video.currentTime / targetDuration) * 100)));
      }
      if (isPlaybackFinished()) {
        finishRecording();
        return;
      }
      if (!isFinished) {
        animationFrame = requestAnimationFrame(renderFrame);
      }
    };

    video.onended = () => {
      if (isPlaybackFinished()) {
        finishRecording();
      }
    };
    video.ontimeupdate = () => {
      if (!isFinished && isPlaybackFinished()) {
        finishRecording();
      }
    };

    renderInterval = setInterval(() => renderFrame(performance.now()), frameInterval);
    await video.play();
    animationFrame = requestAnimationFrame(renderFrame);
    timeoutId = setTimeout(() => {
      finishRecording();
    }, Math.ceil(targetDuration * 1000) + 4_000);

    const blob = await blobPromise;
    const outputType = blob.type || 'video/webm';
    const extension = outputType.includes('mp4') ? 'mp4' : 'webm';
    const outputFile = new File(
      [blob],
      `capsula-video-${Date.now()}.${extension}`,
      { type: outputType },
    );
    const outputUrl = await createPlayableVideoUrl(blob);

    const durationSeconds = Number.isFinite(video.duration) && video.duration >= 0.6
      ? video.duration
      : Math.max(1, Math.round(video.currentTime || targetDuration));

    return {
      file: outputFile,
      url: outputUrl,
      durationSeconds,
    };
  } finally {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (renderInterval) clearInterval(renderInterval);
    if (timeoutId) clearTimeout(timeoutId);
    video.pause();
    outputStream?.getTracks().forEach((track) => track.stop());
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close().catch(() => undefined);
    }
    URL.revokeObjectURL(sourceUrl);
  }
}
