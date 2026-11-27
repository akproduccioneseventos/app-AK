/** @jest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { totalTrasCancelar } from '@/lib/budget/total-tras-cancelar';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ accessKey: 'KEY123' }),
}));

jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  addClientMusicSuggestion: jest.fn().mockResolvedValue({ success: true }),
  initializePortalSession: jest.fn().mockResolvedValue({ success: true }),
  submitClientMenuChangeRequest: jest.fn().mockResolvedValue({ success: true }),
  submitClientPayment: jest.fn().mockResolvedValue({ success: true }),
  submitClientServiceAddRequest: jest.fn().mockResolvedValue({ success: true }),
  updateClientePortalExperience: jest.fn().mockResolvedValue({ success: true }),
  checkDateAvailability: jest.fn().mockResolvedValue({ success: true, available: true }),
  cancelServicesOrParty: jest.fn().mockResolvedValue({ success: true }),
  changeEventDate: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/components/decoracion/SalonDelClienteEn3D', () => ({
  SalonDelClienteEn3D: () => null,
}));

jest.mock('@/components/tutorial/BotonComoFunciona', () => ({
  BotonComoFunciona: () => null,
}));

jest.mock('@/components/public-footer', () => ({
  PublicFooter: () => null,
}));

import PublicPortalClientExperience from '@/app/portal/c/[accessKey]/PublicPortalClientExperience';

describe('Orden 369 Bloque 1: la cancelación parcial muestra lo mismo que cobra el servidor', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('con 10% de descuento y dos servicios de $100.000, cancelar uno muestra $120.000 igual que totalTrasCancelar', () => {
    const item1 = {
      idServicioCatalogo: 'srv-1',
      nombreServicio: 'Sonido e Iluminación',
      cantidad: 1,
      costoTotalItem: 100000,
    };
    const item2 = {
      idServicioCatalogo: 'srv-2',
      nombreServicio: 'Barra de Tragos',
      cantidad: 1,
      costoTotalItem: 100000,
    };
    const penalty = Math.round(100000 * 0.3);
    const esperado = totalTrasCancelar(
      [item2, { idServicioCatalogo: 'multa_cancelacion_preview', costoTotalItem: penalty }],
      'porcentaje',
      10,
    );
    expect(esperado).toBe(120000);

    const fiesta = {
      id: 'fiesta-cancel-1',
      estado: 'Confirmada',
      configuracion: {
        nombreEvento: 'Boda Test',
        fechaEvento: '2027-11-20',
        tipoCelebracion: 'Boda',
        invitadosEstimados: 100,
      },
      clientPortalSettings: {
        enabled: true,
        accessKey: 'KEY123',
        showFinancials: true,
      },
      contratoDatos: {
        fechaFirmaContrato: `${new Date().getFullYear()}-01-10`,
        ajusteAnualPorcentaje: 15,
      },
      invitados: [],
      planDePagos: { cuotas: [] },
    } as any;

    const presupuesto = {
      id: 'pres-1',
      itemsPresupuestados: [item1, item2],
      descuentoTipo: 'porcentaje',
      descuentoValor: 10,
      costoTotalEstimado: 200000,
      totalConDescuento: 180000,
      pagos: [{ id: 'p1', monto: 50000, fecha: '2026-01-15', metodo: 'Transferencia' }],
    } as any;

    act(() => {
      root.render(
        React.createElement(PublicPortalClientExperience, {
          fiesta,
          presupuesto,
          accessKey: 'KEY123',
          initialUnlocked: true,
          publicShareUrl: 'https://ak.test/portal/c/KEY123',
        }),
      );
    });

    const btnAbrirCancelacion = Array.from(host.querySelectorAll('button')).find(
      b => /Cancelar Servicios/i.test(b.textContent || ''),
    );
    expect(btnAbrirCancelacion).toBeTruthy();

    act(() => {
      btnAbrirCancelacion!.click();
    });

    const checkboxes = Array.from(host.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    const checkServicio1 = checkboxes.find(input =>
      input.closest('label')?.textContent?.includes('Sonido e Iluminación'),
    );
    expect(checkServicio1).toBeTruthy();

    act(() => {
      checkServicio1!.click();
    });

    expect(host.textContent).toContain('Nuevo total del contrato:');
    expect(host.textContent).toContain('120.000');

    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx'),
      'utf8',
    );
    expect(source).toContain('totalTrasCancelar');
  });
});
