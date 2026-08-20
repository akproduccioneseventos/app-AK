import {
  calculateMercadoPagoCuotas,
  presentacionComercialMercadoPago,
} from '@/lib/payments/mercadopago-calculator';

/**
 * El mismo dinero, contado como descuento por pagar al contado.
 *
 * Decision comercial del dueno: al cliente no se le muestra "te recargamos un 10%
 * si pagas en cuotas", sino "precio de lista, y con pago contado te hacemos un
 * descuento". Es la misma plata y es cierto: el descuento por pago contado es una
 * practica normal, y el recargo se lee como un castigo justo cuando la persona
 * esta decidiendo.
 *
 * **Lo que esta prueba protege es que sea la misma plata.** Si algun dia alguien
 * cambia una de las dos cuentas y no la otra, el cliente ve un numero en el
 * presupuesto y le cobran otro.
 */
describe('el descuento por pago contado', () => {
  const montos = [0, 1, 999, 100_000, 137_450, 1_250_000];

  it.each(montos)('con base %i es exactamente la misma plata que el recargo', (base) => {
    const conRecargo = calculateMercadoPagoCuotas(base);
    const comercial = presentacionComercialMercadoPago(base);

    expect(comercial.precioContado).toBe(conRecargo.baseAmount);
    expect(comercial.precioLista).toBe(conRecargo.totalWithSurcharge);
    expect(comercial.ahorroContado).toBe(conRecargo.surchargeAmount);
  });

  it('el descuento se calcula sobre el precio de lista, no sobre el contado', () => {
    // Un recargo del 10% sobre 100.000 son 10.000, que sobre 110.000 es un 9%.
    // Decir "10% de descuento" seria inflarlo y el numero no cerraria.
    const comercial = presentacionComercialMercadoPago(100_000);

    expect(comercial.precioContado).toBe(100_000);
    expect(comercial.precioLista).toBe(110_000);
    expect(comercial.ahorroContado).toBe(10_000);
    expect(comercial.descuentoContadoPercent).toBe(9);
  });

  it('con monto cero no rompe ni divide por cero', () => {
    const comercial = presentacionComercialMercadoPago(0);

    expect(comercial.precioLista).toBe(0);
    expect(comercial.descuentoContadoPercent).toBe(0);
  });
});
