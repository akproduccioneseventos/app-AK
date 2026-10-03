/**
 * @fileOverview Comprobación de que los formatos de fecha no pierden lo que escribió una persona (Orden 109).
 * Pasa un ejemplo con hora por cada función y comprueba que la hora siga en la salida.
 */

import { fechaEventoEnTexto } from '@/lib/contract-template';
import { formatearFechaEvento } from '@/lib/fechas/formato-fecha-evento';
import { formatEventDate } from '@/lib/public-experience/event-date';
import { formatearFechaTiraFotocabina } from '@/lib/entretenimiento/tira-fotocabina';
import { formatEventDateHub } from '@/lib/fechas/formato-fecha-evento';

describe('Orden 109 — Los formatos de fecha no pierden lo escrito por una persona', () => {
  describe('fechaEventoEnTexto (contrato)', () => {
    it('conserva la hora con formato de barras', () => {
      const d = new Date(2026, 11, 15);
      const res = fechaEventoEnTexto('15/12/2026 a las 21:00', d);
      expect(res).toContain('21:00');
      expect(res).toContain('15 de diciembre de 2026');
    });

    it('conserva rango de horario con formato ISO', () => {
      const d = new Date(2026, 11, 15);
      const res = fechaEventoEnTexto('2026-12-15 de 21 a 04 hs', d);
      expect(res).toContain('de 21 a 04 hs');
      expect(res).toContain('15 de diciembre de 2026');
    });
  });

  describe('formatearFechaEvento (cartelería y hoja del DJ / PDF)', () => {
    it('conserva la hora si se ingresó con barras y horario', () => {
      const res = formatearFechaEvento('15/12/2026 a las 21:00');
      expect(res).toContain('21:00');
      expect(res).toContain('15 de diciembre de 2026');
    });

    it('conserva rango de horario con formato ISO y texto al lado', () => {
      const res = formatearFechaEvento('2026-12-15 de 21 a 04 hs');
      expect(res).toContain('de 21 a 04 hs');
      expect(res).toContain('15 de diciembre de 2026');
    });

    it('formatea correctamente fecha simple sin inventar hora', () => {
      const res = formatearFechaEvento('2026-09-30');
      expect(res).toContain('30 de setiembre de 2026');
    });
  });

  describe('formatEventDate (invitaciones públicas y pantalla del invitado)', () => {
    it('conserva la hora en formato con barras', () => {
      const res = formatEventDate('15/12/2026 a las 21:00');
      expect(res).not.toBeNull();
      expect(res!).toContain('21:00');
      expect(res!).toContain('15 de diciembre de 2026');
    });

    it('conserva el horario en formato ISO con texto', () => {
      const res = formatEventDate('2026-12-15 de 21 a 04 hs');
      expect(res).not.toBeNull();
      expect(res!).toContain('de 21 a 04 hs');
      expect(res!).toContain('15 de diciembre de 2026');
    });
  });

  describe('formatearFechaTiraFotocabina (tira de fotos impresa)', () => {
    it('conserva el horario al lado de la fecha', () => {
      const res = formatearFechaTiraFotocabina('2026-12-15 a las 21:00');
      expect(res).toContain('21:00');
      expect(res).toContain('15/12/2026');
    });

    it('mantiene la fecha con barras sin romper el horario', () => {
      const res = formatearFechaTiraFotocabina('15/12/2026 21:00 hs');
      expect(res).toBe('15/12/2026 21:00 hs');
    });
  });

  describe('formatEventDateHub (hub de bienvenida del invitado en el evento)', () => {
    it('conserva la hora si viene especificada', () => {
      const res = formatEventDateHub('15/12/2026 a las 21:00');
      expect(res).not.toBeNull();
      expect(res!).toContain('21:00');
      expect(res!).toContain('15 de diciembre de 2026');
    });

    it('conserva texto con rango de horario', () => {
      const res = formatEventDateHub('2026-12-15 de 21 a 04 hs');
      expect(res).not.toBeNull();
      expect(res!).toContain('de 21 a 04 hs');
      expect(res!).toContain('15 de diciembre de 2026');
    });
  });
});
