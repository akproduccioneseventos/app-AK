import type { ProfitAndLossData } from '@/app/actions/reportes';
import { mandarResumenAlContador as mandarAlContador } from '@/lib/contabilidad/mandar-resumen-al-contador';
import * as requireSessionModule from '@/lib/auth/require-session';
import * as googleWorkspaceModule from '@/lib/google-workspace';
import * as dataServiceModule from '@/lib/data-service';
import * as settingsModule from '@/app/actions/settings';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { email: 'admin@ak.com' } }),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfo: jest.fn(),
  leerCompanyInfo: jest.fn(),
}));

jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: jest.fn().mockResolvedValue({ id: 'gmail_msg_123' }),
  ensureFreshGoogleAccount: jest.fn((acc) => Promise.resolve(acc)),
  hasServiceAccountKey: jest.fn().mockReturnValue(false),
  getServiceAccountAccessToken: jest.fn().mockResolvedValue(null),
  GOOGLE_WORKSPACE_SCOPES: [],
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

describe('Orden 86 Bloque 8: Resumen del mes para el contador', () => {
  const dummyDatos: ProfitAndLossData = {
    ingresos: {
      total: 150000,
      detalle: [
        { id: 'ing_1', fecha: '2026-08-15', concepto: 'Seña Fiesta 15 Años', monto: 150000 },
      ],
    },
    costos: {
      total: 45000,
      detalle: [
        { id: 'cost_1', fecha: '2026-08-16', concepto: 'DJ Principal', categoria: 'Personal', monto: 45000 },
      ],
    },
    gananciaNeta: 105000,
    margen: 70,
  };

  const googleCompanyAccount = {
    id: 'company',
    kind: 'company',
    email: 'akproduccionessalto@gmail.com',
    accessToken: 'ya29.mock_token',
    status: 'connected',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSessionModule.requireAppSession as jest.Mock).mockResolvedValue(undefined);
  });

  it('sin mail del contador configurado, no manda nada y avisa', async () => {
    (settingsModule.getCompanyInfo as jest.Mock).mockResolvedValue({
      name: 'AK Producciones',
      emailContador: '', // Vacío
    });

    const resultado = await mandarAlContador(dummyDatos, 'agosto de 2026');

    expect(resultado.success).toBe(false);
    expect(resultado.error || resultado.notice).toMatch(/mail del contador/i);
    expect(googleWorkspaceModule.sendGoogleGmailMessage).not.toHaveBeenCalled();
  });

  it('con mail del contador, manda un mail con el asunto del mes y el archivo adjunto', async () => {
    (settingsModule.getCompanyInfo as jest.Mock).mockResolvedValue({
      name: 'AK Producciones',
      emailContador: 'contador@estudio.com.uy',
    });

    (dataServiceModule.readData as jest.Mock).mockImplementation((file: string) => {
      if (file.includes('google-workspace-accounts')) {
        return Promise.resolve([googleCompanyAccount]);
      }
      return Promise.resolve([]);
    });

    const resultado = await mandarAlContador(dummyDatos, 'agosto de 2026');

    expect(resultado.success).toBe(true);
    expect(resultado.enviadoA).toBe('contador@estudio.com.uy');
    expect(googleWorkspaceModule.sendGoogleGmailMessage).toHaveBeenCalledTimes(1);

    const [accountArg, toArg, subjectArg, htmlArg, attachmentArg] = (
      googleWorkspaceModule.sendGoogleGmailMessage as jest.Mock
    ).mock.calls[0];

    expect(accountArg.accessToken).toBe('ya29.mock_token');
    expect(toArg).toBe('contador@estudio.com.uy');
    expect(subjectArg).toBe('AK Producciones — resumen de agosto de 2026');
    expect(htmlArg).toContain('150.000');
    expect(htmlArg).toContain('45.000');

    // Comprueba el adjunto
    expect(attachmentArg).toBeDefined();
    expect(attachmentArg.filename).toMatch(/resumen-agosto-de-2026\.csv/);
    expect(attachmentArg.content).toContain('Seña Fiesta 15 Años');
    expect(attachmentArg.content).toContain('DJ Principal');
  });

  it('la acción de la pantalla no acepta números: recibe el período y el resumen se calcula en el servidor', async () => {
    (settingsModule.getCompanyInfo as jest.Mock).mockResolvedValue({ name: 'AK Producciones', emailContador: 'contador@estudio.com.uy' });
    (dataServiceModule.readData as jest.Mock).mockImplementation((file: string) =>
      Promise.resolve(file.includes('google-workspace-accounts') ? [googleCompanyAccount] : []));
    let accion: any;
    jest.isolateModules(() => {
      jest.doMock('@/app/actions/invoices', () => ({ getInvoices: jest.fn(async () => []) }));
      jest.doMock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => []) }));
      jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: jest.fn(async () => []) }));
      jest.doMock('@/app/actions/roles', () => ({ getRoles: jest.fn(async () => []) }));
      jest.doMock('@/app/actions/gastos', () => ({ getGastosGenerales: jest.fn(async () => []) }));
      jest.doMock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true })) }));
      accion = require('@/app/actions/reportes');
    });
    // Alguien arma números en el navegador y se los pasa a la acción: no llegan al contador.
    const r = await accion.mandarAlContador(dummyDatos as any, 'agosto de 2026');
    expect(r.success).toBe(false);
    expect(googleWorkspaceModule.sendGoogleGmailMessage).not.toHaveBeenCalled();
    // Con el período, manda lo que calculó el servidor (sin movimientos: cero), no lo inventado.
    const ok = await accion.mandarAlContador({ from: new Date(2026, 7, 1), to: new Date(2026, 7, 31, 23, 59) }, 'agosto de 2026');
    expect(ok.success).toBe(true);
    const html = (googleWorkspaceModule.sendGoogleGmailMessage as jest.Mock).mock.calls[0][3];
    expect(html).not.toContain('150.000');
    expect(accion.enviarResumenAlContador).toBeUndefined();
  });
});
