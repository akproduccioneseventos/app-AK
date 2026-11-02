/** @jest-environment node */

import { NextRequest } from 'next/server';

const memoryStore: Record<string, any> = {};

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
  authAdmin: null,
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    await new Promise((r) => setTimeout(r, Math.random() * 5));
    if (memoryStore[file] !== undefined) {
      return JSON.parse(JSON.stringify(memoryStore[file]));
    }
    return JSON.parse(JSON.stringify(fallback));
  }),
  readDataConDetalle: jest.fn(async (file: string, fallback: any) => {
    await new Promise((r) => setTimeout(r, Math.random() * 5));
    if (memoryStore[file] !== undefined) {
      return { valor: JSON.parse(JSON.stringify(memoryStore[file])), huboFalla: false };
    }
    return { valor: JSON.parse(JSON.stringify(fallback)), huboFalla: false };
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    await new Promise((r) => setTimeout(r, Math.random() * 5));
    memoryStore[file] = JSON.parse(JSON.stringify(data));
    return true;
  }),
}));

const mockSendMetaWhatsAppMessage = jest.fn();
jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => mockSendMetaWhatsAppMessage(...args),
}));

const mockPrepararBorrador = jest.fn();
jest.mock('@/lib/asistente/comercial-borrador', () => ({
  prepararBorradorProspectoAnuncio: (...args: any[]) => mockPrepararBorrador(...args),
}));

const mockAgregarPropuestasDeduplicadas = jest.fn();
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: (...args: any[]) => mockAgregarPropuestasDeduplicadas(...args),
}));

const mockCorrespondeContestarSolo = jest.fn();
jest.mock('@/lib/whatsapp/vino-de-la-publicidad', () => ({
  correspondeContestarSolo: (...args: any[]) => mockCorrespondeContestarSolo(...args),
}));

const mockProcessIncomingMessage = jest.fn();
jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(async () => ({ enabled: true })),
  processIncomingMessage: (...args: any[]) => mockProcessIncomingMessage(...args),
}));

import { POST } from '@/app/api/whatsapp/webhook/route';
import {
  extraerDatosPresupuestoProspecto,
  enlaceAlSimuladorDelProspecto,
} from '@/lib/asistente/por-whatsapp';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { darOrdenPorVozOTexto } from '@/app/actions/centro-de-control';

function crearMetaRequest(texto: string, messageId: string, phone = '59899111222', referral: any = { source_type: 'ad' }) {
  return new NextRequest('https://akproducciones.uy/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ profile: { name: 'Lucía' } }],
                messages: [
                  {
                    id: messageId,
                    from: phone,
                    type: 'text',
                    text: { body: texto },
                    referral,
                  },
                ],
              },
            },
          ],
        },
      ],
    }),
  });
}

