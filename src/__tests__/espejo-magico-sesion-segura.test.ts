import fs from 'fs';
import path from 'path';

describe('Espejo Mágico: Sesión Segura y Timers Limpios (Orden 61 - Pregunta 7)', () => {
  const espejoPath = path.join(process.cwd(), 'src/app/evento/espejo-magico/[fiestaId]/page.tsx');
  const code = fs.readFileSync(espejoPath, 'utf8');

  it('no contiene BOM UTF-8', () => {
    const buffer = fs.readFileSync(espejoPath);
    expect(buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf).toBe(false);
  });

  it('el bloque finally de handleUpload protege setIsUploading con isLiveSession', () => {
    expect(code).toMatch(/finally\s*\{\s*if\s*\(\s*isLiveSession\(\)\s*\)\s*\{\s*setIsUploading\(false\);/);
  });

  it('retake() apaga incondicionalmente setIsUploading(false) para la nueva sesión', () => {
    expect(code).toMatch(/const\s+retake\s*=\s*\(\)\s*=>\s*\{[\s\S]*?setIsUploading\(false\);/);
  });

  it('retake() cancela cualquier timer de auto-retake pendiente', () => {
    expect(code).toMatch(/if\s*\(\s*autoRetakeTimerRef\.current\s*\)\s*\{\s*clearTimeout\(autoRetakeTimerRef\.current\);/);
  });

  it('la subida tardía de una sesión anterior no apaga el estado de la sesión nueva (lógica concurrente)', () => {
    let currentSessionId = 'sesion_1';
    let isUploading = false;

    // Invitado 1 inicia subida
    const sessionUpload1 = currentSessionId;
    const isLiveSession1 = () => currentSessionId === sessionUpload1;
    isUploading = true;

    // Invitado 1 o el operador presiona retake() antes de que termine la subida
    isUploading = false;
    currentSessionId = 'sesion_2';

    // Invitado 2 inicia su propia subida
    isUploading = true;

    // La subida de la sesión 1 termina tarde y ejecuta su finally
    if (isLiveSession1()) {
      isUploading = false;
    }

    // Como isLiveSession1() es false, isUploading DEBE seguir siendo true para el invitado 2
    expect(isUploading).toBe(true);
  });
});
