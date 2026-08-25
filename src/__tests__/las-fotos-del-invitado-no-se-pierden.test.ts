import { readFileSync } from 'fs';
import { join } from 'path';
import { classifyOfflineUploadError } from '@/lib/offline/offline-upload-policy';

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf-8');

/**
 * Tres decisiones sobre las fotos que saca un invitado en la fiesta.
 *
 * Las tres nacieron del mismo lugar: una entrega que **pasaba los cuatro controles**
 * —acentos, tipos, todas las pruebas y el build— y aun asi le hacia perder la foto a
 * un invitado. El codigo estaba bien escrito; lo que estaba mal era la decision de
 * que hacer cuando falla la senal. Ninguna prueba lo agarraba porque no habia ninguna
 * que preguntara por eso. Estas son esas pruebas.
 */
describe('Las fotos del invitado no se pierden', () => {
  it('Touchpix guarda la foto ante cualquier falla, salvo un rechazo explicito del servidor', () => {
    const fuente = leer('src/app/evento/touchpix/[fiestaId]/page.tsx');

    expect(fuente).toContain('classifyOfflineUploadError(errMsg)');
    expect(fuente).toContain("uploadConfirmed || uploadDecision === 'duplicate'");
    expect(fuente).toContain("pendingFile && uploadDecision === 'retryable'");
    expect(classifyOfflineUploadError('Load failed')).toBe('retryable');
    expect(classifyOfflineUploadError('Acceso de cabina IA no autorizado.')).toBe('retryable');
    expect(classifyOfflineUploadError('Contenido inapropiado por moderación')).toBe('permanent');
    expect(classifyOfflineUploadError('Esta imagen ya fue subida anteriormente.')).toBe('duplicate');
  });

  it('la cola no borra una captura por cantidad de intentos', () => {
    const fuente = leer('src/lib/offline/offline-sync-manager.ts');

    // Habia un tope de tres intentos y despues se borraba sola. Con senal intermitente
    // en un salon eso se cumple en minutos.
    expect(fuente).not.toMatch(/attempts\s*>=\s*\d/);
  });

  it('una sesion vencida no cuenta como error definitivo', () => {
    // Si la sesion del invitado vence en el medio de la fiesta llega como "no
    // autorizado". Descartar ahi le borra la foto a alguien que no hizo nada mal.
    expect(classifyOfflineUploadError('Acceso de cabina IA no autorizado.')).toBe('retryable');
  });

  it('el metadata suelto de una captura no guarda llaves en la tableta', () => {
    const fuente = leer('src/lib/offline/offline-db.ts');
    const filtro = fuente.match(/SENSITIVE_OFFLINE_METADATA_KEY = (\/.*\/i);/);

    expect(filtro).not.toBeNull();
    const expresion = new RegExp(filtro![1].slice(1, -2), 'i');

    // Las tabletas de la fotocabina, el espejo magico y la plataforma 360 las usa un
    // invitado atras del otro: lo que queda escrito sobrevive al que lo dejo.
    for (const clave of ['accessToken', 'guestAccessToken', 'guestId', 'token', 'secret']) {
      expect(expresion.test(clave)).toBe(true);
    }
  });
});
