/** @jest-environment node */

let sendCompanyEmailMock: jest.Mock;
let syncReunionMock: jest.Mock;

describe('La reunión no manda el mail al cliente sola (Orden 376 B1)', () => {
  beforeEach(() => {
    jest.resetModules();
    sendCompanyEmailMock = jest.fn(async () => ({ success: true, warnings: [] }));
    syncReunionMock = jest.fn(async (_fiestaId: string, reunion: any, options: any) => {
      if (options?.sendEmails) {
        await sendCompanyEmailMock({ to: 'cliente@ak.uy', reunionId: reunion.id });
        return { success: true, warnings: [], emailSent: true, emailSentAt: '2026-11-26T20:00:00Z' };
      }
      return { success: true, warnings: [], emailSent: false };
    });
  });

  it('procesar no llama a sendCompanyEmail; tocar Mandar resumen lo llama una vez; tocar de nuevo sin confirmar no lo llama', async () => {
    let fiestaEnDisco: any = {
      id: 'f-reu-1',
      configuracion: { nombreEvento: 'Casamiento', fechaEvento: '2026-12-20' },
      reuniones: [
        { id: 'r-1', titulo: 'Reunión inicial', fecha: '2026-11-26' },
      ],
    };

    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn(async () => ({ userId: 'u-1', perfil: 'dueno' })),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn(async () => false),
      registrarConsumoIA: jest.fn(async () => undefined),
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiestaEnDisco))),
      saveFiesta: jest.fn(async (next: any) => {
        fiestaEnDisco = JSON.parse(JSON.stringify(next));
        return { success: true };
      }),
    }));
    jest.doMock('@/app/actions/google-workspace-extended', () => ({
      syncReunionToGoogleWorkspace: syncReunionMock,
    }));

    const { processReunionIntelligence, sendReunionSummaryToClient } = await import('@/app/actions/meeting-intelligence');
    const fd = new FormData();
    fd.append('fiestaId', 'f-reu-1');
    fd.append('reunionId', 'r-1');
    fd.append('transcript', 'El cliente confirma mesa dulce para 120 personas.');

    const proc = await processReunionIntelligence(fd);
    expect(proc.success).toBe(true);
    expect(sendCompanyEmailMock).not.toHaveBeenCalled();

    const envio1 = await sendReunionSummaryToClient('f-reu-1', 'r-1');
    expect(envio1.success).toBe(true);
    expect(sendCompanyEmailMock).toHaveBeenCalledTimes(1);

    // Tocar de nuevo sin confirmar pide confirmación y no vuelve a llamar a sendCompanyEmail
    const envio2SinConfirmar = await sendReunionSummaryToClient('f-reu-1', 'r-1');
    expect(envio2SinConfirmar.success).toBe(false);
    expect(envio2SinConfirmar.requiresConfirm).toBe(true);
    expect(sendCompanyEmailMock).toHaveBeenCalledTimes(1);
  });
});
