/**
 * Recordatorio de invitaciones no abiertas y registro de aperturas.
 * Comprueba:
 * - con token válido se anota la apertura una vez; con token inválido, nada
 * - a 10 días le escribe sólo a quien no abrió ni respondió
 * - no le escribe dos veces el mismo día
 * - apagado, no manda nada
 */

import { registrarQueAbrioLaInvitacion } from '@/app/actions/fiesta/invitados.actions';
import { correrTareaRecordarInvitacionNoAbierta } from '@/lib/invitaciones/recordatorio-no-abiertas';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const whatsAppEnviados: unknown[] = [];
const gmailsEnviados: unknown[] = [];
let archivos: Record<string, unknown> = {};

jest.mock('server-only', () => ({}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  hasAppSession: jest.fn(async () => true),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) => {
    if (archivo.startsWith('fiestas/')) {
      const id = archivo.replace('fiestas/', '').replace('.json', '');
      const fiestas = (archivos['fiestas.json'] as Array<{ id: string }>) || [];
      const f = fiestas.find((x) => x.id === id);
      return f || porDefecto;
    }
    return archivo in archivos ? archivos[archivo] : porDefecto;
  }),
  writeData: jest.fn(async (archivo: string, datos: unknown) => {
    archivos[archivo] = datos;
    if (archivo.startsWith('fiestas/')) {
      const id = archivo.replace('fiestas/', '').replace('.json', '');
      const fiestas = (archivos['fiestas.json'] as Array<{ id: string }>) || [];
      const idx = fiestas.findIndex((x) => x.id === id);
      if (idx >= 0) fiestas[idx] = datos as any;
      else fiestas.push(datos as any);
      archivos['fiestas.json'] = fiestas;
    }
  }),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(async (opts: unknown) => {
    whatsAppEnviados.push(opts);
    return { success: true };
  }),
}));

jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: jest.fn(async (opts: unknown) => {
    gmailsEnviados.push(opts);
    return { enviado: true };
  }),
}));

jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: jest.fn(async () => ({ success: true })),
}));

