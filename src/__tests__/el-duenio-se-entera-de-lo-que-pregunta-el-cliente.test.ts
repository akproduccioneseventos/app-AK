import { chatConAsistenteCliente, getConversacionesAsistenteCliente } from '@/app/actions/asistente-virtual';
import { getFiestaForPortalSession } from '@/app/actions/fiesta/portal.actions';
import { generateWithGeminiFallback } from '@/ai/genkit';
import { createNotification } from '@/app/actions/notifications';
import { readData, writeData } from '@/lib/data-service';

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  getFiestaForPortalSession: jest.fn(),
}));

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn(),
  geminiCommercialModel: 'gemini-test-model',
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: jest.fn().mockResolvedValue({ pushEnviado: true, whatsAppEnviado: false }),
}));

const store: Record<string, any[]> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    return store[file] ? JSON.parse(JSON.stringify(store[file])) : fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    store[file] = JSON.parse(JSON.stringify(data));
  }),
  createDataItem: jest.fn(async (file: string, _col: string, _id: string, item: any) => {
    if (!store[file]) store[file] = [];
    store[file].push(JSON.parse(JSON.stringify(item)));
  }),
}));

describe('Orden 101 - El dueño se entera de lo que pregunta el cliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k in store) delete store[k];

    (getFiestaForPortalSession as jest.Mock).mockResolvedValue({
      id: 'fiesta_101',
      configuracion: {
        nombreEvento: 'Boda de Laura y Martín',
        tipoCelebracion: 'Boda',
        fechaEvento: '2026-12-15',
        nombreLugar: 'Salón Principal',
      },
    });

    (generateWithGeminiFallback as jest.Mock).mockResolvedValue({
      text: 'La cancelación tiene una penalidad según el contrato.',
    });
  });

  it('pregunta sobre cancelación queda guardada y dispara aviso de señal importante al dueño', async () => {
    const res = await chatConAsistenteCliente('fiesta_101', [], '¿cuánto me sale cancelar la fiesta?');
    expect(res.success).toBe(true);

    const conversaciones = await getConversacionesAsistenteCliente('fiesta_101');
    expect(conversaciones.length).toBe(1);
    expect(conversaciones[0].clientePregunta).toBe('¿cuánto me sale cancelar la fiesta?');
    expect(conversaciones[0].esImportante).toBe(true);
    expect(conversaciones[0].tipoSenal).toBe('cancelacion');

    // Debe disparar el aviso/notificación al dueño
    expect(createNotification).toHaveBeenCalledTimes(1);
    const notifArg = (createNotification as jest.Mock).mock.calls[0][0];
    expect(notifArg.tipo).toBe('alerta');
    expect(notifArg.mensaje).toContain('cancelar');
  });

  it('una pregunta común queda guardada pero NO dispara aviso de señal importante', async () => {
    const res = await chatConAsistenteCliente('fiesta_101', [], '¿A qué hora podemos entrar a decorar?');
    expect(res.success).toBe(true);

    const conversaciones = await getConversacionesAsistenteCliente('fiesta_101');
    expect(conversaciones.length).toBe(1);
    expect(conversaciones[0].esImportante).toBe(false);

    // No debe alertar al dueño por una pregunta operativa común
    expect(createNotification).not.toHaveBeenCalled();
  });
});
