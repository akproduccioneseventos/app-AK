jest.setTimeout(20000);
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const submitClientPaymentMock = jest.fn();

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  submitClientPayment: (...args: any[]) => submitClientPaymentMock(...args),
  addClientMusicSuggestion: jest.fn(async () => ({ success: true })),
  initializePortalSession: jest.fn(async () => ({ success: true })),
  submitClientMenuChangeRequest: jest.fn(async () => ({ success: true })),
  submitClientServiceAddRequest: jest.fn(async () => ({ success: true })),
  updateClientePortalExperience: jest.fn(async () => ({ success: true })),
  checkDateAvailability: jest.fn(async () => ({ available: true })),
  cancelServicesOrParty: jest.fn(async () => ({ success: true })),
  changeEventDate: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/social-connections', () => ({
  getSocialConnectionsPublicas: jest.fn().mockResolvedValue({}),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/portal/c/test-key',
}));

jest.mock('@/components/public-footer', () => ({ PublicFooter: () => <div data-testid="public-footer" /> }));

import PublicPortalClientExperience from '@/app/portal/c/[accessKey]/PublicPortalClientExperience';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Element.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

function escribir(el: HTMLInputElement | HTMLTextAreaElement, valor: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, valor);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Orden 212 — Portal del cliente: lo que se ve', () => {
  beforeEach(() => {
    submitClientPaymentMock.mockReset();
  });

  const baseFiesta: any = {
    id: 'fiesta-orden-212',
    configuracion: {
      nombreEvento: '15 de Sofía',
      fechaEvento: '2027-05-20',
      clienteNombre: 'Sofía',
    },
    clientPortalSettings: {
      enabled: true,
      accessKey: 'test-key',
      accessPhase: 'organizacion',
      fotografiaYFilmacion: { visible: true },
    },
    fotografiaYFilmacion: {
      notasGenerales: 'Fotos en exteriores y recepción',
      servicios: [
        {
          id: 'srv-1',
          nombre: 'Álbum impreso y digital',
          estado: 'Entregado completo',
          fechaEntregaEstimada: '2027-06-01',
          linkEntrega: 'https://fotos.akproducciones.uy/entrega/album-123',
        },
        {
          id: 'srv-2',
          nombre: 'Video resumen cinemático',
          estado: 'En edición',
          fechaEntregaEstimada: '2027-06-15',
        },
      ],
    },
    contratoDatos: {
      senia: 10000,
      saldo: 40000,
      planPagos: { activo: true, cuotas: [] },
    },
  };

  test('Bloque 1: tocar "Informar pago" abre el diálogo, con monto 500 y "Enviar" llama a submitClientPayment, y con aviso muestra el texto', async () => {
    submitClientPaymentMock.mockResolvedValueOnce({
      success: true,
      aviso: 'El comprobante no se pudo subir, pero el pago quedó informado.',
    });

    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    await act(async () => {
      root.render(<PublicPortalClientExperience fiesta={baseFiesta} />);
    });

    // 1. Buscar botón "Informar pago" y hacer click
    const botones = Array.from(host.querySelectorAll('button'));
    const botonInformarPago = botones.find((b) => b.textContent?.includes('Informar pago'));
    expect(botonInformarPago).toBeDefined();

    await act(async () => {
      botonInformarPago!.click();
    });

    // 2. Comprobar que el diálogo abrió
    const modalInput = document.querySelector('#modal-payment-amount') as HTMLInputElement;
    expect(modalInput).not.toBeNull();

    // 3. Escribir 500
    await act(async () => {
      escribir(modalInput, '500');
    });

    // 4. Click en Enviar
    const dialogButtons = Array.from(document.querySelectorAll('button'));
    const botonEnviar = dialogButtons.find((b) => b.textContent?.trim() === 'Enviar');
    expect(botonEnviar).toBeDefined();

    await act(async () => {
      botonEnviar!.click();
    });

    // 5. Comprobar llamada a submitClientPayment(fiestaId, 500, ...)
    expect(submitClientPaymentMock).toHaveBeenCalledTimes(1);
    expect(submitClientPaymentMock).toHaveBeenCalledWith('fiesta-orden-212', 500, undefined, undefined);

    // 6. Comprobar que sale el aviso
    const dialogText = document.body.textContent || '';
    expect(dialogText).toContain('El comprobante no se pudo subir, pero el pago quedó informado.');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  test('Bloque 2: con servicio "Entregado completo" y linkEntrega aparece "Ver entrega", y con "En edición" no aparece el botón', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    await act(async () => {
      root.render(<PublicPortalClientExperience fiesta={baseFiesta} />);
    });

    // Buscar enlaces con "Ver entrega"
    const enlaces = Array.from(host.querySelectorAll('a'));
    const enlacesVerEntrega = enlaces.filter((a) => a.textContent?.includes('Ver entrega'));

    expect(enlacesVerEntrega.length).toBe(1);
    expect(enlacesVerEntrega[0].getAttribute('href')).toBe('https://fotos.akproducciones.uy/entrega/album-123');

    // Verificar que el servicio "En edición" está presente en texto pero no tiene enlace "Ver entrega"
    const texto = host.textContent || '';
    expect(texto).toContain('Video resumen cinemático');
    expect(texto).toContain('En edición');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  test('Bloque 3: tocar la tarjeta Pagos dos veces deja la sección contable abierta las dos veces', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    await act(async () => {
      root.render(<PublicPortalClientExperience fiesta={baseFiesta} />);
    });

    // Buscar tarjeta "Pagos"
    const cards = Array.from(host.querySelectorAll('.ak-public-card'));
    const tarjetaPagos = cards.find((c) => c.textContent?.includes('Pagos') && c.textContent?.includes('Estado de Cuenta')) as HTMLElement;
    expect(tarjetaPagos).toBeDefined();

    const seccionContable = host.querySelector('#portal-contable');
    expect(seccionContable).not.toBeNull();

    // Primer click en Pagos
    await act(async () => {
      tarjetaPagos.click();
    });

    // El trigger de contable o su contenido debe estar abierto (data-state="open")
    const trigger1 = seccionContable?.querySelector('[data-state]');
    expect(trigger1?.getAttribute('data-state')).toBe('open');

    // Segundo click en Pagos
    await act(async () => {
      tarjetaPagos.click();
    });

    // Sigue abierto, NO se cerró!
    const trigger2 = seccionContable?.querySelector('[data-state]');
    expect(trigger2?.getAttribute('data-state')).toBe('open');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
