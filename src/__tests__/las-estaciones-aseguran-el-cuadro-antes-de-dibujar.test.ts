/** @jest-environment node */
/**
 * Orden 145 (Codex, ENT93-CAM): Touchpix entregaba una foto NEGRA. El <video> de la camara esta
 * oculto con `autoplay`; el navegador lo deja en pausa con la senal viva (readyState 4, 640x480),
 * y dibujarlo en el lienzo da negro, aunque la captura "salga bien" y la descarga pese bytes. La
 * fotocabina ya lo arreglo con `asegurarCuadroDeVideo` (src/lib/entertainment/camera-readiness.ts);
 * Touchpix tenia el MISMO defecto y la regla del dueño manda barrer las demas estaciones.
 *
 * Que se controla, estacion por estacion: la funcion que dibuja el video en un lienzo PRIMERO espera
 * `asegurarCuadroDeVideo` (pone a andar el video y espera un cuadro real) y, si falla, avisa y NO
 * entrega la foto. El comportamiento del ayudante (pausado -> play, rechazado -> error, sin esperas
 * cuando ya anda) lo prueban sus propias pruebas puras.
 *
 * Probado rompiendo: (1) sacando el `await asegurarCuadroDeVideo(` de cualquiera de las siete
 * funciones, su caso se pone en rojo; (2) agregando una pagina nueva que dibuje un video sin
 * importar el ayudante, el barrido general se pone en rojo; (3) volviendo a `setStream` en Touchpix
 * (pedir la camara de nuevo en cada cambio de estado), el caso de Touchpix se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();
const leer = (ruta: string) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');

/** Cuerpo de la funcion desde su marca hasta que empieza a dibujar el video. */
function antesDeDibujar(fuente: string, marca: string): string {
  const inicio = fuente.indexOf(marca);
  expect(inicio).toBeGreaterThan(-1);
  const resto = fuente.slice(inicio);
  const dibuja = resto.search(/drawImage\(|procesarFondoCanvas\(/);
  expect(dibuja).toBeGreaterThan(-1);
  return resto.slice(0, dibuja);
}

const ESTACIONES: Array<[string, string, string]> = [
  ['touchpix', 'src/app/evento/touchpix/[fiestaId]/page.tsx', 'const captureRawPhoto'],
  ['fotocabina', 'src/app/evento/fotocabina/[fiestaId]/page.tsx', 'const captureToCanvas'],
  ['espejo magico', 'src/app/evento/espejo-magico/[fiestaId]/page.tsx', 'const captureToCanvas'],
  ['bogue', 'src/app/evento/bogue/[fiestaId]/page.tsx', 'const captureFramesSequence'],
  ['plataforma 360', 'src/app/evento/plataforma-360/[fiestaId]/page.tsx', 'const recordVideoDuration'],
  ['barra (foto del totem)', 'src/app/evento/barra/[fiestaId]/page.tsx', 'const capturePhoto'],
  ['buzon (foto)', 'src/app/evento/buzon/[fiestaId]/page.tsx', 'const takePhotoSnapshot'],
];

describe.each(ESTACIONES)('%s', (_nombre, ruta, marca) => {
  const fuente = leer(ruta);

  it('importa el ayudante y espera el cuadro ANTES de dibujar el video', () => {
    expect(fuente).toMatch(/import \{[^}]*asegurarCuadroDeVideo[^}]*\} from '@\/lib\/entertainment\/camera-readiness'/);
    const previo = antesDeDibujar(fuente, marca);
    expect(previo).toContain('await asegurarCuadroDeVideo(');
  });

  it('si la camara no entrega cuadro, avisa y corta: no sigue a dibujar ni a entregar', () => {
    const previo = antesDeDibujar(fuente, marca);
    const desdeLaEspera = previo.slice(previo.indexOf('await asegurarCuadroDeVideo('));
    expect(desdeLaEspera).toMatch(/catch[^{]*\{[\s\S]*?return/);
  });
});

describe('Touchpix en particular', () => {
  const fuente = leer('src/app/evento/touchpix/[fiestaId]/page.tsx');

  it('la captura es asincrona y quien la llama la espera (nada de foto antes del cuadro)', () => {
    expect(fuente).toMatch(/const captureRawPhoto = useCallback\(async \(\): Promise<string \| null>/);
    expect(fuente).toContain('const raw = await captureRawPhoto();');
  });

  it('re-engancha la senal viva al video antes de esperar', () => {
    const previo = antesDeDibujar(fuente, 'const captureRawPhoto');
    expect(previo).toContain('videoRef.current.srcObject = streamRef.current');
  });

  it('avisa en pantalla y ofrece "Reintentar camara" cuando no hay cuadro', () => {
    expect(fuente).toMatch(/La c[aá]mara no est[aá] entregando imagen/);
    expect(fuente).toContain('data-testid="boton-reintentar-camara"');
    expect(fuente).toContain('camaraSinCuadro');
  });

  it('reutiliza la senal viva de la misma camara en vez de pedirla de nuevo en cada cambio', () => {
    expect(fuente).not.toContain('setStream(');
    const inicio = fuente.indexOf('const startCamera = useCallback');
    const cuerpo = fuente.slice(inicio, fuente.indexOf('}, [facingMode, stopCamera]);', inicio));
    expect(cuerpo).toContain('streamFacingRef.current === facingMode');
    expect(cuerpo).toContain("readyState === 'live'");
    // El atajo va ANTES de cortar y pedir la camara otra vez.
    expect(cuerpo.indexOf("readyState === 'live'")).toBeLessThan(cuerpo.indexOf('stopCamera();'));
    expect(cuerpo.indexOf("readyState === 'live'")).toBeLessThan(cuerpo.indexOf('getUserMedia'));
  });

  it('cierra las pistas propias al salir', () => {
    const inicio = fuente.indexOf('const stopCamera = useCallback');
    const cuerpo = fuente.slice(inicio, fuente.indexOf('}, []);', inicio));
    expect(cuerpo).toContain('getTracks().forEach');
    expect(cuerpo).toContain('.stop()');
  });
});

describe('barrido: toda pantalla que dibuja un <video> de la camara usa el ayudante', () => {
  // Excepciones con motivo: no entregan una foto, miran el video para otra cosa.
  const EXCEPCIONES: Record<string, string> = {
    'src/app/evento/galeria/[fiestaId]/page.tsx':
      'saca un vector de 160 px para buscar fotos por cara, con el video visible; no entrega ninguna foto',
  };

  function paginas(dir: string): string[] {
    const salida: string[] = [];
    for (const entrada of fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
      const ruta = `${dir}/${entrada.name}`;
      if (entrada.isDirectory()) salida.push(...paginas(ruta));
      else if (/\.(tsx|ts)$/.test(entrada.name)) salida.push(ruta);
    }
    return salida;
  }

  it('no queda ninguna pantalla que dibuje el video sin asegurarse de que haya cuadro', () => {
    const sinAyudante: string[] = [];
    for (const ruta of [...paginas('src/app'), ...paginas('src/components')]) {
      const fuente = leer(ruta);
      if (!/drawImage\((video|videoRef\.current|v|vid)\b/.test(fuente)) continue;
      if (EXCEPCIONES[ruta]) continue;
      if (!fuente.includes('await asegurarCuadroDeVideo(')) sinAyudante.push(ruta);
    }
    expect(sinAyudante).toEqual([]);
  });
});
