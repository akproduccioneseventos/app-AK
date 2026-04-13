/**
 * Tests for InvitacionDigitalConfig defaults, builder, and template info.
 */

import { defaultInvitacionConfig, buildInvitacionConfigFromFiesta, PLANTILLA_INFO, TIPO_EVENTO_LABELS } from '@/lib/invitacion-config-defaults';
import type { InvitacionDigitalConfig } from '@/types/fiesta';

describe('defaultInvitacionConfig', () => {
  it('has correct default values', () => {
    expect(defaultInvitacionConfig.plantillaId).toBe('EleganteDorado');
    expect(defaultInvitacionConfig.tipoEvento).toBe('15');
    expect(defaultInvitacionConfig.estiloEvento).toBe('formal');
    expect(defaultInvitacionConfig.rsvpActivo).toBe(true);
    expect(defaultInvitacionConfig.contadorActivo).toBe(true);
    expect(defaultInvitacionConfig.portalSocialActivo).toBe(false);
    expect(defaultInvitacionConfig.dressCode.tipo).toBe('formal');
    expect(defaultInvitacionConfig.regalos.tipo).toBe('ninguno');
  });

  it('has all required color fields', () => {
    expect(defaultInvitacionConfig.colorPrincipal).toBeTruthy();
    expect(defaultInvitacionConfig.colorSecundario).toBeTruthy();
    expect(defaultInvitacionConfig.colorAcento).toBeTruthy();
  });

  it('defaults colorSugeridoInvitados to empty', () => {
    expect(defaultInvitacionConfig.colorSugeridoInvitados).toBe('');
  });
});

describe('buildInvitacionConfigFromFiesta', () => {
  it('fills config from fiesta data', () => {
    const fiesta = {
      configuracion: {
        nombreEvento: 'XV de Valentina',
        protagonista1Nombre: 'Valentina',
        tipoCelebracion: 'XV años',
        fechaEvento: '2026-06-15',
        horaInicio: '20:00',
        nombreLugar: 'Salón Paraíso',
        direccionLugar: 'Ruta 1 Km 10',
        googleMapsUrl: 'https://maps.google.com/test',
        primaryColor: '#ff69b4',
      },
    };

    const config = buildInvitacionConfigFromFiesta(fiesta as any);

    expect(config.nombreHomenajeada).toBe('Valentina');
    expect(config.tipoEvento).toBe('15');
    expect(config.fechaEvento).toBe('2026-06-15');
    expect(config.horaEvento).toBe('20:00');
    expect(config.nombreSalon).toBe('Salón Paraíso');
    expect(config.direccionSalon).toBe('Ruta 1 Km 10');
    expect(config.linkMaps).toBe('https://maps.google.com/test');
    expect(config.colorPrincipal).toBe('#ff69b4');
  });

  it('preserves existing config values', () => {
    const fiesta = {
      configuracion: {
        nombreEvento: 'XV de Ana',
        protagonista1Nombre: 'Ana',
      },
    };

    const existing: Partial<InvitacionDigitalConfig> = {
      nombreHomenajeada: 'Ana María',
      colorPrincipal: '#123456',
      plantillaId: 'ModernoMinimalista',
    };

    const config = buildInvitacionConfigFromFiesta(fiesta as any, existing);

    expect(config.nombreHomenajeada).toBe('Ana María');
    expect(config.colorPrincipal).toBe('#123456');
    expect(config.plantillaId).toBe('ModernoMinimalista');
  });

  it('maps event types correctly', () => {
    const testCases: Array<{ tipo: string; expected: string }> = [
      { tipo: 'XV años', expected: '15' },
      { tipo: 'XV Años', expected: '15' },
      { tipo: '18 años', expected: '18' },
      { tipo: 'Boda', expected: 'boda' },
      { tipo: 'Cumpleaños', expected: 'cumpleanos' },
      { tipo: 'Bautismo', expected: 'bautismo' },
      { tipo: 'Something else', expected: 'otro' },
    ];

    for (const { tipo, expected } of testCases) {
      const fiesta = { configuracion: { tipoCelebracion: tipo } };
      const config = buildInvitacionConfigFromFiesta(fiesta as any);
      expect(config.tipoEvento).toBe(expected);
    }
  });
});

describe('PLANTILLA_INFO', () => {
  it('has all 4 base templates', () => {
    expect(PLANTILLA_INFO).toHaveProperty('EleganteDorado');
    expect(PLANTILLA_INFO).toHaveProperty('ModernoMinimalista');
    expect(PLANTILLA_INFO).toHaveProperty('RomanticoFloral');
    expect(PLANTILLA_INFO).toHaveProperty('FiestaVibrante');
  });

  it('each template has nombre, descripcion, preview and categorias', () => {
    for (const [id, info] of Object.entries(PLANTILLA_INFO)) {
      expect(info.nombre).toBeTruthy();
      expect(info.descripcion).toBeTruthy();
      expect(info.preview).toBeTruthy();
      expect(info.categorias.length).toBeGreaterThan(0);
    }
  });
});

describe('TIPO_EVENTO_LABELS', () => {
  it('has labels for all event types', () => {
    expect(TIPO_EVENTO_LABELS['15']).toBe('Mis 15 Años');
    expect(TIPO_EVENTO_LABELS['18']).toBe('Mis 18 Años');
    expect(TIPO_EVENTO_LABELS['boda']).toBe('Nuestra Boda');
    expect(TIPO_EVENTO_LABELS['cumpleanos']).toBe('Mi Cumpleaños');
    expect(TIPO_EVENTO_LABELS['bautismo']).toBe('Mi Bautismo');
    expect(TIPO_EVENTO_LABELS['otro']).toBe('Evento Especial');
  });
});
