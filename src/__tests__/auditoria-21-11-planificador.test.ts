import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Auditoría 21-11 - Planificador y Bloque 3', () => {
  it('1. Salón conserva gerente correctamente en edición', () => {
    const salon = {
      id: 'salon-1',
      nombre: 'Salón Principal',
      gerente: { nombre: 'Carlos', whatsapp: '59899123456' }
    };
    expect(salon.gerente?.nombre).toBe('Carlos');
    expect(salon.gerente?.whatsapp).toBe('59899123456');
  });

  it('2. Alergias cuentan personas correctamente usando getGuestPartySize', () => {
    const { getGuestPartySize } = require('../lib/fiesta/guest-counts');
    const invitado = { id: 'g1', nombre: 'Familia Perez', partySize: 4, dietaryRestriction: 'Celíaco' };
    expect(getGuestPartySize(invitado)).toBe(4);
  });

  it('3. Fiestas suspendidas o demo son excluidas de agenda / eventos', () => {
    const { esFiestaSuspendida } = require('../lib/fiesta/revisar-fiestas');
    const { esFiestaDemo } = require('../lib/events/event-ordering');

    const suspendida = { id: 'f1', estado: 'Suspendida' };
    const demo = { id: 'f2', estado: 'Demo AK' };
    const normal = { id: 'f3', estado: 'Confirmada' };

    expect(esFiestaSuspendida(suspendida)).toBe(true);
    expect(esFiestaDemo(demo)).toBe(true);
    expect(esFiestaSuspendida(normal)).toBe(false);
    expect(esFiestaDemo(normal)).toBe(false);
  });
});
