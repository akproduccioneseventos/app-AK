import fs from 'fs';
import path from 'path';

/**
 * Control automático: Que no se cierre de más una puerta pública (Orden del 21 de agosto).
 *
 * Por qué existe esta prueba:
 * Dos veces en el mismo día, una entrega le puso control de sesión (requireAppSession)
 * a funciones que son públicas a propósito.
 *
 * Si se cierran:
 * - El tótem de la barra, la plataforma 360 y el tótem general dejan de encontrar la fiesta en pleno evento.
 * - El logo no carga en la pantalla de ingreso (/login).
 * - El cliente no puede marcar qué cosas lleva ni armar su tablero de decoración desde su portal.
 * - El simulador y portal se quedan sin poder leer las opciones de visualización de presupuesto.
 * - El motor automático de WhatsApp se queda sin poder leer ajustes ni plantillas.
 */

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

describe('Control anti-regresión: puertas públicas que NUNCA deben exigir sesión del equipo', () => {
  it('getFiestaActivaDeHoy NO exige requireAppSession (la usa el tótem de la barra y plataforma 360 sin cuenta)', () => {
    const fuente = leer('src/app/actions/fiesta-actual.ts');
    const match = fuente.match(/export\s+(?:async\s+)?function\s+getFiestaActivaDeHoy\b[^{]*\{([\s\S]*?)(?:\n\}|$)/);
    expect(match).toBeTruthy();
    expect(match![1]).not.toContain('requireAppSession()');
  });

  it('getInvoiceTemplateSettings NO exige requireAppSession (la pantalla /login necesita mostrar el logo de la empresa)', () => {
    const fuente = leer('src/app/actions/settings.ts');
    const match = fuente.match(/export\s+(?:async\s+)?function\s+getInvoiceTemplateSettings\b[^{]*\{([\s\S]*?)(?:\n\}|$)/);
    expect(match).toBeTruthy();
    expect(match![1]).not.toContain('requireAppSession()');
  });

  it('getBudgetDisplaySettings NO exige requireAppSession (la usan el simulador público y el portal del cliente)', () => {
    const fuente = leer('src/app/actions/settings.ts');
    const match = fuente.match(/export\s+(?:async\s+)?function\s+getBudgetDisplaySettings\b[^{]*\{([\s\S]*?)(?:\n\}|$)/);
    expect(match).toBeTruthy();
    expect(match![1]).not.toContain('requireAppSession()');
  });

  it('getWhatsAppSettings y getWhatsAppTemplates NO exigen requireAppSession (las usa el motor de WhatsApp sin cuenta)', () => {
    const fuente = leer('src/app/actions/settings.ts');
    const matchWa = fuente.match(/export\s+(?:async\s+)?function\s+getWhatsAppSettings\b[^{]*\{([\s\S]*?)(?:\n\}|$)/);
    const matchTpl = fuente.match(/export\s+(?:async\s+)?function\s+getWhatsAppTemplates\b[^{]*\{([\s\S]*?)(?:\n\}|$)/);
    expect(matchWa).toBeTruthy();
    expect(matchWa![1]).not.toContain('requireAppSession()');
    expect(matchTpl).toBeTruthy();
    expect(matchTpl![1]).not.toContain('requireAppSession()');
  });

  it('updateClienteDebeLlevar NO exige requireAppSession (lo toca el cliente desde su portal)', () => {
    const fuente = leer('src/app/actions/fiesta/fiesta.actions.ts');
    const match = fuente.match(/export\s+(?:async\s+)?function\s+updateClienteDebeLlevar\b[^{]*\{([\s\S]*?)(?:\n\}|$)/);
    expect(match).toBeTruthy();
    expect(match![1]).not.toContain('requireAppSession()');
  });

  it('updateDecoracion NO exige requireAppSession (el cliente arma su tablero desde su portal)', () => {
    const fuente = leer('src/app/actions/fiesta/decoracion.actions.ts');
    const match = fuente.match(/export\s+(?:async\s+)?function\s+updateDecoracion\b[^{]*\{([\s\S]*?)(?:\n\}|$)/);
    expect(match).toBeTruthy();
    expect(match![1]).not.toContain('requireAppSession()');
  });
});
