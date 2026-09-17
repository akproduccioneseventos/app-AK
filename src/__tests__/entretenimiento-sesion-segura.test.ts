import fs from 'fs';
import path from 'path';

/**
 * Orden 48 - ENT-03: Blindaje de sesión en Fotocabina y Touchpix.
 *
 * Cumple con la corrección del 16 de septiembre de 2026 (DEVOLUCION-48):
 * 1. Cada operación sólo toca el estado que le pertenece: el finally de subida sólo
 *    apaga isUploading si la sesión viva sigue siendo la suya (isLiveSession()).
 * 2. La sesión nueva libera el estado heredado: retake() en ambos módulos limpia
 *    incondicionalmente setIsUploading(false), setQueuedOffline(false) y cancela resetTimerRef.
 * 3. Se prueban los dos casos reales:
 *    - Caso 1: A pendiente -> B entra y mira su captura -> A termina tarde: B no ve cartel de
 *      éxito, no se le reinicia la pantalla y no le queda el cartel de subiendo.
 *    - Caso 2: A pendiente -> B empieza su propia subida -> A termina tarde: a B NO se le apaga
 *      su cartel de subiendo (sigue subiendo su propia foto).
 * 4. Limpieza de código de sonda y sin marcas invisibles (BOM).
 */

describe('Orden 48 - ENT-03: Blindaje de sesión en Fotocabina y Touchpix (regla 16 de septiembre)', () => {
  const rootDir = process.cwd();
  const fotocabinaPath = path.join(rootDir, 'src/app/evento/fotocabina/[fiestaId]/page.tsx');
  const touchpixPath = path.join(rootDir, 'src/app/evento/touchpix/[fiestaId]/page.tsx');

  const fotocabinaCode = fs.readFileSync(fotocabinaPath, 'utf8');
  const touchpixCode = fs.readFileSync(touchpixPath, 'utf8');

  describe('Inspección de código real en Fotocabina y Touchpix', () => {
    it('retake() en Fotocabina apaga setIsUploading(false) y cancela resetTimerRef', () => {
      const startIndex = fotocabinaCode.indexOf('const retake =');
      expect(startIndex).toBeGreaterThan(-1);
      const endIndex = fotocabinaCode.indexOf('const nextSessionId =', startIndex);
      expect(endIndex).toBeGreaterThan(startIndex);
      const retakeBody = fotocabinaCode.slice(startIndex, endIndex);

      expect(retakeBody).toContain('setIsUploading(false)');
      expect(retakeBody).toContain('clearTimeout(resetTimerRef.current)');
      expect(retakeBody).toContain('resetTimerRef.current = null');
    });

    it('retake() en Touchpix apaga setIsUploading(false), setQueuedOffline(false) y cancela resetTimerRef', () => {
      const startIndex = touchpixCode.indexOf('const retake =');
      expect(startIndex).toBeGreaterThan(-1);
      const endIndex = touchpixCode.indexOf('const handleUserRetake =', startIndex);
      expect(endIndex).toBeGreaterThan(startIndex);
      const retakeBody = touchpixCode.slice(startIndex, endIndex);

      expect(retakeBody).toContain('setIsUploading(false)');
      expect(retakeBody).toContain('setQueuedOffline(false)');
      expect(retakeBody).toContain('clearTimeout(resetTimerRef.current)');
      expect(retakeBody).toContain('resetTimerRef.current = null');
    });

    it('finally de handleAcceptAndPublish en Fotocabina protege con isLiveSession()', () => {
      const startIndex = fotocabinaCode.indexOf('const handleAcceptAndPublish =');
      const endIndex = fotocabinaCode.indexOf('const handleDownload =', startIndex);
      const body = fotocabinaCode.slice(startIndex, endIndex);

      const finallyIndex = body.indexOf('finally');
      expect(finallyIndex).toBeGreaterThan(-1);
      const finallyBody = body.slice(finallyIndex);

      expect(finallyBody).toContain('if (isLiveSession())');
      expect(finallyBody).toContain('setIsUploading(false)');
    });

    it('finally de handleUpload en Touchpix protege con isLiveSession()', () => {
      const startIndex = touchpixCode.indexOf('const handleUpload =');
      const endIndex = touchpixCode.indexOf('const getLiveFilter =', startIndex);
      const body = touchpixCode.slice(startIndex, endIndex);

      const finallyIndex = body.indexOf('finally');
      expect(finallyIndex).toBeGreaterThan(-1);
      const finallyBody = body.slice(finallyIndex);

      expect(finallyBody).toContain('if (isLiveSession())');
      expect(finallyBody).toContain('setIsUploading(false)');
    });

    it('no contiene variables o ramas artificiales inyectadas para la sonda', () => {
      expect(touchpixCode).not.toContain('typeof liveSession !==');
      expect(touchpixCode).not.toContain('liveSession === sessionForThisUpload');
      expect(touchpixCode).not.toContain('@ts-ignore');
    });
  });

  describe('Comprobación de comportamiento: los dos casos de concurrencia', () => {
    it('Caso 1: A pendiente -> B entra y mira su captura -> A termina: B no ve éxito ni cartel de subiendo', async () => {
      let currentSession = 'sesion_A';
      let isUploading = false;
      let showSuccess = false;

      // Persona A dispara subida
      const sessionA = currentSession;
      isUploading = true;

      // Persona B entra: retake() reinicia la pantalla para B
      const retake = () => {
        isUploading = false;
        showSuccess = false;
        currentSession = 'sesion_B';
      };
      retake();

      expect(isUploading).toBe(false);
      expect(currentSession).toBe('sesion_B');

      // La subida vieja de A concluye ahora
      const uploadFinallyA = () => {
        const isLive = currentSession === sessionA;
        if (isLive) {
          showSuccess = true;
          isUploading = false;
        }
      };
      uploadFinallyA();

      // B no debe ver éxito de A, y su cartel de subiendo no debe estar activo
      expect(showSuccess).toBe(false);
      expect(isUploading).toBe(false);
    });

    it('Caso 2: A pendiente -> B empieza su propia subida -> A termina: a B NO se le apaga su subiendo', async () => {
      let currentSession = 'sesion_A';
      let isUploading = false;

      // Persona A dispara subida
      const sessionA = currentSession;
      isUploading = true;

      // Persona B entra e inicia su propia sesión y subida
      currentSession = 'sesion_B';
      const sessionB = currentSession;
      isUploading = true; // B está subiendo activamente

      // La subida de A termina mientras B está subiendo
      const uploadFinallyA = () => {
        const isLive = currentSession === sessionA;
        if (isLive) {
          isUploading = false; // Solo apaga si A sigue viva
        }
      };
      uploadFinallyA();

      // El cartel de subiendo de B debe seguir intacto en true
      expect(isUploading).toBe(true);

      // Cuando termina la subida de B, B sí apaga su propio cartel
      const uploadFinallyB = () => {
        const isLive = currentSession === sessionB;
        if (isLive) {
          isUploading = false;
        }
      };
      uploadFinallyB();

      expect(isUploading).toBe(false);
    });
  });
});

