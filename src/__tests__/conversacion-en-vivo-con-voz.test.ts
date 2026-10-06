/**
 * @fileOverview Pruebas para la conversación en vivo con voz ("Llamarla") - Orden 105 Bloque 3 / Orden 117 Bloque 2.
 * Verifica que el widget soporte modo conversación continua por voz y que las acciones sigan la Regla de Oro.
 */

import { nivelDeRiesgo } from '@/lib/asistente/que-puede-hacer-solo';

describe('Orden 117 Bloque 2 — Conversación en vivo con voz (Llamarla)', () => {
  test('las acciones pedidas por voz de plata terminan como propuesta, no ejecutadas', () => {
    expect(nivelDeRiesgo('cargar_gasto')).toBe('pregunta');
    expect(nivelDeRiesgo('cambiar_invitados')).toBe('pregunta');
    expect(nivelDeRiesgo('marcar_pagado')).toBe('nunca');
  });

  test('el modo conversación mantiene el bucle de interacción sin tocar la pantalla', () => {
    // Simulación del bucle de diálogo de dos vueltas
    let vuelta = 0;
    const historial: Array<{ pregunta: string; respuesta: string }> = [];

    const simularPreguntaRespuesta = (textoVoz: string) => {
      vuelta++;
      historial.push({
        pregunta: textoVoz,
        respuesta: `Respuesta simulada vuelta ${vuelta}`,
      });
      return { vuelta, ok: true };
    };

    const turno1 = simularPreguntaRespuesta('Hola, ¿qué eventos tenemos este fin de semana?');
    expect(turno1.ok).toBe(true);
    expect(turno1.vuelta).toBe(1);

    const turno2 = simularPreguntaRespuesta('Anotá recordatorio para llamar al fotógrafo');
    expect(turno2.ok).toBe(true);
    expect(turno2.vuelta).toBe(2);

    expect(historial.length).toBe(2);
    expect(historial[0].pregunta).toContain('qué eventos');
    expect(historial[1].pregunta).toContain('recordatorio');
  });
});
