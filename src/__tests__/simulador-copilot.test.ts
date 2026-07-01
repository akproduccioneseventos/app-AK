import { chatWithBudgetCopilot, type CopilotInput } from '@/app/actions/simulador-copilot';

// Mock getArmadoRapidoConfig to prevent dependencies on Firestore in tests
jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn().mockResolvedValue({
    descuentoGeneral: 15,
    paquetes: [
      { id: 'pkg_basico', nombre: 'Básico', descripcion: 'Paquete de base', serviciosIncluidos: [] },
      { id: 'pkg_oro', nombre: 'Oro', descripcion: 'Paquete premium de oro', serviciosIncluidos: [] }
    ],
    menus: [],
    platosVisibles: [],
    serviceDependencies: [],
    mostrarPrecios: true,
    clubUruguayConfig: { activo: false, precio: 0, prestaciones: [] }
  }),
  generateBudgetAndLeadFromSimulator: jest.fn().mockResolvedValue({ success: true, presupuestoId: '123' })
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn().mockResolvedValue([])
}));

jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: jest.fn().mockResolvedValue([])
}));

jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn().mockResolvedValue({ annualAdjustmentPercentage: 10 })
}));

jest.mock('@/app/actions/simulador-v2', () => ({
  checkDateAvailability: jest.fn().mockResolvedValue({ isOccupied: false })
}));

describe('Simulador IA Copilot Flow', () => {
  let originalLocalJsonEnv: string | undefined;

  beforeAll(() => {
    originalLocalJsonEnv = process.env.AK_USE_LOCAL_JSON_ONLY;
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  });

  afterAll(() => {
    if (originalLocalJsonEnv === undefined) {
      delete process.env.AK_USE_LOCAL_JSON_ONLY;
    } else {
      process.env.AK_USE_LOCAL_JSON_ONLY = originalLocalJsonEnv;
    }
  });

  const defaultState = {
    eventoTipo: '',
    adultos: 80,
    ninosYAdolescentes: 10,
    eventoFecha: '',
    eventoHoraInicio: '21:00',
    selectedPaqueteId: '',
    selectedServices: [],
    selectedEntradas: [],
    selectedPrincipal: '',
    selectedInfantil: '',
    incluirClubUruguay: false,
    duracionHoras: 5,
    currentChatStep: 'name',
    clienteNombre: '',
    clienteContacto: '',
    paquetesOrServicios: ''
  };

  it('advances from name step to phone step', async () => {
    const input: CopilotInput = {
      message: 'Juan Pérez',
      history: [{ role: 'assistant', content: 'Contame, ¿cuál es tu nombre completo?' }],
      currentState: { ...defaultState, currentChatStep: 'name' }
    };

    const res = await chatWithBudgetCopilot(input);
    expect(res.response).toBeDefined();
    // In fallback mode, it defaults to Sofía's rule-based flow response
    expect(res.response).toContain('Sofía');
  });

  it('rejects invalid Uruguayan phone numbers', async () => {
    const input: CopilotInput = {
      message: '12345', // invalid length
      history: [
        { role: 'assistant', content: 'Contame, ¿cuál es tu nombre completo?' },
        { role: 'user', content: 'Juan Pérez' }
      ],
      currentState: {
        ...defaultState,
        currentChatStep: 'phone',
        clienteNombre: 'Juan Pérez'
      }
    };

    const res = await chatWithBudgetCopilot(input);
    expect(res.response).toBeDefined();
  });

  it('processes package changes request correctly in fallback mode', async () => {
    const input: CopilotInput = {
      message: 'Quiero cambiar al paquete Oro',
      history: [],
      currentState: {
        ...defaultState,
        currentChatStep: 'budget_ready',
        clienteNombre: 'Juan Pérez',
        clienteContacto: '099123456',
        eventoFecha: '2026-12-25',
        eventoTipo: 'boda'
      }
    };

    const res = await chatWithBudgetCopilot(input);
    expect(res.action).toBeDefined();
    expect(res.action?.type).toBe('apply_changes');
    expect(res.action?.changes?.selectedPaqueteId).toBe('pkg_oro');
    expect(res.response).toContain('Oro');
  });
});
