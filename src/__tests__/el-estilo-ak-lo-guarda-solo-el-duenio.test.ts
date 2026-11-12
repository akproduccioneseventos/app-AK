/**
 * Orden 280 (Bloque 5) — Seguridad y privacidad del Estilo AK
 *
 * 1. Personal (sin permiso) falla al guardar con error de permisos.
 * 2. Dueño/Admin guarda correctamente.
 * 3. La acción obtenerEstiloFotosAK() devuelve solo números (sin campos de usuario ni secretos).
 */

const mockVerifySession = jest.fn();
const mockMutarDocumento = jest.fn();
const mockReadGenericJsonFile = jest.fn();

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: (...args: unknown[]) => mockVerifySession(...args),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockImplementation(async (permiso: any) => {
    const session = await mockVerifySession();
    if (!session.success || !session.user) {
      return { ok: false, error: session.error || 'Sesion no autorizada.' };
    }
    const { puede, perfilDe, NOMBRE_DEL_PERFIL } = jest.requireActual('@/lib/auth/perfiles');
    if (!puede(session.user, permiso)) {
      const perfil = NOMBRE_DEL_PERFIL[perfilDe(session.user)];
      return { ok: false, error: `Tu perfil (${perfil}) no tiene acceso a esta parte.` };
    }
    return { ok: true, user: session.user };
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumento: (...args: unknown[]) => mockMutarDocumento(...args),
  readGenericJsonFile: (...args: unknown[]) => mockReadGenericJsonFile(...args),
}));

jest.mock('@/lib/firebase/server', () => ({}));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import {
  guardarEstiloFotosAK,
  obtenerEstiloFotosAK,
} from '@/app/actions/estilo-fotos';
import { ESTILO_FOTOS_AK_FILE } from '@/lib/entretenimiento/estilo-ak';

describe('Orden 280 — El Estilo AK lo guarda solo el dueño', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('el personal sin permiso de administracion falla al guardar con error de permisos y no escribe', async () => {
    // Sesión de perfil personal (sin permiso de administración)
    mockVerifySession.mockResolvedValue({
      success: true,
      user: {
        userId: 'personal_123',
        role: 'user',
        perfil: 'personal',
      },
    });

    const estilo = {
      intensidad: 1.0,
      temperatura: 10,
      medios: { r: 15, g: 5, b: -10 },
    };

    const res = await guardarEstiloFotosAK(estilo);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no tiene acceso|autorizad/i);
    expect(mockMutarDocumento).not.toHaveBeenCalled();
  });

  test('el dueño / admin guarda correctamente en estilo-fotos-ak.json', async () => {
    // Sesión de perfil dueño (con permiso de administración)
    mockVerifySession.mockResolvedValue({
      success: true,
      user: {
        userId: 'duenio_001',
        role: 'admin',
        perfil: 'duenio',
      },
    });

    mockMutarDocumento.mockImplementation(async (_file: string, _def: unknown, cambiar: (val: any) => any) => {
      return cambiar({});
    });

    const nuevoEstilo = {
      intensidad: 0.8,
      temperatura: 12,
      medios: { r: 10, g: 4, b: -8 },
    };

    const res = await guardarEstiloFotosAK(nuevoEstilo);

    expect(res.success).toBe(true);
    expect(mockMutarDocumento).toHaveBeenCalledTimes(1);
    expect(mockMutarDocumento.mock.calls[0][0]).toBe(ESTILO_FOTOS_AK_FILE);
  });

  test('obtenerEstiloFotosAK() devuelve solo numeros, sin campos de usuario ni secretos', async () => {
    // Supongamos que en la base de datos alguien inyectó datos sensibles o de usuario
    mockReadGenericJsonFile.mockResolvedValue({
      usuarioCreador: 'gonzalo@akproducciones.com',
      userId: 'usr_dueño_secret_123',
      token: 'jwt_secret_token_abc',
      apiKey: 'sk_live_xyz999',
      rol: 'admin',
      notasInternas: 'Ajuste para quinceañeras',
      actualizadoEn: '2026-11-11T20:00:00.000Z',
      // Valores numéricos reales de calibración
      intensidad: 0.95,
      temperatura: 16,
      contraste: 6,
      exposicion: 0.1,
      saturacion: 1.05,
      suavizadoPiel: 0.75,
      sombras: { r: 3, g: 1, b: -2, metadataSecreta: 'oculto' },
      medios: { r: 14, g: 6, b: -10, userTag: 'duenio' },
      altas: { r: 5, g: 2, b: -1 },
    });

    const estiloPublico = await obtenerEstiloFotosAK();

    expect(estiloPublico).toBeDefined();
    expect(estiloPublico).not.toBeNull();

    // 1. Verificamos que NO existan campos de usuario ni secretos
    const objCualquiera = estiloPublico as any;
    expect(objCualquiera.usuarioCreador).toBeUndefined();
    expect(objCualquiera.userId).toBeUndefined();
    expect(objCualquiera.token).toBeUndefined();
    expect(objCualquiera.apiKey).toBeUndefined();
    expect(objCualquiera.rol).toBeUndefined();
    expect(objCualquiera.notasInternas).toBeUndefined();
    expect(objCualquiera.actualizadoEn).toBeUndefined();
    expect(objCualquiera.sombras.metadataSecreta).toBeUndefined();
    expect(objCualquiera.medios.userTag).toBeUndefined();

    // 2. Verificamos que todas las hojas del objeto sean estrictamente números
    function verificarRecursivoSoloNumeros(nodo: Record<string, any>) {
      for (const [clave, valor] of Object.entries(nodo)) {
        if (valor !== null && typeof valor === 'object') {
          verificarRecursivoSoloNumeros(valor);
        } else {
          expect(typeof valor).toBe('number');
          expect(Number.isNaN(valor)).toBe(false);
        }
      }
    }

    verificarRecursivoSoloNumeros(estiloPublico!);
  });
});
