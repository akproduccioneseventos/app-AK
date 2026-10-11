/**
 * Si se sale de la pantalla mientras el navegador pide el permiso de cámara/micrófono, la señal que
 * llega después se guardaba sin mirar si la pantalla seguía: la cámara quedaba prendida sin dueño.
 * Cada lugar tiene una bandera de desmontado (puesta en un efecto con cleanup) y la mira ANTES de
 * guardar lo que devolvió el permiso, apagando las pistas.
 *
 * Es un control de código (no de render): el de render está en el-totem-apaga-el-microfono.test.tsx.
 * Probado rompiendo: sacando el `if (desmontadoRef.current)` de cualquiera, su caso se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

const CAMARAS: { archivo: string; guarda: RegExp }[] = [
  { archivo: 'src/app/evento/barra/[fiestaId]/page.tsx', guarda: /streamRef\.current = stream;/ },
  { archivo: 'src/app/evento/fotocabina/[fiestaId]/page.tsx', guarda: /streamRef\.current = mediaStream;/ },
  { archivo: 'src/app/evento/touchpix/[fiestaId]/page.tsx', guarda: /streamRef\.current = mediaStream;/ },
  { archivo: 'src/app/portal-cliente/[id]/videos-invitados/page.tsx', guarda: /mediaStreamRef\.current = stream;/ },
  { archivo: 'src/components/reuniones/MeetingIntelligenceRecorder.tsx', guarda: /streamRef\.current = stream;/ },
  { archivo: 'src/app/evento/plataforma-360/[fiestaId]/page.tsx', guarda: /streamRef\.current = mediaStream;/ },
  { archivo: 'src/app/evento/muro-en-vivo/[fiestaId]/page.tsx', guarda: /mediaStreamRef\.current = stream;/ },
];

describe('las cámaras y micrófonos se apagan si se sale mientras se pide el permiso', () => {
  it.each(CAMARAS)('$archivo mira el desmontado y apaga las pistas antes de guardar la señal', ({ archivo, guarda }) => {
    const fuente = leer(archivo);
    expect(fuente).toMatch(/const desmontadoRef = useRef\(false\)/);
    expect(fuente).toMatch(/desmontadoRef\.current = true;/);
    const iGuarda = fuente.search(guarda);
    expect(iGuarda).toBeGreaterThan(0);
    const antes = fuente.slice(Math.max(0, iGuarda - 260), iGuarda);
    expect(antes).toMatch(/if \(desmontadoRef\.current\) \{\s*\w+\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\);\s*return;/);
  });

  const ESCANERES = [
    'src/app/evento/accesos/[fiestaId]/page.tsx',
    'src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx',
    'src/app/evento/bienvenida/[fiestaId]/page.tsx',
  ];
  it.each(ESCANERES)('%s no arranca el escáner si la pantalla ya se desmontó', (archivo) => {
    const fuente = leer(archivo);
    expect(fuente).toMatch(/const desmontadoRef = useRef\(false\)/);
    expect(fuente).toMatch(/desmontadoRef\.current = true;/);
    expect(fuente).toMatch(/track\.stop\(\)\);\s*if \(desmontadoRef\.current\) return;/);
    expect(fuente).toMatch(/if \(scannerRef\.current \|\| desmontadoRef\.current\) return;/);
  });
});
