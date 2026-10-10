/**
 * @jest-environment node
 */
/**
 * Voz en vivo del asistente (orden 105, bloque 3) - partes puras y control del botón.
 *
 * - Cuenta de minutos: reserva de a 10 como máximo, no pasa el tope, empieza de cero cada día y
 *   devuelve lo reservado sin bajar de cero.
 * - Instrucciones: llevan el contexto del negocio, la regla "no ejecuto acciones por voz" y nada
 *   de promesas prohibidas (garantía, 24/7, plazos, precio congelado).
 * - La ficha pedida a Google es de un solo uso y lleva la voz y las instrucciones.
 * - Los Ajustes tienen su tarjeta y el widget tiene el botón "Hablar" enganchado a la sesión.
 *
 * Probado rompiéndolo: sacar la regla de acciones del prompt puso en rojo la prueba de la regla;
 * cambiar `uses: 1` por 5 puso en rojo la de un solo uso; sacar el botón del widget puso en rojo la
 * prueba del botón. Se restauró cada cosa.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  armarCuerpoFicha,
  armarInstruccionesDeVoz,
  devolverMinutos,
  direccionDelSocket,
  minutosPermitidosPorDia,
  modelosEnVivo,
  reservarMinutos,
  resumirContextoParaVoz,
} from '@/lib/asistente/voz-en-vivo';
import { ASISTENTE_SETTINGS_DEFAULT } from '@/lib/asistente/avisar-al-duenio';

const leer = (r: string) => fs.readFileSync(path.join(process.cwd(), r), 'utf8');

describe('minutos de voz en vivo', () => {
  it('reserva de a 10 como máximo y lo que queda si es menos', () => {
    expect(reservarMinutos({}, '2026-10-10', 60)).toEqual({ nuevo: { fecha: '2026-10-10', minutos: 10 }, reservados: 10 });
    expect(reservarMinutos({ fecha: '2026-10-10', minutos: 12 }, '2026-10-10', 15).reservados).toBe(3);
  });
  it('sin minutos no escribe nada', () => {
    expect(reservarMinutos({ fecha: '2026-10-10', minutos: 15 }, '2026-10-10', 15)).toEqual({ nuevo: null, reservados: 0 });
  });
  it('un día nuevo empieza de cero', () => {
    expect(reservarMinutos({ fecha: '2026-10-09', minutos: 99 }, '2026-10-10', 10).reservados).toBe(10);
  });
  it('devolver no baja de cero ni toca otro día', () => {
    expect(devolverMinutos({ fecha: 'x', minutos: 5 }, 'x', 10)).toEqual({ fecha: 'x', minutos: 0 });
    expect(devolverMinutos({ fecha: 'ayer', minutos: 5 }, 'hoy', 5)).toBeNull();
  });
  it('lo raro en Ajustes vuelve a 10 y 0 es apagada', () => {
    expect(minutosPermitidosPorDia(undefined)).toBe(10);
    expect(minutosPermitidosPorDia('abc')).toBe(10);
    expect(minutosPermitidosPorDia(-3)).toBe(10);
    expect(minutosPermitidosPorDia(0)).toBe(0);
    expect(minutosPermitidosPorDia(25)).toBe(25);
  });
  it('los Ajustes por omisión: prendida y 10 minutos', () => {
    expect(ASISTENTE_SETTINGS_DEFAULT.vozEnVivoActiva).toBe(true);
    expect(ASISTENTE_SETTINGS_DEFAULT.vozEnVivoMinutosPorDia).toBe(10);
  });
});

describe('instrucciones de la voz', () => {
  const texto = armarInstruccionesDeVoz('Fiesta de Ana en 3 días, debe $5000');
  it('llevan el contexto del negocio', () => {
    expect(texto).toContain('Fiesta de Ana en 3 días, debe $5000');
  });
  it('dicen que no ejecuta acciones por voz y que no inventa números', () => {
    expect(texto).toMatch(/No ejecuto acciones por voz/);
    expect(texto).toMatch(/lo dejás listo en el chat/);
    expect(texto).toMatch(/Nunca inventes números/);
  });
  it('no prometen garantía, 24/7 ni plazos', () => {
    expect(texto).not.toMatch(/garant|24\s*\/\s*7|24 horas|cero fallas/i);
  });
  it('el contexto largo se recorta', () => {
    expect(armarInstruccionesDeVoz('x'.repeat(20000)).length).toBeLessThan(7500);
  });
  it('el resumen del equipo se vuelve texto compacto', () => {
    const r = resumirContextoParaVoz({ summary: 'Resumen', items: [{ priority: 'alta', title: 'T', detail: 'D' }] });
    expect(r).toContain('Resumen');
    expect(r).toContain('[alta] T: D');
  });
});

describe('la ficha temporal', () => {
  const cuerpo = armarCuerpoFicha({ modelo: 'gemini-3.8-live', voz: 'Kore', instrucciones: 'hola', minutos: 10, ahora: new Date('2026-10-10T12:00:00Z') });
  it('es de un solo uso y vence con la sesión', () => {
    expect(cuerpo.uses).toBe(1);
    expect(cuerpo.expireTime).toBe('2026-10-10T12:11:00.000Z');
    expect(cuerpo.newSessionExpireTime).toBe('2026-10-10T12:01:00.000Z');
  });
  it('lleva el modelo, la voz y las instrucciones', () => {
    const c = cuerpo.liveConnectConstraints;
    expect(c.model).toBe('models/gemini-3.8-live');
    expect(c.config.responseModalities).toEqual(['AUDIO']);
    expect(c.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Kore');
    expect(c.config.systemInstruction.parts[0].text).toBe('hola');
  });
  it('el modelo se cambia por variable y el socket usa la ficha', () => {
    expect(modelosEnVivo('a, b')).toEqual(['a', 'b']);
    expect(modelosEnVivo(undefined)[0]).toBe('gemini-3.8-live');
    expect(direccionDelSocket('auth_tokens/x')).toBe(
      'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=auth_tokens%2Fx',
    );
  });
});

describe('Ajustes y widget', () => {
  it('la pantalla de Ajustes tiene la tarjeta con el interruptor y los minutos, y los guarda', () => {
    const pagina = leer('src/app/(app)/settings/asistente/page.tsx');
    expect(pagina).toContain('Voz en vivo');
    expect(pagina).toContain('Minutos por día');
    expect(pagina).toMatch(/vozEnVivoActiva,\s*\n\s*vozEnVivoMinutosPorDia/);
    expect(pagina).toMatch(/cada\s+minuto cuesta unos US\$0,02/);
  });
  it('el widget tiene el botón Hablar enganchado a la sesión en vivo y el botón Cortar', () => {
    const widget = leer('src/components/multiagent/multiagent-widget.tsx');
    expect(widget).toContain("from '@/lib/asistente/sesion-voz-en-vivo'");
    expect(widget).toMatch(/onClick=\{\(\) => void alternarVozEnVivo\(\)\}/);
    expect(widget).toContain('>Hablar</span>');
    expect(widget).toContain('Cortar');
    expect(widget).toContain('restantes');
    // El dictado de siempre sigue.
    expect(widget).toContain('toggleVoiceRecording');
  });
});