const AHORA = new Date('2026-10-01T12:00:00.000Z');
// 10 días después de AHORA
const FECHA_EVENTO_10_DIAS = new Date(AHORA.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();

describe('la invitación no abierta se recuerda sola y registra aperturas', () => {
  beforeEach(() => {
    whatsAppEnviados.length = 0;
    gmailsEnviados.length = 0;
    archivos = {};
    jest.clearAllMocks();
  });

  describe('registro de apertura con token', () => {
    it('con token válido se anota la apertura una vez; con token inválido, nada', async () => {
      const fiesta: FiestaEnPlanificacion = {
        id: 'f1',
        configuracion: {
          nombreEvento: 'Boda Vale y Juan',
          fechaEvento: FECHA_EVENTO_10_DIAS,
          tipoCelebracion: 'Boda',
          horaInicio: '21:00',
          horaFin: '05:00',
          nombreLugar: 'Salón Central',
          invitadosEstimados: 50,
          presupuestoEstimado: 100000,
          notesAdicionales: '',
        },
        invitados: [
          {
            id: 'g1',
            nombre: 'Pedro',
            rsvp: 'Pendiente',
            contacto: '099111222',
            guestAccessToken: 'token_seguro_123',
          },
        ],
        createdAt: AHORA.toISOString(),
        updatedAt: AHORA.toISOString(),
      };

      archivos['fiestas.json'] = [fiesta];

      // 1. Intento con token inválido: falla y no modifica
      const resInvalido = await registrarQueAbrioLaInvitacion('f1', 'g1', 'token_trucho');
      expect(resInvalido.success).toBe(false);
      let guardadas = archivos['fiestas.json'] as FiestaEnPlanificacion[];
      expect(guardadas[0].invitados?.[0].invitacionAbiertaAt).toBeUndefined();

      // 2. Intento con token válido: anota la fecha
      const resValido = await registrarQueAbrioLaInvitacion('f1', 'g1', 'token_seguro_123');
      expect(resValido.success).toBe(true);
      guardadas = archivos['fiestas.json'] as FiestaEnPlanificacion[];
      const fechaApertura = guardadas[0].invitados?.[0].invitacionAbiertaAt;
      expect(fechaApertura).toBeDefined();

      // 3. Segunda apertura: no pisa la fecha original
      await new Promise((r) => setTimeout(r, 10));
      await registrarQueAbrioLaInvitacion('f1', 'g1', 'token_seguro_123');
      guardadas = archivos['fiestas.json'] as FiestaEnPlanificacion[];
      expect(guardadas[0].invitados?.[0].invitacionAbiertaAt).toBe(fechaApertura);
    });
  });

  describe('tarea de recordatorio automático', () => {
    it('a 10 días le escribe sólo a quien no abrió ni respondió', async () => {
      archivos['ajustes-recordatorio-invitacion.json'] = { activo: true };

      const fiesta: FiestaEnPlanificacion = {
        id: 'f10',
        configuracion: {
          nombreEvento: '15 de Camila',
          fechaEvento: FECHA_EVENTO_10_DIAS,
          tipoCelebracion: '15 Años',
          horaInicio: '21:00',
          horaFin: '05:00',
          nombreLugar: 'Salón',
          invitadosEstimados: 50,
          presupuestoEstimado: 100000,
          notesAdicionales: '',
        },
        invitados: [
          // 1. No abrió y no respondió -> RECIBE WHATSAPP
          {
            id: 'g-pendiente',
            nombre: 'Lucía',
            rsvp: 'Pendiente',
            contacto: '099333444',
            guestAccessToken: 'tok_lucia',
          },
          // 2. Ya abrió la invitación -> NO RECIBE
          {
            id: 'g-abrio',
            nombre: 'Agustín',
            rsvp: 'Pendiente',
            contacto: '099555666',
            invitacionAbiertaAt: '2026-09-25T10:00:00Z',
          },
          // 3. Ya confirmó RSVP -> NO RECIBE
          {
            id: 'g-confirmo',
            nombre: 'Sofía',
            rsvp: 'Confirmado',
            contacto: '099777888',
          },
          // 4. Contacto es email y no abrió -> RECIBE GMAIL
          {
            id: 'g-email',
            nombre: 'Mariana',
            rsvp: 'Pendiente',
            contacto: 'mariana@ejemplo.com',
            guestAccessToken: 'tok_mariana',
          },
        ],
        createdAt: AHORA.toISOString(),
        updatedAt: AHORA.toISOString(),
      };

      archivos['fiestas.json'] = [fiesta];

      const resultado = await correrTareaRecordarInvitacionNoAbierta(AHORA);

      expect(resultado.corrio).toBe(true);
      expect(resultado.enviados).toBe(2); // Lucía (WhatsApp) y Mariana (Gmail)
      expect(whatsAppEnviados).toHaveLength(1);
      expect(gmailsEnviados).toHaveLength(1);
    });

    it('no le escribe dos veces el mismo día', async () => {
      archivos['ajustes-recordatorio-invitacion.json'] = { activo: true };

      const fiesta: FiestaEnPlanificacion = {
        id: 'f10_dup',
        configuracion: {
          nombreEvento: '15 de Camila',
          fechaEvento: FECHA_EVENTO_10_DIAS,
          tipoCelebracion: '15 Años',
          horaInicio: '21:00',
          horaFin: '05:00',
          nombreLugar: 'Salón',
          invitadosEstimados: 50,
          presupuestoEstimado: 100000,
          notesAdicionales: '',
        },
        invitados: [
          {
            id: 'g-recibe',
            nombre: 'Lucía',
            rsvp: 'Pendiente',
            contacto: '099333444',
            guestAccessToken: 'tok_lucia',
          },
        ],
        createdAt: AHORA.toISOString(),
        updatedAt: AHORA.toISOString(),
      };

      archivos['fiestas.json'] = [fiesta];

      // Primera corrida
      const res1 = await correrTareaRecordarInvitacionNoAbierta(AHORA);
      expect(res1.enviados).toBe(1);

      // Segunda corrida el mismo día: omitido porque ya tiene la fecha registrada
      const res2 = await correrTareaRecordarInvitacionNoAbierta(AHORA);
      expect(res2.enviados).toBe(0);
      expect(res2.omitidos).toBe(1);
    });

    it('apagado, no manda nada', async () => {
      archivos['ajustes-recordatorio-invitacion.json'] = { activo: false };

      const fiesta: FiestaEnPlanificacion = {
        id: 'f10_off',
        configuracion: {
          nombreEvento: '15 de Camila',
          fechaEvento: FECHA_EVENTO_10_DIAS,
          tipoCelebracion: '15 Años',
          horaInicio: '21:00',
          horaFin: '05:00',
          nombreLugar: 'Salón',
          invitadosEstimados: 50,
          presupuestoEstimado: 100000,
          notesAdicionales: '',
        },
        invitados: [
          {
            id: 'g-recibe',
            nombre: 'Lucía',
            rsvp: 'Pendiente',
            contacto: '099333444',
          },
        ],
        createdAt: AHORA.toISOString(),
        updatedAt: AHORA.toISOString(),
      };

      archivos['fiestas.json'] = [fiesta];

      const res = await correrTareaRecordarInvitacionNoAbierta(AHORA);
      expect(res.corrio).toBe(false);
      expect(res.enviados).toBe(0);
      expect(whatsAppEnviados).toHaveLength(0);
    });
  });
});
