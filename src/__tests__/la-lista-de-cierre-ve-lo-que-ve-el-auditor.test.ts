/**
 * @jest-environment jsdom
 */
import { auditarDocumentoVisual } from '@/lib/visual/auditor-pantalla';

describe('Orden 313: la lista de cierre ve lo que ve el auditor', () => {
  const crearDoc = (html: string) => {
    document.open();
    document.write(`<!doctype html><html><body>${html}</body></html>`);
    document.close();
    return document;
  };

  it('da rojo cuando un botón se sale a 390 px', () => {
    const doc = crearDoc(
      `<button style="position:absolute; left:320px; width:120px;">Guardar cambios ahora</button>`,
    );
    const fallas = auditarDocumentoVisual(doc, 390);
    expect(fallas.some((f) => f.regla === 'desborde')).toBe(true);
  });

  it('da rojo cuando hay texto gris claro sobre fondo blanco (bajo contraste)', () => {
    const doc = crearDoc(
      `<div style="background-color: rgb(255, 255, 255);"><p style="color: rgb(210, 210, 210);">Texto ilegible</p></div>`,
    );
    const fallas = auditarDocumentoVisual(doc, 390);
    expect(fallas.some((f) => f.regla === 'contraste')).toBe(true);
  });

  it('da rojo cuando un título queda palabra por palabra (< 90 px con más de 3 palabras)', () => {
    const doc = crearDoc(
      `<h2 style="width: 70px;">Este título queda cortado palabra por palabra</h2>`,
    );
    const fallas = auditarDocumentoVisual(doc, 390);
    expect(fallas.some((f) => f.regla === 'palabra-por-palabra')).toBe(true);
  });

  it('da rojo cuando aparece una estrella o símbolo roto en el texto visible', () => {
    const doc = crearDoc(`<p>★ RECOMENDADO PRO para tu fiesta</p>`);
    const fallas = auditarDocumentoVisual(doc, 390);
    expect(fallas.some((f) => f.regla === 'simbolo-roto')).toBe(true);
  });

  it('da verde con una página prolija y legible', () => {
    const doc = crearDoc(
      `<div style="background-color: rgb(255, 255, 255);"><h1 style="width: 320px; color: rgb(15, 23, 42);">Presupuesto claro para tu fiesta</h1><p style="width: 320px; color: rgb(30, 41, 59);">Todo ordenado y legible.</p><button style="width: 180px; color: rgb(15, 23, 42);">Continuar</button></div>`,
    );
    const fallas = auditarDocumentoVisual(doc, 390);
    expect(fallas).toEqual([]);
  });
});
