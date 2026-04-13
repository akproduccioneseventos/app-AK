/**
 * Tests for invitación digital configuration defaults, template info,
 * cronograma serialization, and colorSugeridoInvitados support.
 */

import {
  defaultInvitacionConfig,
  buildInvitacionConfigFromFiesta,
  TIPO_EVENTO_LABELS,
  PLANTILLA_INFO,
} from '@/lib/invitacion-config-defaults';
import type { InvitacionDigitalConfig, FiestaEnPlanificacion } from '@/types/fiesta';
import {
  defaultEventoInvitacionConfig,
  type EventoInvitacionConfig,
  type CronogramaItem,
} from '@/types/evento-invitacion';

describe('Invitación config defaults', () => {
  it('defaultInvitacionConfig has all required keys', () => {
    expect(defaultInvitacionConfig).toBeDefined();
    expect(defaultInvitacionConfig.nombreHomenajeada).toBe('');
    expect(defaultInvitacionConfig.tipoEvento).toBe('15');
    expect(defaultInvitacionConfig.estiloEvento).toBe('formal');
    expect(defaultInvitacionConfig.colorPrincipal).toBeTruthy();
    expect(defaultInvitacionConfig.rsvpActivo).toBe(true);
    expect(defaultInvitacionConfig.contadorActivo).toBe(true);
    expect(defaultInvitacionConfig.portalSocialActivo).toBe(false);
  });

  it('defaultInvitacionConfig includes colorSugeridoInvitados', () => {
    expect('colorSugeridoInvitados' in defaultInvitacionConfig).toBe(true);
    expect(typeof defaultInvitacionConfig.colorSugeridoInvitados).toBe('string');
  });

  it('defaultInvitacionConfig has valid dressCode defaults', () => {
    expect(defaultInvitacionConfig.dressCode).toBeDefined();
    expect(defaultInvitacionConfig.dressCode.tipo).toBe('formal');
  });

  it('defaultInvitacionConfig has valid regalos defaults', () => {
    expect(defaultInvitacionConfig.regalos).toBeDefined();
    expect(defaultInvitacionConfig.regalos.tipo).toBe('ninguno');
  });
});

describe('EventoInvitacionConfig defaults', () => {
  it('defaultEventoInvitacionConfig has colorSugeridoInvitados', () => {
    expect('colorSugeridoInvitados' in defaultEventoInvitacionConfig).toBe(true);
    expect(typeof defaultEventoInvitacionConfig.colorSugeridoInvitados).toBe('string');
  });

  it('defaultEventoInvitacionConfig includes cronograma array', () => {
    expect(Array.isArray(defaultEventoInvitacionConfig.cronograma)).toBe(true);
    expect(defaultEventoInvitacionConfig.cronograma).toHaveLength(0);
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

describe('PLANTILLA_INFO', () => {
  it('returns valid template info for all templates', () => {
    const templateIds = Object.keys(PLANTILLA_INFO);
    expect(templateIds.length).toBeGreaterThanOrEqual(4);

    for (const id of templateIds) {
      const info = PLANTILLA_INFO[id];
      expect(info.nombre).toBeTruthy();
      expect(info.descripcion).toBeTruthy();
      expect(info.preview).toBeTruthy();
      expect(Array.isArray(info.categorias)).toBe(true);
      expect(info.categorias.length).toBeGreaterThan(0);
    }
  });
});

describe('buildInvitacionConfigFromFiesta', () => {
  it('maps fiesta data correctly', () => {
    const fiesta = {
      configuracion: {
        protagonista1Nombre: 'Valentina',
        tipoCelebracion: 'XV años',
        fechaEvento: '2025-12-25',
        horaInicio: '20:00',
        nombreLugar: 'Salón El Paraíso',
        direccionLugar: 'Ruta 1 Km 10',
        googleMapsUrl: 'https://maps.google.com/test',
        primaryColor: '#FF0000',
      },
    } as unknown as Pick<FiestaEnPlanificacion, 'configuracion'>;

    const result = buildInvitacionConfigFromFiesta(fiesta);

    expect(result.nombreHomenajeada).toBe('Valentina');
    expect(result.tipoEvento).toBe('15');
    expect(result.fechaEvento).toBe('2025-12-25');
    expect(result.horaEvento).toBe('20:00');
    expect(result.nombreSalon).toBe('Salón El Paraíso');
    expect(result.direccionSalon).toBe('Ruta 1 Km 10');
    expect(result.linkMaps).toBe('https://maps.google.com/test');
    expect(result.colorPrincipal).toBe('#FF0000');
  });

  it('uses existing config values when provided', () => {
    const fiesta = {
      configuracion: {
        protagonista1Nombre: 'Valentina',
        tipoCelebracion: 'XV años',
      },
    } as unknown as Pick<FiestaEnPlanificacion, 'configuracion'>;

    const existing: Partial<InvitacionDigitalConfig> = {
      nombreHomenajeada: 'Camila',
      tipoEvento: '18',
    };

    const result = buildInvitacionConfigFromFiesta(fiesta, existing);

    expect(result.nombreHomenajeada).toBe('Camila');
    expect(result.tipoEvento).toBe('18');
  });
});

describe('Cronograma serialization', () => {
  it('serializes and deserializes cronograma items correctly', () => {
    const cronograma: CronogramaItem[] = [
      { hora: '20:00', actividad: 'Recepción', icono: '🥂' },
      { hora: '21:00', actividad: 'Cena', icono: '🍽️' },
      { hora: '23:00', actividad: 'Baile', icono: '💃' },
    ];

    const serialized = JSON.stringify(cronograma);
    const deserialized: CronogramaItem[] = JSON.parse(serialized);

    expect(deserialized).toHaveLength(3);
    expect(deserialized[0].hora).toBe('20:00');
    expect(deserialized[0].actividad).toBe('Recepción');
    expect(deserialized[0].icono).toBe('🥂');
    expect(deserialized[2].actividad).toBe('Baile');
  });

  it('config with cronograma serializes correctly', () => {
    const config: EventoInvitacionConfig = {
      ...defaultEventoInvitacionConfig,
      cronograma: [
        { hora: '20:00', actividad: 'Inicio', icono: '🎉' },
      ],
    };

    const json = JSON.stringify(config);
    const parsed: EventoInvitacionConfig = JSON.parse(json);

    expect(parsed.cronograma).toHaveLength(1);
    expect(parsed.cronograma![0].hora).toBe('20:00');
    expect(parsed.cronograma![0].actividad).toBe('Inicio');
  });
});
