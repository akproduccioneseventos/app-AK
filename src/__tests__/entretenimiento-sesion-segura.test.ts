import fs from 'fs';
import path from 'path';

/**
 * Orden 48 - ENT-03: Blindaje de sesión en Fotocabina y Touchpix sin colgar la pantalla.
 *
 * Cumple con la devolución DEVOLUCION-48-entretenimiento-sesion-segura.md:
 * 1. Inspecciona el código real de Fotocabina y Touchpix.
 * 2. Verifica que el apagado de setIsUploading(false) en finally no esté condicionado.
 * 3. Verifica que retake() en ambos módulos apague setIsUploading(false) y limpie resetTimerRef.
 * 4. Verifica que los temporizadores de reinicio estén debidamente almacenados en resetTimerRef.
 * 5. Verifica que no haya artefactos ni variables artificiales de sonda en la app de producción.
 */

describe('Orden 48 - ENT-03: Blindaje real de sesión en Fotocabina y Touchpix', () => {
  const rootDir = process.cwd();
  const fotocabinaPath = path.join(rootDir, 'src/app/evento/fotocabina/[fiestaId]/page.tsx');
  const touchpixPath = path.join(rootDir, 'src/app/evento/touchpix/[fiestaId]/page.tsx');

  const fotocabinaCode = fs.readFileSync(fotocabinaPath, 'utf8');
  const touchpixCode = fs.readFileSync(touchpixPath, 'utf8');

  describe('Fotocabina: apagado incondicional del cartel de subida y cancelación de timers', () => {
    it('el finally de handleAcceptAndPublish apaga setIsUploading(false) sin condicion', () => {
      const startIndex = fotocabinaCode.indexOf('const handleAcceptAndPublish =');
      expect(startIndex).toBeGreaterThan(-1);
      const endIndex = fotocabinaCode.indexOf('const handleDownload =', startIndex);
      expect(endIndex).toBeGreaterThan(startIndex);
      const body = fotocabinaCode.slice(startIndex, endIndex);

      const finallyMatch = body.match(/finally\s*\{([\s\S]*?)\}/);
      expect(finallyMatch).not.toBeNull();
      const finallyBody = finallyMatch![1];

      // Debe incluir setIsUploading(false)
      expect(finallyBody).toContain('setIsUploading(false)');

      // No debe estar condicionado con if (isLiveSession()) o similar
      expect(finallyBody).not.toMatch(/if\s*\([^)]*\)\s*\{[^}]*setIsUploading\(false\)/);
      expect(finallyBody).not.toMatch(/if\s*\([^)]*\)\s*setIsUploading\(false\)/);
    });

    it('retake() apaga setIsUploading(false) y cancela resetTimerRef', () => {
      const startIndex = fotocabinaCode.indexOf('const retake =');
      expect(startIndex).toBeGreaterThan(-1);
      const endIndex = fotocabinaCode.indexOf('const nextSessionId =', startIndex);
      expect(endIndex).toBeGreaterThan(startIndex);
      const retakeBody = fotocabinaCode.slice(startIndex, endIndex);

      expect(retakeBody).toContain('setIsUploading(false)');
      expect(retakeBody).toContain('clearTimeout(resetTimerRef.current)');
      expect(retakeBody).toContain('resetTimerRef.current = null');
    });

    it('las programaciones de reinicio se guardan en resetTimerRef', () => {
      expect(fotocabinaCode).toContain('resetTimerRef.current = setTimeout(');
    });
  });

  describe('Touchpix: apagado incondicional del cartel de subida y limpieza de sonda', () => {
    it('el finally de handleUpload apaga setIsUploading(false) sin condicion', () => {
      const startIndex = touchpixCode.indexOf('const handleUpload =');
      expect(startIndex).toBeGreaterThan(-1);
      const endIndex = touchpixCode.indexOf('const getLiveFilter =', startIndex);
      expect(endIndex).toBeGreaterThan(startIndex);
      const uploadBody = touchpixCode.slice(startIndex, endIndex);

      const finallyMatch = uploadBody.match(/finally\s*\{([\s\S]*?)\}/);
      expect(finallyMatch).not.toBeNull();
      const finallyBody = finallyMatch![1];

      expect(finallyBody).toContain('setIsUploading(false)');
      expect(finallyBody).not.toMatch(/if\s*\([^)]*\)\s*\{[^}]*setIsUploading\(false\)/);
      expect(finallyBody).not.toMatch(/if\s*\([^)]*\)\s*setIsUploading\(false\)/);
    });

    it('retake() en Touchpix apaga setIsUploading(false) y cancela resetTimerRef', () => {
      const startIndex = touchpixCode.indexOf('const retake =');
      expect(startIndex).toBeGreaterThan(-1);
      const endIndex = touchpixCode.indexOf('const handleUserRetake =', startIndex);
      expect(endIndex).toBeGreaterThan(startIndex);
      const retakeBody = touchpixCode.slice(startIndex, endIndex);

      expect(retakeBody).toContain('setIsUploading(false)');
      expect(retakeBody).toContain('clearTimeout(resetTimerRef.current)');
      expect(retakeBody).toContain('resetTimerRef.current = null');
    });

    it('no contiene variables o ramas artificiales inyectadas para la sonda', () => {
      expect(touchpixCode).not.toContain('typeof liveSession !==');
      expect(touchpixCode).not.toContain('liveSession === sessionForThisUpload');
      expect(touchpixCode).not.toContain('@ts-ignore');
    });

    it('isLiveSession evalua limpiamente la sesion viva contra el identificador de inicio', () => {
      expect(touchpixCode).toContain('const isLiveSession = () => currentPhotoSessionIdRef.current === sessionForThisUpload;');
    });

    it('las programaciones de reinicio se guardan en resetTimerRef', () => {
      expect(touchpixCode).toContain('resetTimerRef.current = setTimeout(');
    });
  });
});
