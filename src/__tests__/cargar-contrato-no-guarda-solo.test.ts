/**
 * @jest-environment jsdom
 *
 * Orden 345 - Bloque 3: "Cargar contrato" con IA pasando por cerebro.ts y sin guardar solo.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const mockRouterPush = jest.fn();
const mockRouterRefresh = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockSavePresupuesto = jest.fn();
const mockUpdatePresupuesto = jest.fn();
const mockGetPresupuestosConTotal = jest.fn();
const mockRepairVerifiedBudgetDates = jest.fn();

jest.mock('@/app/actions/presupuestos', () => ({
  savePresupuesto: (...args: unknown[]) => mockSavePresupuesto(...args),
  updatePresupuesto: (...args: unknown[]) => mockUpdatePresupuesto(...args),
  getPresupuestoById: jest.fn(),
  getPresupuestos: jest.fn().mockResolvedValue([]),
  getPresupuestosConTotal: (...args: unknown[]) => mockGetPresupuestosConTotal(...args),
  repairVerifiedBudgetDates: (...args: unknown[]) => mockRepairVerifiedBudgetDates(...args),
  resetAllPresupuestos: jest.fn(),
}));

const mockExtractContractDataAction = jest.fn();
jest.mock('@/app/actions/historicos', () => ({
  extractContractDataAction: (...args: unknown[]) => mockExtractContractDataAction(...args),
}));

jest.mock('@/app/actions/sesion', () => ({
  getMisPermisos: jest.fn().mockResolvedValue({ permisos: ['contabilidad'] }),
  esSesionDeSoloLectura: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn().mockResolvedValue([
    {
      id: 'serv-sonido',
      nombre: 'Sonido e Iluminación',
      tipoItem: 'Servicio',
      categoria: 'Música',
      precioVenta: 25000,
      precioBase: 25000,
      calculationMethod: 'fijo',
    },
    {
      id: 'serv-foto',
      nombre: 'Fotografía Profesional',
      tipoItem: 'Servicio',
      categoria: 'Foto',
      precioVenta: 18000,
      precioBase: 18000,
      calculationMethod: 'fijo',
    },
  ]),
}));

jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn().mockResolvedValue({ paquetes: [] }),
}));

jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/agenda', () => ({
  getOcupiedDates: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn().mockResolvedValue({ annualAdjustmentPercentage: 15 }),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: jest.fn().mockResolvedValue(null),
  updateFiestaPresupuestoId: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/budget/intento-configurador', () => ({
  obtenerIntentoPresupuestoManual: jest.fn().mockResolvedValue('op-test-contrato-1'),
  terminarIntentoPresupuestoManual: jest.fn(),
}));

jest.mock('@/components/presupuestos/paso-1-datos-evento', () => ({
  Paso1DatosEvento: ({ formData }: { formData: { clienteNombre: string; clienteContacto?: string; estado: string } }) =>
    React.createElement(
      'div',
      { 'data-testid': 'mock-paso-1' },
      React.createElement('span', { 'data-testid': 'paso1-cliente' }, formData.clienteNombre),
      React.createElement('span', { 'data-testid': 'paso1-contacto' }, formData.clienteContacto || ''),
      React.createElement('span', { 'data-testid': 'paso1-estado' }, formData.estado),
    ),
}));

jest.mock('@/components/presupuestos/paso-2-servicios', () => ({
  __esModule: true,
  default: ({ formData }: { formData: { serviciosSeleccionados: Map<string, { nombreServicio: string }> } }) =>
    React.createElement(
      'div',
      { 'data-testid': 'mock-paso-2' },
      Array.from(formData.serviciosSeleccionados.values())
        .map((s) => s.nombreServicio)
        .join(', '),
    ),
}));

jest.mock('@/components/presupuestos/paso-3-resumen', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'mock-paso-3' }, 'Resumen'),
}));

jest.mock('@/components/panels/presupuestos--reporte', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/panels/presupuestos--importar', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/tab-host-shell', () => ({
  TabHostShell: ({ renderDefault }: { renderDefault: () => React.ReactNode }) =>
    React.createElement('div', null, renderDefault()),
}));

describe('Orden 345 Bloque 3: Cargar contrato con IA sin guardar solo', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
    mockGetPresupuestosConTotal.mockResolvedValue({ presupuestos: [], totalCount: 0 });
    mockRepairVerifiedBudgetDates.mockResolvedValue({ success: true, changedCount: 0 });
    mockSavePresupuesto.mockResolvedValue({ success: true, id: 'pres-contrato-1' });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('el botón Cargar contrato lee el contrato con IA, arma el borrador en sessionStorage y no guarda solo', async () => {
    const mockContratoLeido = {
      clienteNombre: 'Lucía Fernández',
      eventoFecha: '2027-08-14',
      montoTotal: 85000,
      tipoEvento: 'XV años',
      telefono: '099123456',
      invitadosAdultos: 80,
      invitadosNinos: 20,
      fechaFirmaContrato: '2025-05-10',
      contratoFirmado: true,
      serviciosContratados: ['sonido e iluminacion', 'Show de Robots LED'],
      sena: 15000,
      cuotas: [{ monto: 35000, fecha: '2027-06-01', concepto: 'Cuota 1' }],
      tipoAjusteAnual: 'simple' as const,
    };
    mockExtractContractDataAction.mockResolvedValueOnce(mockContratoLeido);

    const OriginalFileReader = global.FileReader;
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'data:application/pdf;base64,JVBERi0xLjQ=';
        setTimeout(() => this.onload?.(), 0);
      }
    }
    (global as unknown as { FileReader: typeof FileReader }).FileReader = MockFileReader as unknown as typeof FileReader;

    try {
      const { default: NuevoPresupuestoPage } = await import('@/app/(app)/presupuestos/nuevo/page');

      await act(async () => {
        root.render(React.createElement(NuevoPresupuestoPage));
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      const btnCargar = container.querySelector('[data-testid="btn-cargar-contrato"]') as HTMLButtonElement | null;
      expect(btnCargar).not.toBeNull();
      expect(btnCargar?.textContent).toContain('Cargar contrato');

      const input = container.querySelector('[data-testid="input-cargar-contrato"]') as HTMLInputElement;
      const pdfFile = new File(['%PDF-1.4'], 'contrato-lucia.pdf', { type: 'application/pdf' });
      Object.defineProperty(input, 'files', { value: [pdfFile], configurable: true });

      await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 30));
      });

      expect(mockExtractContractDataAction).toHaveBeenCalledWith({
        fileDataUri: 'data:application/pdf;base64,JVBERi0xLjQ=',
      });
      expect(mockSavePresupuesto).not.toHaveBeenCalled();
      expect(mockUpdatePresupuesto).not.toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith('/presupuestos/nuevo/crear?desdeContrato=1');

      const guardado = JSON.parse(sessionStorage.getItem('ak_contrato_ia_borrador') || '{}');
      expect(guardado.archivoNombre).toBe('contrato-lucia.pdf');
      expect(guardado.data?.clienteNombre).toBe('Lucía Fernández');
      expect(guardado.data?.tipoAjusteAnual).toBe('simple');
    } finally {
      (global as unknown as { FileReader: typeof FileReader }).FileReader = OriginalFileReader;
    }
  });

  it('arma el formulario desde el borrador IA con aviso, selector de ajuste y servicios a revisar, y recién guarda al confirmar', async () => {
    sessionStorage.setItem(
      'ak_contrato_ia_borrador',
      JSON.stringify({
        archivoNombre: 'contrato-lucia.pdf',
        data: {
          clienteNombre: 'Lucía Fernández',
          eventoFecha: '2027-08-14',
          montoTotal: 85000,
          tipoEvento: 'XV años',
          telefono: '099123456',
          invitadosAdultos: 80,
          invitadosNinos: 20,
          fechaFirmaContrato: '2025-05-10',
          contratoFirmado: true,
          serviciosContratados: ['sonido e iluminacion', 'Show de Robots LED'],
          sena: 15000,
          cuotas: [{ monto: 35000, fecha: '2027-06-01', concepto: 'Cuota 1' }],
          tipoAjusteAnual: 'simple',
        },
      }),
    );
    mockSearchParams = new URLSearchParams('desdeContrato=1');

    const { default: CrearPresupuestoPage } = await import('@/app/(app)/presupuestos/nuevo/crear/page');

    await act(async () => {
      root.render(React.createElement(CrearPresupuestoPage));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const aviso = container.querySelector('[data-testid="aviso-contrato-ia"]');
    expect(aviso?.textContent).toContain('Lo armó la IA leyendo el contrato. Revisá cada dato antes de guardar.');
    expect(aviso?.textContent).toContain('contrato-lucia.pdf');

    const selector = container.querySelector('[data-testid="selector-tipo-ajuste-anual"]') as HTMLSelectElement | null;
    expect(selector).not.toBeNull();
    expect(selector?.value).toBe('simple');

    const bloqueAjuste = container.querySelector('[data-testid="bloque-ajuste-anual-contrato"]');
    expect(bloqueAjuste?.textContent).toContain('Ajuste anual: Acumulativo / Simple (contratos viejos)');

    const revisarAMano = container.querySelector('[data-testid="servicios-revisar-a-mano"]');
    expect(revisarAMano?.textContent).toContain('Servicios para revisar a mano');
    expect(revisarAMano?.textContent).toContain('Show de Robots LED');
    expect(revisarAMano?.textContent).not.toContain('sonido e iluminacion');

    expect(container.querySelector('[data-testid="paso1-cliente"]')?.textContent).toBe('Lucía Fernández');
    expect(container.querySelector('[data-testid="paso1-contacto"]')?.textContent).toBe('099123456');
    expect(container.querySelector('[data-testid="paso1-estado"]')?.textContent).toBe('Aceptado');

    // Regla crítica: NO se llama a guardar automáticamente
    expect(mockSavePresupuesto).not.toHaveBeenCalled();
    expect(mockUpdatePresupuesto).not.toHaveBeenCalled();

    // Avanzar al paso 2 y verificar servicio matcheado del catálogo
    await act(async () => {
      (container.querySelector('[data-testid="btn-siguiente-paso"]') as HTMLButtonElement).click();
    });
    expect(container.querySelector('[data-testid="mock-paso-2"]')?.textContent).toContain('Sonido e Iluminación');
    expect(mockSavePresupuesto).not.toHaveBeenCalled();

    // Avanzar al paso 3 (todavía no guarda)
    await act(async () => {
      (container.querySelector('[data-testid="btn-siguiente-paso"]') as HTMLButtonElement).click();
    });
    expect(mockSavePresupuesto).not.toHaveBeenCalled();

    // Recién al confirmar Guardar se llama a savePresupuesto con los datos del contrato
    await act(async () => {
      (container.querySelector('[data-testid="btn-guardar-presupuesto"]') as HTMLButtonElement).click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(mockSavePresupuesto).toHaveBeenCalledTimes(1);
    const [presupuestoGuardado] = mockSavePresupuesto.mock.calls[0];
    expect(presupuestoGuardado.clienteNombre).toBe('Lucía Fernández');
    expect(presupuestoGuardado.estado).toBe('Aceptado');
    expect(presupuestoGuardado.tipoAjusteAnual).toBe('simple');
    expect(presupuestoGuardado.fechaFirmaContrato).toBe('2025-05-10');
    expect(presupuestoGuardado.contratoAdjuntoNombre).toBe('contrato-lucia.pdf');
    expect(presupuestoGuardado.itemsPresupuestados).toHaveLength(1);
    expect(presupuestoGuardado.itemsPresupuestados[0].idServicioCatalogo).toBe('serv-sonido');
    expect(presupuestoGuardado.notas).toContain('Seña informada en contrato');
  });

  it('cerebro.ts envía adjunto multimodal y extractContractData parsea JSON envuelto en markdown', async () => {
    jest.resetModules();
    const generateWithGeminiFallback = jest.fn(async (req: { prompt: unknown }) => ({
      text: [
        '```json',
        JSON.stringify({
          clienteNombre: 'Martín Silva',
          eventoFecha: '2027-11-20',
          montoTotal: 120000,
          tipoEvento: 'Boda',
          telefono: '098765432',
          invitadosAdultos: 110,
          invitadosNinos: 10,
          fechaFirmaContrato: '2026-04-02',
          contratoFirmado: true,
          serviciosContratados: ['DJ', 'Fotografía'],
          sena: 30000,
          cuotas: [{ monto: 45000, fecha: '2027-08-01', concepto: 'Primera cuota' }],
          tipoAjusteAnual: 'acumulativo',
        }),
        '```',
      ].join('\n'),
    }));

    jest.doMock('server-only', () => ({}));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
      reservarConsumoIA: jest.fn().mockResolvedValue({ liberar: jest.fn() }),
      registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
      anotarFalloIA: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('@/ai/genkit', () => ({
      generateWithGeminiFallback,
    }));

    const { extractContractData } = await import('@/ai/flows/extract-contract-data');
    const resultado = await extractContractData({
      fileDataUri: 'data:application/pdf;base64,JVBERi0xLjQ=',
    });

    expect(generateWithGeminiFallback).toHaveBeenCalledTimes(1);
    const reqArg = generateWithGeminiFallback.mock.calls[0][0] as { prompt: Array<{ text?: string; media?: { url: string } }> };
    expect(Array.isArray(reqArg.prompt)).toBe(true);
    expect(reqArg.prompt[0]?.text).toContain('tipoAjusteAnual');
    expect(reqArg.prompt[1]?.media?.url).toBe('data:application/pdf;base64,JVBERi0xLjQ=');
    expect(resultado.clienteNombre).toBe('Martín Silva');
    expect(resultado.tipoAjusteAnual).toBe('acumulativo');
    expect(resultado.serviciosContratados).toEqual(['DJ', 'Fotografía']);
  });
});
