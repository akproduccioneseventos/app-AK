/** @jest-environment node */

let mockAjustes = {
  comentarios: true,
  mensajesDirectos: true,
};

jest.mock('@/lib/social-media/comments-backfill', () => ({
  getAjustesRespuestasComentarios: jest.fn(async () => mockAjustes),
}));

let mockTopesStore: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_file: string, fallback: any) => mockTopesStore || fallback),
  writeData: jest.fn(async (_file: string, data: any) => {
    mockTopesStore = data;
  }),
}));

import { evaluarRespuestaAutomatica } from '@/lib/mensajes/bandeja-unica';

describe('Lo que se contesta solo respeta las reglas', () => {
  beforeEach(() => {
    mockAjustes = {
      comentarios: true,
      mensajesDirectos: true,
    };
    mockTopesStore = {};
  });

  it('la pregunta en un comentario se contesta sola', async () => {
    const res = await evaluarRespuestaAutomatica({
      canal: 'instagram_comentario',
      texto: '¿Tienen fecha libre para noviembre?',
      remitenteId: 'user_1',
      esCliente: false,
    });

    expect(res.respondeSolo).toBe(true);
    expect(res.respuesta).toBeDefined();
    expect(res.respuesta?.length).toBeGreaterThan(10);
  });

  it('la queja NO se contesta sola', async () => {
    const res = await evaluarRespuestaAutomatica({
      canal: 'instagram_comentario',
      texto: 'Es un desastre la atención, pésimo servicio',
      remitenteId: 'user_2',
      esCliente: false,
    });

    expect(res.respondeSolo).toBe(false);
    expect(res.motivo).toMatch(/queja/i);
  });

  it('el mensaje directo de un cliente con fiesta contratada NO se contesta solo', async () => {
    const res = await evaluarRespuestaAutomatica({
      canal: 'instagram_dm',
      texto: 'Hola, quería coordinar la música de mi fiesta',
      remitenteId: 'cliente_123',
      esCliente: true, // Cliente contratado
    });

    expect(res.respondeSolo).toBe(false);
    expect(res.motivo).toMatch(/cliente_contratado/i);
  });

  it('el WhatsApp de un número sin anuncio NO se contesta solo', async () => {
    const res = await evaluarRespuestaAutomatica({
      canal: 'whatsapp',
      texto: 'Hola che, cómo andás?',
      remitenteId: 'amigo_456',
      esCliente: false,
      vinoDeAnuncio: false, // Sin anuncio
    });

    expect(res.respondeSolo).toBe(false);
    expect(res.motivo).toMatch(/sin_anuncio/i);
  });

  it('con el interruptor apagado, nada sale solo', async () => {
    mockAjustes.comentarios = false;

    const resComentario = await evaluarRespuestaAutomatica({
      canal: 'instagram_comentario',
      texto: '¿Cuál es el precio del servicio?',
      remitenteId: 'user_3',
      esCliente: false,
    });

    expect(resComentario.respondeSolo).toBe(false);
    expect(resComentario.motivo).toMatch(/interruptor/i);

    mockAjustes.mensajesDirectos = false;
    const resDM = await evaluarRespuestaAutomatica({
      canal: 'instagram_dm',
      texto: 'Hola!',
      remitenteId: 'user_4',
      esCliente: false,
    });

    expect(resDM.respondeSolo).toBe(false);
    expect(resDM.motivo).toMatch(/interruptor/i);
  });

  it('el cuarto mensaje del día de la misma persona no sale', async () => {
    const hoyStr = new Date().toISOString().split('T')[0];
    mockTopesStore = {
      'user_pesado': { fecha: hoyStr, count: 3 }, // Ya consumió 3 respuestas hoy
    };

    const res = await evaluarRespuestaAutomatica({
      canal: 'instagram_comentario',
      texto: '¿Y hacen fiestas de 15?',
      remitenteId: 'user_pesado',
      esCliente: false,
    });

    expect(res.respondeSolo).toBe(false);
    expect(res.motivo).toMatch(/tope_diario/i);
  });

  it('ninguna respuesta automática contiene "$", "garantía", "24/7" ni "congel"', async () => {
    const res = await evaluarRespuestaAutomatica({
      canal: 'instagram_comentario',
      texto: '¿Tienen presupuesto para cumpleaños?',
      remitenteId: 'user_5',
      esCliente: false,
    });

    expect(res.respondeSolo).toBe(true);
    const resp = res.respuesta || '';
    expect(resp).not.toContain('$');
    expect(resp.toLowerCase()).not.toMatch(/garant[ií]a|24\/7|congel/i);
  });
});
