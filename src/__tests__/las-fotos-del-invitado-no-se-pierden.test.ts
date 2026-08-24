import { readFileSync } from 'fs';
import { join } from 'path';

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

    // El criterio tiene que estar al reves: se guarda salvo rechazo, no se guarda solo
    // si el mensaje de error contiene ciertas palabras.
    expect(fuente).toMatch(/esRechazoDelServidor/);
    expect(fuente).toMatch(/if \(pendingFile && !esRechazoDelServidor\)/);

    // La lista de palabras vieja dejaba afuera el "Load failed" del Safari del iPhone.
    expect(fuente).not.toMatch(/failed to fetch\|timeout/i);
  });

  it('la cola no borra una captura por cantidad de intentos', () => {
    const fuente = leer('src/lib/offline/offline-sync-manager.ts');

    // Habia un tope de tres intentos y despues se borraba sola. Con senal intermitente
    // en un salon eso se cumple en minutos.
    expect(fuente).not.toMatch(/attempts\s*>=\s*\d/);
  });

  it('una sesion vencida no cuenta como error definitivo', () => {
    const fuente = leer('src/lib/offline/offline-sync-manager.ts');
    const permanentes = fuente.slice(
      fuente.indexOf('function isPermanentError'),
      fuente.indexOf('function isDuplicateError'),
    );

    // Si la sesion del invitado vence en el medio de la fiesta llega como "no
    // autorizado". Descartar ahi le borra la foto a alguien que no hizo nada mal.
    expect(permanentes).not.toMatch(/no autorizad/i);
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
