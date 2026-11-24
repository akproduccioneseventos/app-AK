import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { KioskSetup } from '@/components/kiosk/kiosk-setup';
import { getFiestaActivaDeHoy, getFiestasParaKiosco } from '@/app/actions/fiesta-actual';
import { getKioskStationGuestToken } from '@/app/actions/fiesta/entretenimiento.actions';

const mockPush = jest.fn();
const mockRouter = { push: mockPush };

jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaActivaDeHoy: jest.fn(),
  getFiestasParaKiosco: jest.fn(),
}));
jest.mock('@/app/actions/fiesta/entretenimiento.actions', () => ({
  getKioskStationGuestToken: jest.fn(),
}));
jest.mock('@/components/kiosk/instalar-esta-estacion', () => ({
  InstalarEstaEstacion: () => null,
}));
jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = new Proxy({}, {
    get: (_target, tag: string) => {
      const Component = React.forwardRef(({ children, ...props }: React.HTMLAttributes<HTMLElement>, ref: React.Ref<HTMLElement>) =>
        React.createElement(tag, { ...props, ref }, children));
      Component.displayName = `MotionMock(${tag})`;
      return Component;
    },
  });
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => children };
});

const fixture = [{ id: 'fiesta-ficticia', configuracion: { nombreEvento: 'Celebración de prueba', fechaEvento: '2026-10-14' } }];

describe('Configuración accesible del kiosco', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    (getFiestaActivaDeHoy as jest.Mock).mockResolvedValue({ success: false });
    (getFiestasParaKiosco as jest.Mock).mockResolvedValue({
      success: true,
      fiestas: fixture,
      requiereCodigo: false,
    });
    (getKioskStationGuestToken as jest.Mock).mockResolvedValue({
      success: true,
      guestToken: 'guest_tok_test',
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function renderSetup() {
    await act(async () => {
      root.render(<KioskSetup defaultRole="barra" />);
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  test('nombra campos, expone una selección y etiqueta el identificador al cambiar a tótem', async () => {
    await renderSetup();

    expect(container.querySelector('h1')?.textContent).toBe('Configuración de Kiosco');
    const select = container.querySelector('select');
    const group = container.querySelector('[role="group"]');
    expect(select?.labels?.[0]?.textContent).toContain('Seleccionar Evento / Fiesta');
    expect(group?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(group?.classList.contains('space-y-2')).toBe(true);
    const selectedButtons = Array.from(group?.querySelectorAll('button[aria-pressed="true"]') ?? []);
    expect(selectedButtons).toHaveLength(1);
    expect(selectedButtons[0].textContent).toContain('Barra de Tragos');

    const totemButton = Array.from(group?.querySelectorAll('button') ?? []).find((button) => button.textContent?.includes('Tótem LED'));
    expect(totemButton).toBeTruthy();
    await act(async () => { totemButton?.click(); });

    const totemInput = Array.from(container.querySelectorAll('input')).find((input) => input.labels?.[0]?.textContent.includes('Identificador del Tótem'));
    expect(totemInput).toBeTruthy();
    expect(totemInput?.classList.contains('text-slate-100')).toBe(true);
    expect(totemInput?.classList.contains('placeholder:text-slate-400')).toBe(true);
    expect(container.querySelectorAll('[role="group"] button[aria-pressed="true"]')).toHaveLength(1);
  });

  test('no guarda ni navega si no hay fiesta seleccionable', async () => {
    (getFiestasParaKiosco as jest.Mock).mockResolvedValue({
      success: true,
      fiestas: [],
      requiereCodigo: false,
    });
    await renderSetup();

    const lockButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Dejar el aparato listo'));
    await act(async () => { lockButton?.click(); });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Por favor selecciona un evento.');
    expect(mockPush).not.toHaveBeenCalled();
    expect(localStorage.getItem('kiosk_locked_fiesta_id')).toBeNull();
  });

  test('arma la URL de la estación con ?access= válido al bloquear el dispositivo', async () => {
    await renderSetup();

    const boothButton = Array.from(container.querySelectorAll('[role="group"] button')).find((button) =>
      button.textContent?.includes('Fotocabina'),
    );
    await act(async () => {
      boothButton?.click();
    });

    const lockButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Dejar el aparato listo'),
    );
    await act(async () => {
      lockButton?.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getKioskStationGuestToken).toHaveBeenCalledWith('fiesta-ficticia', 'fotocabina', undefined);
    expect(mockPush).toHaveBeenCalledWith('/evento/fotocabina/fiesta-ficticia?access=guest_tok_test');
  });
});
