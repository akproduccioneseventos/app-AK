/**
 * @jest-environment node
 *
 * Pruebas del Centro Unificado de Redes Sociales, Presencia Online,
 * Contestaciones Automáticas por Reglas y Derivación a WhatsApp/CRM.
 */

import {
  evaluarReglaParaComentario,
  detectarIntencionComentario,
  armarMensajeWhatsAppDesdeComentario,
  limpiarNumerosDePrecio,
  REGLAS_AUTO_RESPUESTA_POR_DEFECTO,
  replyToCommentInternal,
  responderPendientesEnLoteInternal,
} from '@/lib/social-media/comments-backfill';
import type { SocialComment } from '@/types/comentarios-redes';

const base: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (f in base ? copia(base[f]) : d)),
  writeData: jest.fn(async (f: string, d: any) => {
    base[f] = copia(d);
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, cambiar: (l: any[]) => any[] | null) => {
    const nueva = cambiar(copia(base[file] ?? []));
    if (nueva) base[file] = copia(nueva);
    return nueva;
  }),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => true),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
}));

describe('Centro Unificado de Redes Sociales, Reglas Automáticas y WhatsApp', () => {
  beforeEach(() => {
    for (const k of Object.keys(base)) delete base[k];
  });

  it('evalúa reglas por palabra clave para precios, fechas, quince y casamientos sin inventar precios', () => {
    const reglaPrecio = evaluarReglaParaComentario(
      'Hola! Me pasás precio y presupuesto para noviembre?',
      'Instagram',
    );
    expect(reglaPrecio).not.toBeNull();
    expect(reglaPrecio?.id).toBe('regla_precios_presupuesto');
    expect(limpiarNumerosDePrecio(reglaPrecio!.respuestaPublica)).toBe(
      reglaPrecio!.respuestaPublica,
    );
    expect(reglaPrecio!.respuestaPublica.toLowerCase()).toContain('whatsapp');

    const reglaFecha = evaluarReglaParaComentario(
      '¿Tienen fecha disponible en octubre?',
      'Facebook',
    );
    expect(reglaFecha?.id).toBe('regla_fechas_disponibilidad');

    const reglaQuince = evaluarReglaParaComentario(
      'Queremos averiguar para fiesta de quince',
      'Instagram',
    );
    expect(reglaQuince?.id).toBe('regla_quince_anos');
  });

  it('detecta la intención del comentario (precio, fecha, elogio, reclamo, spam)', () => {
    const baseCom: SocialComment = {
      id: 'c1',
      network: 'Instagram',
      networkCommentId: 'n1',
      postId: 'p1',
      authorName: '@camila',
      text: '¿Cuánto sale para 100 invitados?',
      createdAt: '2026-10-16T12:00:00Z',
    };
    expect(detectarIntencionComentario(baseCom)).toBe('precio_presupuesto');

    expect(
      detectarIntencionComentario({
        ...baseCom,
        text: '¿Tienen libre el sábado que viene?',
      }),
    ).toBe('fecha_disponibilidad');

    expect(
      detectarIntencionComentario({
        ...baseCom,
        text: 'Fue una noche hermosa, gracias por todo!',
        sentiment: 'positivo',
      }),
    ).toBe('elogio');

    expect(
      detectarIntencionComentario({
        ...baseCom,
        text: 'Tardaron mucho en contestarme',
        isLegitimateComplaint: true,
      }),
    ).toBe('reclamo');
  });

  it('arma el mensaje de WhatsApp reemplazando autor, red y comentario sin dejar marcadores sueltos', () => {
    const com: SocialComment = {
      id: 'ig_99',
      network: 'Instagram',
      networkCommentId: '99',
      postId: 'p1',
      authorName: '@valentina_uy',
      text: 'Hola! Quería saber presupuesto para fiesta completa',
      createdAt: '2026-10-16T15:00:00Z',
    };

    const regla = evaluarReglaParaComentario(com.text, com.network);
    const mensaje = armarMensajeWhatsAppDesdeComentario(com, regla);

    expect(mensaje).toContain('valentina_uy');
    expect(mensaje).toContain('Instagram');
    expect(mensaje).not.toContain('{autor}');
    expect(mensaje).not.toContain('{red}');
    expect(mensaje).not.toContain('{comentario}');
  });

  it('responde en 1 clic o en lote registrando la regla aplicada sin pisar otros comentarios', async () => {
    base['social-comments.json'] = [
      {
        id: 'c_pendiente_1',
        network: 'Instagram',
        networkCommentId: 'net_1',
        postId: 'p1',
        authorName: 'Lucía',
        text: 'Hola, me pasan presupuesto e info por favor?',
        createdAt: '2026-10-16T14:00:00Z',
        esPregunta: true,
      },
      {
        id: 'c_elogio_2',
        network: 'Facebook',
        networkCommentId: 'net_2',
        postId: 'p2',
        authorName: 'Martín',
        text: 'Increíble fiesta!',
        createdAt: '2026-10-16T14:05:00Z',
        sentiment: 'positivo',
      },
    ];
    base['marketing-respuestas-comentarios.json'] = {
      activo: true,
      reglas: REGLAS_AUTO_RESPUESTA_POR_DEFECTO,
    };

    const batchRes = await responderPendientesEnLoteInternal();
    expect(batchRes.success).toBe(true);
    expect(batchRes.respondidosCount).toBe(1);

    const guardados = base['social-comments.json'] as SocialComment[];
    const respondido = guardados.find((c) => c.id === 'c_pendiente_1');
    expect(respondido?.respuestaAutomatica?.modo).toBe('regla_keyword');
    expect(respondido?.respuestaAutomatica?.reglaId).toBe('regla_precios_presupuesto');

    // También permite respuesta manual personalizada en otro comentario
    const manualRes = await replyToCommentInternal(
      'c_elogio_2',
      '¡Muchas gracias Martín por acompañarnos!',
    );
    expect(manualRes.success).toBe(true);
    const actualizado = (base['social-comments.json'] as SocialComment[]).find(
      (c) => c.id === 'c_elogio_2',
    );
    expect(actualizado?.respuestaAutomatica?.texto).toBe(
      '¡Muchas gracias Martín por acompañarnos!',
    );
    expect(actualizado?.respuestaAutomatica?.modo).toBe('manual');
  });

  it('convierte un comentario de red social en un prospecto del CRM con 1 clic', async () => {
    base['social-comments.json'] = [
      {
        id: 'c_lead_1',
        network: 'Instagram',
        networkCommentId: 'net_lead_1',
        postId: 'p1',
        authorName: '@sofi_quince',
        text: 'Quiero cotizar mis quince',
        createdAt: '2026-10-16T16:00:00Z',
      },
    ];
    base['crm-leads.json'] = [];

    const { createLeadFromCommentAction } = await import('@/app/actions/comentarios-redes');
    const res = await createLeadFromCommentAction('c_lead_1', '099111222');

    expect(res.success).toBe(true);
    expect(res.leadId).toBeTruthy();
    expect(base['crm-leads.json']).toHaveLength(1);
    expect(base['crm-leads.json'][0]).toMatchObject({
      name: 'sofi_quince',
      phone: '099111222',
      currentStageId: 'stage_1',
      crmTags: ['Instagram'],
    });

    const comentarioActualizado = base['social-comments.json'][0] as SocialComment;
    expect(comentarioActualizado.leadCreadoId).toBe(res.leadId);
  });
});