describe('Orden 262: El prospecto del anuncio va al simulador', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }

    mockCorrespondeContestarSolo.mockResolvedValue(true);
    mockSendMetaWhatsAppMessage.mockResolvedValue({ success: true, messageId: 'wa-meta-ok-1' });
    mockPrepararBorrador.mockResolvedValue({
      status: 'draft_created',
      presupuestoId: 'presupuesto-draft-262',
      photoIds: ['f1', 'f2', 'f3'],
    });
    mockAgregarPropuestasDeduplicadas.mockResolvedValue(undefined);
    mockProcessIncomingMessage.mockResolvedValue({ success: true });
  });

  test('(a) "15 años, 120 invitados, marzo 2027, Club Uruguay" envía enlace con los parámetros correctos', async () => {
    const texto = '15 años, 120 invitados, marzo 2027, Club Uruguay';
    const datos = extraerDatosPresupuestoProspecto(texto);

    expect(datos.invitados).toBe(120);
    expect(datos.tipoEvento).toBe('XV años');
    expect(datos.fecha).toBe('2027-03-01');
    expect(datos.salon).toBe('Club Uruguay');

    const enlace = enlaceAlSimuladorDelProspecto(datos);
    expect(enlace).toContain('guests=120');
    expect(enlace).toContain('tipo=15');
    expect(enlace).toContain('mes=2027-03');
    expect(enlace).toContain('salon=club');
    expect(enlace).toContain('entry=whatsapp_anuncio');
    expect(enlace.startsWith('https://akproducciones.uy/simulador-de-presupuesto?')).toBe(true);

    const req = crearMetaRequest(texto, 'wamid-caso-a');
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tipo).toBe('prospecto_anuncio_completo');
    expect(data.respondido).toBe(true);

    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
    const mensajeEnviado = mockSendMetaWhatsAppMessage.mock.calls[0][0].text;
    expect(mensajeEnviado).toContain(enlace);
    expect(mensajeEnviado).toContain('¡Gracias! Con lo que nos contaste ya podés ver tu presupuesto en el momento:');
    expect(mensajeEnviado).toContain('Al final vas a poder reservar una entrevista gratuita y sin compromiso');
  });

  test('(b) Mismo messageId dos veces -> un solo envío', async () => {
    const texto = '15 años, 120 invitados, marzo 2027, Club Uruguay';
    const req1 = crearMetaRequest(texto, 'wamid-dup-123');
    const req2 = crearMetaRequest(texto, 'wamid-dup-123');

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.respondido).toBe(false);
    expect(data2.motivo).toContain('duplicado');

    // No se volvió a llamar a sendMetaWhatsAppMessage
    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
  });

  test('(c) Falta el salón -> se envía la pregunta pidiendo lo que falta, no el enlace', async () => {
    const textoIncompleto = 'Hola, cumplimos 15 años, somos 120 personas para marzo 2027';
    const req = crearMetaRequest(textoIncompleto, 'wamid-falta-salon');

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tipo).toBe('prospecto_anuncio_incompleto');
    expect(data.respondido).toBe(true);

    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
    const textoEnviado = mockSendMetaWhatsAppMessage.mock.calls[0][0].text;
    expect(textoEnviado).toContain('el salón o zona del evento');
    expect(textoEnviado).not.toContain('https://akproducciones.uy/simulador-de-presupuesto');
  });

  test('(d) Número que no viene de anuncio (correspondeContestarSolo da false) -> no se envía nada', async () => {
    mockCorrespondeContestarSolo.mockResolvedValueOnce(false);

    const req = crearMetaRequest('Hola, cuánto sale la fiesta?', 'wamid-sin-anuncio', '59899888777', null);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.respondido).toBe(false);
    expect(data.motivo).toContain('No viene de la publicidad');

    expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();
    expect(mockPrepararBorrador).not.toHaveBeenCalled();
  });

  test('(e) Si Meta falla, se crea la propuesta "Contestar al prospecto: no salió el mensaje automático" y el borrador sigue existiendo', async () => {
    mockSendMetaWhatsAppMessage.mockResolvedValueOnce({ success: false, error: 'Network timeout to Meta Graph API' });

    const texto = '15 años, 120 invitados, marzo 2027, Club Uruguay';
    const req = crearMetaRequest(texto, 'wamid-falla-meta');

    const res = await POST(req);
    expect(res.status).toBe(200);

    // El borrador fue creado
    expect(mockPrepararBorrador).toHaveBeenCalledTimes(1);

    // Se registró la propuesta de fallo en la bandeja
    expect(mockAgregarPropuestasDeduplicadas).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          clave: 'prospecto-anuncio-fallo-envio:wamid-falla-meta',
          titulo: 'Contestar al prospecto: no salió el mensaje automático',
          area: 'ventas',
          tipoPropuesta: 'prospecto_envio_fallido',
          nivelRiesgo: 'aviso',
        }),
      ])
    );
  });

  test('(f) Ningún mensaje enviado contiene "$", "garant" ni "congel"', async () => {
    // 1. Mensaje de anuncio completo
    const req1 = crearMetaRequest('15 años, 120 invitados, marzo 2027, Club Uruguay', 'wamid-check-f1');
    await POST(req1);

    // 2. Mensaje de anuncio incompleto
    const req2 = crearMetaRequest('Hola, somos 100 personas', 'wamid-check-f2');
    await POST(req2);

    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(2);

    for (const llamada of mockSendMetaWhatsAppMessage.mock.calls) {
      const msg: string = llamada[0].text;
      expect(msg).not.toContain('$');
      expect(msg.toLowerCase()).not.toContain('garant');
      expect(msg.toLowerCase()).not.toContain('congel');
    }
  });

  test('Guardado concurrente de scheduled-messages.json con mutateGenericJsonArray', async () => {
    const mensajesNuevos = Array.from({ length: 10 }, (_, i) => ({
      id: `sched-${i}`,
      idEstable: `estab-${i}`,
      destinatario: `5989900000${i}`,
      contenido: `Mensaje de prueba ${i}`,
      fechaEnvio: '2026-11-05T12:00:00Z',
    }));

    // Ejecutar 10 guardados en paralelo compitiendo por scheduled-messages.json
    await Promise.all(
      mensajesNuevos.map((m) =>
        mutateGenericJsonArray<any>('scheduled-messages.json', (actuales) => {
          const lista = actuales || [];
          const ids = new Set(lista.map((x: any) => x.idEstable || x.id));
          return [...lista, ...[m].filter((n: any) => !ids.has(n.idEstable || n.id))];
        })
      )
    );

    // Verificar que los 10 mensajes fueron guardados sin pérdida concurrente
    const resultado = memoryStore['scheduled-messages.json'] || [];
    expect(resultado).toHaveLength(10);

    const idsGuardados = new Set(resultado.map((r: any) => r.id));
    for (let i = 0; i < 10; i++) {
      expect(idsGuardados.has(`sched-${i}`)).toBe(true);
    }

    // Si se reinserta un duplicado concurrente, no debe duplicar
    await mutateGenericJsonArray<any>('scheduled-messages.json', (actuales) => {
      const lista = actuales || [];
      const ids = new Set(lista.map((x: any) => x.idEstable || x.id));
      return [...lista, ...[mensajesNuevos[0]].filter((n: any) => !ids.has(n.idEstable || n.id))];
    });

    const trasDuplicado = memoryStore['scheduled-messages.json'] || [];
    expect(trasDuplicado).toHaveLength(10);
  });
  test('(g) Bloque 4: consulta "¿cuántas fiestas tengo este mes?" desde el Centro de control según perfil', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    memoryStore['fiestas.json'] = [
      {
        id: 'fiesta-1',
        configuracion: {
          nombreEvento: 'XV de Martina',
          fechaEvento: hoy,
        },
        estado: 'Confirmada',
        tareas: [],
      },
    ];
    memoryStore['presupuestos.json'] = [
      {
        id: 'pres-1',
        estado: 'Aceptado',
        clienteNombre: 'Martina',
        costoTotalEstimado: 120000,
        pagosCliente: [],
      },
    ];

    // 1. Perfil sin plata (operador sin permiso de contabilidad): recibe fiestas pero NO plata ni signos de pesos con importes
    const resOperador = await darOrdenPorVozOTexto('¿cuántas fiestas tengo este mes?', {
      perfil: 'operador',
    });
    expect(resOperador.success).toBe(true);
    expect(resOperador.mensaje).toContain('XV de Martina');
    expect(resOperador.mensaje).toContain('FIESTAS PRÓXIMOS 30 DÍAS');
    expect(resOperador.mensaje).not.toContain('PLATA:');
    expect(resOperador.mensaje).not.toMatch(/\$\s*\d+/);

    // 2. Perfil dueño con contabilidad: contiene información completa (fiestas y bloque de plata)
    const resDueno = await darOrdenPorVozOTexto('¿cuántas fiestas tengo este mes?', {
      perfil: 'dueno',
    });
    expect(resDueno.success).toBe(true);
    expect(resDueno.mensaje).toContain('XV de Martina');
    expect(resDueno.mensaje).toContain('FIESTAS PRÓXIMOS 30 DÍAS');
    expect(resDueno.mensaje).toContain('PLATA:');
    expect(resDueno.mensaje).toMatch(/\$\s*120\.000/);
  });
});
