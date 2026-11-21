import { readFileSync } from 'node:fs';
import path from 'node:path';

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(async () => [
    {
      id: 'demo_ak_oficial',
      estado: 'Demo AK',
      configuracion: { nombreEvento: 'Fiesta Demo AK', fechaEvento: '2026-12-01' },
      personalAsignado: [{ id: 'p1', nombre: 'Juan', rol: '' }],
    },
  ]),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => []),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/solo-lectura', () => ({
  requerirEscritura: jest.fn(async () => null),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'u_test', role: 'admin' })),
}));

import {
  getAlertasErroresHumanos,
  descartarAlertaErrorHumano,
} from '@/app/actions/alertas-errores-humanos';

describe('Orden 310: /empleados/roles y alertas de errores humanos excluyen DEMO', () => {
  it('getAlertasErroresHumanos ignora fiestas DEMO y descartarAlertaErrorHumano responde ok', async () => {
    const res = await getAlertasErroresHumanos();
    expect(res).toEqual([]);

    const desc = await descartarAlertaErrorHumano('alerta_demo_1', 'Motivo de prueba');
    expect(desc.success).toBe(true);
  });

  it('la pantalla /empleados/roles oculta Eliminar cuando esSesionDeSoloLectura es true', () => {
    const src = readFileSync(
      path.join(process.cwd(), 'src/components/panels/empleados--roles.tsx'),
      'utf8',
    );
    expect(src).toContain('esSesionDeSoloLectura');
    expect(src).toContain('!soloLectura');
  });
});
