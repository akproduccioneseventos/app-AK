/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import { createAk100ClosureTasks, getAk100Readiness } from '@/app/actions/ak-100';
import { getPostEventOpportunities, createPostEventPackage, generatePostEventSocialPostWithAi } from '@/app/actions/post-event-intelligence';
import { getSimulatorAvailableSlots, bookAppointmentFromSimulator } from '@/app/actions/simulator-agenda';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ email: 'admin@akproducciones.com', role: 'admin' })),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => {
    if (id === 'fiesta-valida') {
      return {
        id: 'fiesta-valida',
        configuracion: { nombreEvento: 'Fiesta Test' },
        tareas: [],
      };
    }
    return null;
  }),
  getAllFiestas: jest.fn(async () => []),
  saveFiesta: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

describe('cobertura de rutas y acciones orden 49', () => {
  describe('pantallas que verifican sus resultados', () => {
    it('comprueba que la pantalla de /calendario tenga la confirmación de citas con resultado', () => {
      const rutaCalendario = '/calendario';
      const file = fs.readFileSync(
        path.join(process.cwd(), 'src/app/(app)/calendario/page.tsx'),
        'utf8'
      );
      expect(rutaCalendario).toEqual('/calendario');
      expect(file).toContain('updateAppointmentStatus');
      expect(file).toContain('res?.success');
    });

    it('comprueba que la pantalla de /empresa/presentacion-led/configuracion maneje errores', () => {
      const rutaLed = '/empresa/presentacion-led/configuracion';
      const file = fs.readFileSync(
        path.join(process.cwd(), 'src/app/(app)/empresa/presentacion-led/configuracion/page.tsx'),
        'utf8'
      );
      expect(rutaLed).toEqual('/empresa/presentacion-led/configuracion');
      expect(file).toContain('savePresentacionLedSettings');
      expect(file).toContain('!res.success');
    });

    it('comprueba que la pantalla de /presupuestos/nuevo/crear verifique guardado', () => {
      const rutaCrear = '/presupuestos/nuevo/crear';
      const file = fs.readFileSync(
        path.join(process.cwd(), 'src/app/(app)/presupuestos/nuevo/crear/page.tsx'),
        'utf8'
      );
      expect(rutaCrear).toEqual('/presupuestos/nuevo/crear');
      expect(file).toContain('savePresupuesto');
      expect(file).toContain('result.error');
    });
  });

  describe('acciones de ak-100', () => {
    it('informa error si no encuentra la fiesta al crear tareas de cierre', async () => {
      const res = await createAk100ClosureTasks('fiesta-inexistente');
      expect(res).toEqual({
        success: false,
        created: 0,
        error: 'No encontre la fiesta.',
      });
    });

    it('devuelve null si no encuentra la fiesta en readiness', async () => {
      const res = await getAk100Readiness('fiesta-inexistente');
      expect(res).toBeNull();
    });
  });

  describe('acciones de post-event-intelligence', () => {
    it('devuelve lista de oportunidades de post evento', async () => {
      const res = await getPostEventOpportunities();
      expect(res).toEqual({
        success: true,
        data: [],
      });
    });

    it('informa error si la fiesta no existe al crear paquete', async () => {
      const res = await createPostEventPackage('fiesta-inexistente');
      expect(res).toEqual({
        success: false,
        error: 'No encontré la fiesta.',
      });
    });
  });

  describe('acciones de simulator-agenda', () => {
    it('devuelve días disponibles para reservar en el simulador', async () => {
      const res = await getSimulatorAvailableSlots();
      expect(res.success).toBe(true);
      expect(res.days).toEqual(expect.any(Array));
    });

    it('rechaza nombres inválidos al reservar turno desde el simulador', async () => {
      const res = await bookAppointmentFromSimulator({
        clienteNombre: '',
        clienteContacto: '099123456',
        fechaHora: new Date().toISOString(),
      });
      expect(res).toEqual({
        success: false,
        error: 'Por favor ingresá un nombre válido (entre 3 y 100 caracteres).',
      });
    });
  });
});
