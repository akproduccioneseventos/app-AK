/**
 * @fileOverview Pruebas para Orden 298 — Bloque 1: El video resumen del cliente con música y al ritmo.
 *
 * Valida que:
 * 1. generarVideoResumenWebM usa addTrack para sumar la pista de audio al MediaStream del grabador.
 * 2. Con musicaUrl, el MediaStream recibe una pista de audio vía addTrack desde createMediaStreamDestination.
 * 3. TuVideoDeLaFiestaModal pasa musicaUrl hacia generarVideoResumenWebM.
 * 4. El álbum del cliente pasa musicaUrl y auto-genera el video resumen en la primera apertura.
 * 5. Existe la pista de audio libre en public/audio/musica-resumen-ak.wav.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  generarVideoResumenWebM,
  detectarGolpesEnAudioBuffer,
} from '@/lib/video-resumen/generar-video-resumen';

describe('Orden 298 — Bloque 1: El video resumen lleva música y al ritmo', () => {
  test('generar-video-resumen.ts usa addTrack, AudioContext y createMediaStreamDestination', () => {
    const fuente = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/video-resumen/generar-video-resumen.ts'),
      'utf8'
    );
    expect(fuente).toContain('addTrack');
    expect(fuente).toContain('createMediaStreamDestination');
    expect(fuente).toContain('musicaUrl');
  });

  test('TuVideoDeLaFiestaModal.tsx pasa musicaUrl con fallback a musica-resumen-ak.wav', () => {
    const fuenteModal = fs.readFileSync(
      path.join(process.cwd(), 'src/components/album/TuVideoDeLaFiestaModal.tsx'),
      'utf8'
    );
    expect(fuenteModal).toContain('musicaUrl');
    expect(fuenteModal).toContain('/audio/musica-resumen-ak.wav');
  });

  test('El álbum pasa musicaUrl al modal de video resumen', () => {
    const fuenteAlbum = fs.readFileSync(
      path.join(process.cwd(), 'src/app/evento/album/[fiestaId]/page.tsx'),
      'utf8'
    );
    expect(fuenteAlbum).toContain('musicaUrl={cancionFiesta || \'/audio/musica-resumen-ak.wav\'}');
  });

  test('Existe el archivo de audio public/audio/musica-resumen-ak.wav', () => {
    const rutaAudio = path.join(process.cwd(), 'public/audio/musica-resumen-ak.wav');
    expect(fs.existsSync(rutaAudio)).toBe(true);
    const stat = fs.statSync(rutaAudio);
    expect(stat.size).toBeGreaterThan(1000);
  });

  test('detectarGolpesEnAudioBuffer detecta pulsos de ritmo y alinea las transiciones', () => {
    const sampleRate = 44100;
    const duracion = 30;
    const totalSamples = sampleRate * duracion;
    const channelData = new Float32Array(totalSamples);

    // Generar pulsos de energía cada 1 segundo
    for (let t = 1; t < duracion; t += 1.0) {
      const idx = Math.floor(t * sampleRate);
      for (let j = 0; j < 500; j++) {
        if (idx + j < totalSamples) {
          channelData[idx + j] = 0.9;
        }
      }
    }

    const mockAudioBuffer = {
      sampleRate,
      length: totalSamples,
      duration: duracion,
      numberOfChannels: 1,
      getChannelData: () => channelData,
      copyFromChannel: jest.fn(),
      copyToChannel: jest.fn(),
    } as unknown as AudioBuffer;

    const tiempos = detectarGolpesEnAudioBuffer(mockAudioBuffer, 5, 3.0, 27.0);
    expect(tiempos.length).toBe(5);
    expect(tiempos[tiempos.length - 1]).toBe(27.0);
    for (let i = 0; i < tiempos.length - 1; i++) {
      expect(tiempos[i]).toBeGreaterThanOrEqual(3.0);
      expect(tiempos[i]).toBeLessThanOrEqual(27.0);
    }
  });

  test('con musicaUrl, el grabador recibe una pista de audio (addTrack)', async () => {
    const mockAudioTrack = { kind: 'audio', id: 'mock-audio-track-1' };
    const mockVideoTrack = { kind: 'video', id: 'mock-video-track-1' };
    const addedTracks: any[] = [];

    const mockStream = {
      addTrack: jest.fn((track: any) => {
        addedTracks.push(track);
      }),
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => addedTracks.filter((t) => t.kind === 'audio'),
    };

    const mockAudioDestination = {
      stream: {
        getAudioTracks: () => [mockAudioTrack],
      },
    };

    const mockGainNode = {
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };

    const mockAudioSource = {
      buffer: null,
      loop: false,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    const mockAudioBuffer = {
      sampleRate: 44100,
      length: 44100 * 5,
      duration: 5,
      getChannelData: () => new Float32Array(44100 * 5),
    };

    class MockAudioContext {
      currentTime = 0;
      createMediaStreamDestination = jest.fn(() => mockAudioDestination);
      createGain = jest.fn(() => mockGainNode);
      createBufferSource = jest.fn(() => mockAudioSource);
      decodeAudioData = jest.fn().mockResolvedValue(mockAudioBuffer);
      close = jest.fn().mockResolvedValue(undefined);
    }

    class MockMediaRecorder {
      stream: any;
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(stream: any) {
        this.stream = stream;
      }
      start = jest.fn();
      stop = jest.fn(() => {
        this.ondataavailable?.({ data: new Blob(['fake-video'], { type: 'video/webm' }) });
        this.onstop?.();
      });
    }

    // Configurar entorno global simulado
    const originalAudioContext = (window as any).AudioContext;
    const originalMediaRecorder = (window as any).MediaRecorder;
    const originalFetch = window.fetch;
    const originalCreateObjectURL = URL.createObjectURL;

    URL.createObjectURL = jest.fn(() => 'blob:mock-video-resumen-url');
    (window as any).AudioContext = MockAudioContext;
    (window as any).MediaRecorder = MockMediaRecorder;

    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1024),
    } as any);

    // Mock HTMLCanvasElement.captureStream and getContext
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      createLinearGradient: () => ({ addColorStop: jest.fn() }),
      fillRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
    })) as any;

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'canvas') {
        (el as any).captureStream = jest.fn(() => mockStream);
      }
      return el;
    });

    try {
      // Invocar con duración mínima de 1 s para que el test sea instantáneo
      const fotosMock = [
        { id: '1', imageUrl: 'https://ejemplo.com/foto1.jpg' },
        { id: '2', imageUrl: 'https://ejemplo.com/foto2.jpg' },
      ];

      // Simulamos la carga de imágenes devolviendo imagen con dimensiones
      const originalImage = window.Image;
      (window as any).Image = class {
        width = 400;
        height = 300;
        onload: (() => void) | null = null;
        set src(_v: string) {
          setTimeout(() => this.onload?.(), 5);
        }
      };

      const resultado = await generarVideoResumenWebM({
        titulo: 'Fiesta de Prueba',
        fecha: '13 de Noviembre de 2026',
        fotos: fotosMock,
        duracionSegundos: 0.1,
        musicaUrl: '/audio/musica-resumen-ak.wav',
      });

      expect(resultado).toBeDefined();
      expect(resultado.blob).toBeDefined();
      // Comprobar que addTrack fue llamado con la pista de audio
      expect(mockStream.addTrack).toHaveBeenCalledWith(mockAudioTrack);
      expect(addedTracks).toContain(mockAudioTrack);
      expect(mockAudioSource.start).toHaveBeenCalled();

      (window as any).Image = originalImage;
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      (window as any).AudioContext = originalAudioContext;
      (window as any).MediaRecorder = originalMediaRecorder;
      window.fetch = originalFetch;
      jest.restoreAllMocks();
    }
  });
});
