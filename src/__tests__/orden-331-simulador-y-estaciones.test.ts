/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import fs from 'node:fs';
import path from 'node:path';

let mockSearchParamsString = '';
const mockPush = jest.fn();
const mockRouter = { push: mockPush };

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
  useRouter: () => mockRouter,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockGenerateBudgetAndLeadFromSimulator = jest.fn();
const mockGetArmadoRapidoConfig = jest.fn();
jest.mock('@/app/actions/armado-rapido', () => ({
  generateBudgetAndLeadFromSimulator: (...args: unknown[]) => mockGenerateBudgetAndLeadFromSimulator(...args),
  getArmadoRapidoConfig: (...args: unknown[]) => mockGetArmadoRapidoConfig(...args),
}));

const mockGetBudgetDisplaySettings = jest.fn();
jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: (...args: unknown[]) => mockGetBudgetDisplaySettings(...args),
}));

const mockCheckDateAvailability = jest.fn();
jest.mock('@/app/actions/simulador-v2', () => ({
  checkDateAvailability: (...args: unknown[]) => mockCheckDateAvailability(...args),
}));

const mockGetServiciosEmpresaPublicos = jest.fn();
jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: (...args: unknown[]) => mockGetServiciosEmpresaPublicos(...args),
}));

const mockGetMenusPublicos = jest.fn();
jest.mock('@/app/actions/menus-catering', () => ({
  getMenusPublicos: (...args: unknown[]) => mockGetMenusPublicos(...args),
}));

const mockGetPublicWhatsAppNumber = jest.fn();
jest.mock('@/app/actions/whatsapp', () => ({
  getPublicWhatsAppNumber: (...args: unknown[]) => mockGetPublicWhatsAppNumber(...args),
}));

const mockChatWithBudgetCopilot = jest.fn();
jest.mock('@/app/actions/simulador-copilot', () => ({
  chatWithBudgetCopilot: (...args: unknown[]) => mockChatWithBudgetCopilot(...args),
}));

const mockGetFiestaActivaDeHoy = jest.fn();
const mockGetFiestas = jest.fn();
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaActivaDeHoy: (...args: unknown[]) => mockGetFiestaActivaDeHoy(...args),
  getFiestas: (...args: unknown[]) => mockGetFiestas(...args),
}));

jest.mock('@/components/company-logo', () => ({
  CompanyLogo: () => null,
}));

jest.mock('@/components/ui/floating-whatsapp', () => ({
  FloatingWhatsApp: () => null,
}));

jest.mock('@/components/legal/AvisoDeDatos', () => ({
  AvisoDeDatos: () => null,
}));

jest.mock('@/components/budget/BudgetDocument', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/date-picker-demo', () => ({
  DatePickerDemo: () => null,
}));

jest.mock('@/components/kiosk/instalar-esta-estacion', () => ({
  InstalarEstaEstacion: () => null,
}));

jest.mock('framer-motion', () => {
  const ReactActual = require('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: unknown, tag: string) => {
        const Component = ReactActual.forwardRef(
          ({ children, ...props }: React.HTMLAttributes<HTMLElement>, ref: React.Ref<HTMLElement>) =>
            ReactActual.createElement(tag, { ...props, ref }, children)
        );
        Component.displayName = `MotionMock(${tag})`;
        return Component;
      },
    }
  );
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => children };
});

import { SofiaChat } from '@/components/simulador/SofiaChat';
import InicioDeLasEstacionesPage from '@/app/evento/inicio/page';

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function findButtonByText(container: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((btn) =>
    btn.textContent?.includes(text)
  );
}

