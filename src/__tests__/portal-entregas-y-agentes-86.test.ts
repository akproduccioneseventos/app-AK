/** @jest-environment node */
/**
 * Codex, auditoría 86.
 *
 * - PORTAL86-ENTREGA: el armado del portal descartaba los servicios de foto y video; el cliente con
 *   el álbum entregado veía "aún no hay servicios". Viajan los campos que muestra la pantalla, y el
 *   enlace sólo si es una dirección web común (nada de `javascript:`).
 * - IA86-PERMISOS: con sólo tener sesión, el personal apagaba o corría los agentes automáticos y
 *   leía su historial (que trae saldos). Ahora pide administración.
 *
 * Probado rompiéndolo: con el armado viejo o con `requireAppSession` de vuelta, se pone en rojo.
 */
import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';

jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  getConfiguracionAgentes: jest.fn(async () => [{ id: 'vigilante_fiestas', activo: true }]),
  guardarConfiguracionAgentes: jest.fn(async () => {}),
  getHistorialEjecuciones: jest.fn(async () => [{ agenteId: 'cobrador', resumen: 'saldo 100.000' }]),
  ejecutarAgentesAutonomos: jest.fn(async () => []),
  ejecutarVigilanteFiestas: jest.fn(async () => ({ agenteId: 'vigilante_fiestas' })),
  ejecutarPerseguidorPresupuestos: jest.fn(),
  ejecutarCobrador: jest.fn(async () => ({ agenteId: 'cobrador' })),
  ejecutarGeneradorContenido: jest.fn(),
  ejecutarVigilanteNoche: jest.fn(),
  ejecutarVigilantePublicidad: jest.fn(),
}));

describe('el portal lleva las entregas oficiales', () => {
  const fiesta = (servicios: any[]) => ({
    id: 'f1', configuracion: { nombreEvento: 'Fiesta' }, invitados: [],
    fotografiaYFilmacion: { servicios, notasGenerales: 'notas' },
  }) as any;

  it('nombre, estado, fecha, notas y enlace llegan; nada más', () => {
    const r: any = mapFiestaToClientPortal(fiesta([{
      id: 's1', nombre: 'Álbum', estado: 'Entregado completo', fechaEntregaEstimada: '2026-11-01',
      linkEntrega: 'https://drive.example.com/a', notas: 'Listo', costoInterno: 9000,
    }]));
    expect(r.fotografiaYFilmacion.servicios).toEqual([{
      id: 's1', nombre: 'Álbum', estado: 'Entregado completo', fechaEntregaEstimada: '2026-11-01',
      linkEntrega: 'https://drive.example.com/a', notas: 'Listo',
    }]);
    expect(r.fotografiaYFilmacion.notasGenerales).toBe('notas');
  });

  it('un enlace que no es una dirección web no viaja', () => {
    const r: any = mapFiestaToClientPortal(fiesta([{ id: 's1', nombre: 'x', estado: 'Pendiente', linkEntrega: 'javascript:alert(1)' }]));
    expect(r.fotografiaYFilmacion.servicios[0].linkEntrega).toBeUndefined();
  });

  it('sin servicios, la lista va vacía y la pantalla muestra el vacío honesto', () => {
    const r: any = mapFiestaToClientPortal(fiesta([]));
    expect(r.fotografiaYFilmacion.servicios).toEqual([]);
  });
});

describe('los agentes automáticos son de la administración', () => {
  const { verifySession } = jest.requireMock('@/lib/auth/session-token');
  const motor = jest.requireMock('@/lib/agentes/motor-agentes');
  beforeEach(() => jest.clearAllMocks());

  it('el personal no los apaga, no los corre ni lee el historial', async () => {
    verifySession.mockResolvedValue({ success: true, user: { userId: 'p1', role: 'user', perfil: 'personal' } });
    const a = await import('@/app/actions/agentes-autonomos');
    expect((await a.toggleAgente('vigilante_fiestas' as any, false)).success).toBe(false);
    expect((await a.ejecutarAgenteManual('cobrador' as any)).success).toBe(false);
    expect((await a.ejecutarTodosLosAgentesManual()).success).toBe(false);
    expect(await a.getHistorialAgentes()).toEqual([]);
    expect(await a.getAgentesConfig()).toEqual([]);
    expect(motor.guardarConfiguracionAgentes).not.toHaveBeenCalled();
    expect(motor.ejecutarCobrador).not.toHaveBeenCalled();
    expect(motor.ejecutarAgentesAutonomos).not.toHaveBeenCalled();
  });

  it('el administrador sí', async () => {
    verifySession.mockResolvedValue({ success: true, user: { userId: 'a1', role: 'admin', perfil: 'administrador' } });
    const a = await import('@/app/actions/agentes-autonomos');
    expect((await a.toggleAgente('vigilante_fiestas' as any, false)).success).toBe(true);
    expect(motor.guardarConfiguracionAgentes).toHaveBeenCalledWith([{ id: 'vigilante_fiestas', activo: false }]);
  });
});
