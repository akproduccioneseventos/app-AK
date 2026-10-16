import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import BudgetDocument, { FranjaTranquilidad } from '@/components/budget/BudgetDocument';
import type { Presupuesto } from '@/types/presupuesto';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

describe('La franja del presupuesto no cambia números (Orden 181)', () => {
  const basePresupuesto: Presupuesto = {
    id: 'pres_123',
    numero: 'PR-123',
    clienteNombre: 'Familia Perez',
    clienteEmail: 'perez@test.com',
    clienteTelefono: '099123456',
    eventoTipo: 'Boda',
    eventoFecha: '2027-04-15',
    cantidadInvitados: 100,
    precioTotal: 150000,
    total: 150000,
    precioPorPersona: 1500,
    items: [
      {
        id: 'item_1',
        nombreServicio: 'DJ y Sonido',
        descripcionServicio: 'Pista y sonido profesional',
        precioUnitario: 30000,
        cantidad: 1,
        costoTotalItem: 30000,
        categoria: 'Música',
      },
      {
        id: 'item_2',
        nombreServicio: 'Chupitos de bienvenida',
        descripcionServicio: 'Regalo especial',
        precioUnitario: 0,
        cantidad: 1,
        costoTotalItem: 0,
        categoria: 'Barra',
        esRegalo: true,
      },
    ],
    itemsAgrupados: {
      Música: [
        {
          id: 'item_1',
          nombreServicio: 'DJ y Sonido',
          descripcionServicio: 'Pista y sonido profesional',
          precioUnitario: 30000,
          cantidad: 1,
          costoTotalItem: 30000,
          categoria: 'Música',
        },
      ],
      Barra: [
        {
          id: 'item_2',
          nombreServicio: 'Chupitos de bienvenida',
          descripcionServicio: 'Regalo especial',
          precioUnitario: 0,
          cantidad: 1,
          costoTotalItem: 0,
          categoria: 'Barra',
          esRegalo: true,
        },
      ],
    },
    estado: 'Borrador',
    moneda: 'UYU',
    fechaCreacion: '2026-10-16',
    createdAt: '2026-10-16',
  };

  it('FranjaTranquilidad renderiza los regalos bonificados y opciones de pago sin tocar precios', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    act(() => {
      root.render(
        <FranjaTranquilidad
          itemsRegalo={[
            {
              id: 'reg_1',
              nombreServicio: 'Chupitos de bienvenida',
              descripcionServicio: '',
              precioUnitario: 0,
              cantidad: 1,
              costoTotalItem: 0,
              categoria: 'Barra',
              esRegalo: true,
            },
          ]}
          mostrarMercadoPago={true}
        />
      );
    });

    const text = host.textContent || '';
    expect(text).toContain('Tranquilidad incluida con tu fiesta');
    expect(text).toContain('Reservás tu fecha con una seña');
    expect(text).toContain('Plan de pagos mensuales a tu medida');
    expect(text).toContain('Hasta 12 cuotas con tarjeta');
    expect(text).toContain('Chupitos de bienvenida');
    expect(text).toContain('Incluido');

    act(() => root.unmount());
    host.remove();
  });

  it('BudgetDocument muestra el mismo total con y sin regalos', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    act(() => {
      root.render(<BudgetDocument presupuesto={basePresupuesto} />);
    });

    const text = host.textContent || '';
    expect(text).toContain('Tranquilidad incluida con tu fiesta');
    expect(text).toContain('Chupitos de bienvenida');

    act(() => root.unmount());
    host.remove();
  });
});
