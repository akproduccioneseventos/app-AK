/**
 * MATAFUEGO - Orden 140 (Codex, ENT89-IMAGEN): la fotocabina entregaba un recuadro negro.
 *
 * El video de la cámara está oculto (`className="hidden"`) y nunca se llamaba a `play()`: el
 * navegador lo dejaba en pausa con la señal viva y `readyState` 4, y `drawImage` dibujaba negro.
 * `asegurarCuadroDeVideo` lo pone a andar y espera un cuadro real antes de dibujar; si no hay
 * cuadro avisa (tira error) y la pantalla NO guarda ni entrega la captura.
 *
 * Se prueba con un video de mentira, y que la pantalla llame a la función antes de dibujar.
 *
 * Probado rompiéndolo: sacando la llamada a `play()` el primer caso se pone en rojo; sacando el
 * `await asegurarCuadroDeVideo` de `captureToCanvas` se pone en rojo el último; y bajando el
 * timeout a no esperar, el caso "no llega ningún cuadro" deja de rechazar.
 * No hay umbral de oscuridad: una foto oscura de verdad no se rechaza.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  asegurarCuadroDeVideo,
  CamaraSinCuadroError,
  type VideoReproducible,
} from '@/lib/entertainment/camera-readiness';

function videoFalso(parcial: Partial<VideoReproducible> = {}) {
  const escuchas: Record<string, Array<() => void>> = {};
  const video = {
    readyState: 4,
    videoWidth: 1080,
    videoHeight: 1920,
    paused: true,
    play: jest.fn(async () => {
      video.paused = false;
    }),
    addEventListener: (t: string, f: () => void) => {
      (escuchas[t] ||= []).push(f);
    },
    removeEventListener: (t: string, f: () => void) => {
      escuchas[t] = (escuchas[t] || []).filter((x) => x !== f);
    },
    emitir: (t: string) => (escuchas[t] || []).slice().forEach((f) => f()),
    ...parcial,
  };
  return video;
}

describe('asegurarCuadroDeVideo', () => {
  it('un video en pausa se pone a andar (play) antes de dejar dibujar', async () => {
    const video = videoFalso();
    const espera = asegurarCuadroDeVideo(video);
    await Promise.resolve();
    await Promise.resolve();
    expect(video.play).toHaveBeenCalledTimes(1);
    video.emitir('playing');
    await expect(espera).resolves.toBeUndefined();
  });

  it('usa requestVideoFrameCallback cuando existe, y espera ese cuadro', async () => {
    let llegar: () => void = () => undefined;
    const video = videoFalso({ requestVideoFrameCallback: (f) => { llegar = f; return 1; } });
    let listo = false;
    const espera = asegurarCuadroDeVideo(video).then(() => { listo = true; });
    await Promise.resolve();
    await Promise.resolve();
    expect(listo).toBe(false);
    llegar();
    await espera;
    expect(listo).toBe(true);
  });

  it('un video que ya anda con cuadro no vuelve a llamar a play', async () => {
    const video = videoFalso({ paused: false });
    await asegurarCuadroDeVideo(video);
    expect(video.play).not.toHaveBeenCalled();
  });

  it('si play() es rechazado, tira el error y no deja capturar', async () => {
    const video = videoFalso({ play: jest.fn(async () => { throw new Error('NotAllowedError'); }) });
    await expect(asegurarCuadroDeVideo(video)).rejects.toMatchObject({ motivo: 'no-reproduce' });
    await expect(asegurarCuadroDeVideo(video)).rejects.toBeInstanceOf(CamaraSinCuadroError);
  });

  it('si play() no la pone a andar, tira el error', async () => {
    const video = videoFalso({ play: jest.fn(async () => undefined) });
    await expect(asegurarCuadroDeVideo(video)).rejects.toMatchObject({ motivo: 'no-reproduce' });
  });

  it('si no llega ningún cuadro a tiempo y el video sigue sin imagen, tira el error', async () => {
    const video = videoFalso({ readyState: 0, videoWidth: 0 } as any);
    await expect(asegurarCuadroDeVideo(video, { timeoutMs: 20 })).rejects.toMatchObject({ motivo: 'sin-cuadro' });
  });

  it('una señal quieta (imagen fija) que ya está andando con cuadro se usa, no se corta', async () => {
    // Pasó al arreglarlo: la cámara de prueba manda una imagen fija, nunca llega un cuadro NUEVO, y
    // la fotocabina se cortaba en todas las pruebas que andaban.
    const video = videoFalso({ paused: true } as any);
    await expect(asegurarCuadroDeVideo(video, { timeoutMs: 20 })).resolves.toBeUndefined();
    expect(video.play).toHaveBeenCalled();
  });
});

describe('la pantalla de la fotocabina usa la función antes de dibujar', () => {
  const pagina = fs.readFileSync(
    path.join(process.cwd(), 'src/app/evento/fotocabina/[fiestaId]/page.tsx'),
    'utf8',
  );
  const cuerpo = pagina.slice(pagina.indexOf('const captureToCanvas = async'));

  it('captureToCanvas espera el cuadro antes del drawImage y sale sin guardar si falla', () => {
    const espera = cuerpo.indexOf('await asegurarCuadroDeVideo');
    const dibuja = cuerpo.indexOf('ctx.drawImage(video');
    expect(espera).toBeGreaterThan(-1);
    expect(dibuja).toBeGreaterThan(espera);
    const aviso = cuerpo.slice(espera, dibuja);
    expect(aviso).toMatch(/catch[\s\S]*setErrorMsg[\s\S]*return;/);
  });

  it('hay un botón para reintentar la cámara cuando se muestra el aviso', () => {
    expect(pagina).toContain('boton-reintentar-camara');
  });
});
