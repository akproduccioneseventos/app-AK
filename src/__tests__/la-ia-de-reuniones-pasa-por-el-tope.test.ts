/** @jest-environment node */

describe('La IA de reuniones y ventas pasa por el tope (Orden 376 B6 y B8)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('sin presupuesto de IA, no llama a analyzeMeetingTranscript ni a generateSalesPitchFlow', async () => {
    const analyzeMeetingMock = jest.fn(async () => ({
      resumenCliente: 'ok',
      resumenOrganizador: 'ok',
      acuerdos: [],
      decisionesCliente: [],
      tareasCliente: [],
      tareasOrganizador: [],
      preguntasCliente: [],
      checklistCompletadoIds: [],
      camposSincronizados: [],
      alertas: [],
    }));
    const generatePitchMock = jest.fn(async () => 'Pitch');

    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn(async () => ({ userId: 'u-1', perfil: 'dueno' })),
    }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn(async () => false),
      registrarConsumoIA: jest.fn(async () => undefined),
    }));
    jest.doMock('@/ai/flows/meeting-intelligence-flow', () => ({
      analyzeMeetingTranscript: analyzeMeetingMock,
    }));
    jest.doMock('@/ai/flows/generate-sales-pitch-flow', () => ({
      generateSalesPitchFlow: generatePitchMock,
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getFiestaById: jest.fn(async () => ({
        id: 'f-1',
        configuracion: { nombreEvento: 'Cumple', fechaEvento: '2026-12-10' },
        reuniones: [{ id: 'r-1', titulo: 'Reu', fecha: '2026-11-26' }],
      })),
      saveFiesta: jest.fn(async () => ({ success: true })),
    }));
    jest.doMock('@/app/actions/google-workspace-extended', () => ({
      syncReunionToGoogleWorkspace: jest.fn(async () => ({ success: true, warnings: [] })),
    }));

    const { processReunionIntelligence } = await import('@/app/actions/meeting-intelligence');
    const fd = new FormData();
    fd.append('fiestaId', 'f-1');
    fd.append('reunionId', 'r-1');
    fd.append('transcript', 'Notas de prueba');
    const reuRes = await processReunionIntelligence(fd);
    expect(reuRes.success).toBe(true);
    expect(analyzeMeetingMock).not.toHaveBeenCalled();

    const { generateSalesPitchAction } = await import('@/app/actions/sales-pitch-ia.actions');
    const pitchRes = await generateSalesPitchAction('Ana', '15 años', 100, 150000, ['DJ']);
    expect(pitchRes.success).toBe(false);
    expect(generatePitchMock).not.toHaveBeenCalled();
  });

  it('ejecutarVigilanteNoche y ejecutarAnticipador marcan error si la lectura viene con marca de falla', async () => {
    jest.resetModules();
    const { marcarLecturaFallida } = await import('@/lib/marca-de-lectura');

    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn(async (file: string) => {
        if (file === 'insumos.json' || file === 'invoices.json') {
          return marcarLecturaFallida([]);
        }
        return [];
      }),
      writeData: jest.fn(),
    }));
    jest.doMock('@/lib/generic-json-store', () => ({
      mutarDocumento: jest.fn(async (_f: string, _d: any, cb: any) => cb([])),
      mutateGenericJsonArray: jest.fn(async () => []),
    }));

    const { ejecutarVigilanteNoche, ejecutarAnticipador } = await import('@/lib/agentes/motor-agentes');
    const noche = await ejecutarVigilanteNoche(new Date('2026-11-26T22:00:00-03:00'));
    const antic = await ejecutarAnticipador(new Date('2026-11-26T22:00:00-03:00'));

    expect(noche.estado).toBe('error');
    expect(antic.estado).toBe('error');
  });
});