describe('Orden 331 — Bloque 1 (Un solo simulador) y Bloque 3 (Una sola puerta para las estaciones)', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    localStorage.clear();
    mockSearchParamsString = '';
    mockPush.mockReset();
    mockToast.mockReset();
    mockGenerateBudgetAndLeadFromSimulator.mockReset();
    mockGetArmadoRapidoConfig.mockReset();
    mockGetBudgetDisplaySettings.mockReset();
    mockCheckDateAvailability.mockReset();
    mockGetServiciosEmpresaPublicos.mockReset();
    mockGetMenusPublicos.mockReset();
    mockGetPublicWhatsAppNumber.mockReset();
    mockChatWithBudgetCopilot.mockReset();
    mockGetFiestaActivaDeHoy.mockReset();
    mockGetFiestas.mockReset();

    mockGetArmadoRapidoConfig.mockResolvedValue({
      descuentoGeneral: 15,
      paquetes: [
        {
          id: 'pkg-basico',
          nombre: 'Básico',
          descripcion: 'Paquete inicial',
          serviciosIncluidos: [{ id: 'serv-dj', esRegalo: false }],
        },
      ],
      menus: [],
      platosVisibles: [],
      serviceDependencies: [],
      mostrarPrecios: true,
      clubUruguayConfig: { activo: false, precio: 16900, prestaciones: [] },
    });
    mockGetBudgetDisplaySettings.mockResolvedValue({
      annualAdjustmentPercentage: 15,
      bookingDepositAmount: 10000,
    });
    mockGetServiciosEmpresaPublicos.mockResolvedValue([
      {
        id: 'serv-dj',
        nombre: 'Discoteca VIP',
        tipoItem: 'Servicio',
        categoria: 'Otros servicios',
        calculationMethod: 'fijo',
        precioBase: 18000,
        precioVenta: 18000,
      },
    ]);
    mockGetMenusPublicos.mockResolvedValue([
      {
        id: 'menu-1',
        name: 'Menú Clásico',
        description: 'Cena completa',
        items: [
          {
            id: 'plato-1',
            name: 'Asado completo',
            type: 'Plato Principal',
            totalDishCost: 600,
            suggestedSellingPrice: 1200,
          },
        ],
      },
    ]);
    mockGetPublicWhatsAppNumber.mockResolvedValue('59898355530');
    mockCheckDateAvailability.mockResolvedValue({ isOccupied: false, suggestions: [] });
    mockChatWithBudgetCopilot.mockResolvedValue({ response: '¡Excelente! Seguimos.' });

    mockGetFiestaActivaDeHoy.mockResolvedValue({ success: false });
    mockGetFiestas.mockResolvedValue([
      { id: 'fiesta-1', configuracion: { nombreEvento: 'Fiesta Demo', fechaEvento: '2026-12-20' } },
    ]);

    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  async function avanzarChatHastaPresupuesto() {
    await act(async () => {
      root.render(React.createElement(SofiaChat));
    });
    await flushPromises();

    const enviarTexto = async (texto: string) => {
      const input = host.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).toBeTruthy();
      await act(async () => {
        setInputValue(input, texto);
      });
      const sendBtn = host.querySelector('button[aria-label="Enviar mensaje"]') as HTMLButtonElement;
      expect(sendBtn).toBeTruthy();
      await act(async () => {
        sendBtn.click();
      });
      await flushPromises();
    };

    // 1. Nombre -> phone
    await enviarTexto('Lucía Rodríguez');
    // 2. Teléfono -> date
    await enviarTexto('099123456');
    // 3. Fecha -> type
    await enviarTexto('2026-12-20');
    // 4. Tipo de evento -> guests_adults
    await act(async () => {
      findButtonByText(host, 'Cumpleaños')?.click();
    });
    await flushPromises();
    // 5. Adultos -> guests_kids
    await act(async () => {
      findButtonByText(host, 'Confirmar Cantidad')?.click();
    });
    await flushPromises();
    // 6. Niños -> hours
    await act(async () => {
      findButtonByText(host, 'Confirmar Cantidad')?.click();
    });
    await flushPromises();
    // 7. Duración -> menu
    await act(async () => {
      findButtonByText(host, 'Más de 4h')?.click();
    });
    await flushPromises();
    // 8. Menú -> package_choice
    await act(async () => {
      findButtonByText(host, 'Elegir Menú Clásico')?.click();
    });
    await flushPromises();
    // 9. Modo paquete -> package_select
    await act(async () => {
      findButtonByText(host, 'Por Paquetes Cerrados')?.click();
    });
    await flushPromises();
    // 10. Seleccionar paquete -> budget_ready (dispara auto-guardado)
    await act(async () => {
      findButtonByText(host, 'Seleccionar')?.click();
    });
    await flushPromises();
  }

  test('SofiaChat muestra cartel de error si falla el guardado y Reintentar usa el mismo submissionId', async () => {
    mockGenerateBudgetAndLeadFromSimulator
      .mockResolvedValueOnce({ success: false, error: 'Error de prueba' })
      .mockResolvedValueOnce({ success: true, presupuestoId: 'pres-123' });

    await avanzarChatHastaPresupuesto();

    expect(mockGenerateBudgetAndLeadFromSimulator).toHaveBeenCalledTimes(1);
    const primerSubmissionId = mockGenerateBudgetAndLeadFromSimulator.mock.calls[0][0].submissionId;
    expect(typeof primerSubmissionId).toBe('string');
    expect(primerSubmissionId.length).toBeGreaterThan(0);

    expect(host.textContent).toContain('No pudimos guardar');
    const waLink = Array.from(host.querySelectorAll('a')).find((a) =>
      a.getAttribute('href')?.startsWith('https://wa.me/')
    );
    expect(waLink).toBeTruthy();

    const retryBtn = findButtonByText(host, 'Reintentar');
    expect(retryBtn).toBeTruthy();

    await act(async () => {
      retryBtn?.click();
    });
    await flushPromises();

    expect(mockGenerateBudgetAndLeadFromSimulator).toHaveBeenCalledTimes(2);
    const segundoSubmissionId = mockGenerateBudgetAndLeadFromSimulator.mock.calls[1][0].submissionId;
    expect(segundoSubmissionId).toBe(primerSubmissionId);
    expect(host.textContent).not.toContain('No pudimos guardar');
  });

  test('SofiaChat no muestra cartel de error cuando el guardado devuelve { success: true }', async () => {
    mockGenerateBudgetAndLeadFromSimulator.mockResolvedValue({ success: true });

    await avanzarChatHastaPresupuesto();

    expect(mockGenerateBudgetAndLeadFromSimulator).toHaveBeenCalledTimes(1);
    expect(host.textContent).not.toContain('No pudimos guardar');
    expect(host.querySelector('[data-testid="sofia-save-error"]')).toBeNull();
  });

  test('Se eliminaron las 11 pantallas raíz de /evento/<estacion> y los simuladores duplicados', () => {
    const rutasEliminadas = [
      'src/app/simulador/page.tsx',
      'src/app/simulador-ak/page.tsx',
      'src/app/evento/fotocabina/page.tsx',
      'src/app/evento/touchpix/page.tsx',
      'src/app/evento/espejo-magico/page.tsx',
      'src/app/evento/totem/page.tsx',
      'src/app/evento/plataforma-360/page.tsx',
      'src/app/evento/impresion/page.tsx',
      'src/app/evento/barra/page.tsx',
      'src/app/evento/buzon/page.tsx',
      'src/app/evento/dj/page.tsx',
      'src/app/evento/muro-en-vivo/page.tsx',
      'src/app/evento/video-vida/page.tsx',
    ];

    for (const relPath of rutasEliminadas) {
      expect(fs.existsSync(path.join(process.cwd(), relPath))).toBe(false);
    }

    // Las rutas con [fiestaId] siguen intactas
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/evento/fotocabina/[fiestaId]/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/evento/barra/[fiestaId]/page.tsx'))).toBe(true);
  });

  test('/evento/inicio/page.tsx lee ?rol= y lo pasa como defaultRole a KioskSetup', async () => {
    mockSearchParamsString = 'rol=barra';

    await act(async () => {
      root.render(React.createElement(InicioDeLasEstacionesPage));
    });
    await flushPromises();

    const pressed = Array.from(host.querySelectorAll('[role="group"] button[aria-pressed="true"]'));
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toContain('Barra de Tragos');

    const inicioSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/evento/inicio/page.tsx'),
      'utf8'
    );
    expect(inicioSource).toContain('defaultRole={rol}');
  });
});
