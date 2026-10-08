/**
 * El invitado reserva un regalo desde la invitación, sin sesión (8/10/2026).
 *
 * Reservar pasaba por `saveFiesta`, que pide sesión del equipo o del portal: para un invitado
 * anónimo siempre fallaba con "No autorizado". Ahora es una escritura angosta (`publicRsvp`)
 * que sólo marca ese regalo. Acá la guarda de escritura de la fiesta TIRA siempre, como con un
 * desconocido: si claimGift volviera a pedir sesión, estos casos se ponen en rojo.
 */
let documento: any;
const requireFiestaWriteAccess = jest.fn(async () => { throw new Error('No autorizado para modificar este evento.'); });
const saveFiesta = jest.fn();
const limite = jest.fn();

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: async () => documento,
  saveFiesta: (...a: any[]) => saveFiesta(...a),
  requireFiestaWriteAccess: (...a: any[]) => (requireFiestaWriteAccess as any)(...a),
}));
jest.mock('@/lib/generic-json-store', () => ({
  // Devuelve una copia en cada lectura, como la base de verdad.
  mutarDocumentoConTransaccion: async (_p: string, _d: any, fn: (a: any) => Promise<any>) => {
    documento = await fn(JSON.parse(JSON.stringify(documento)));
    return documento;
  },
}));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: async (_id: string, f: any) => f }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: (...a: any[]) => limite(...a) }));

import { claimGift } from '@/app/actions/fiesta/regalos.actions';

function fiesta() {
  return {
    id: 'f1',
    nombreEvento: 'Quince de Ana',
    cuotas: [{ id: 'c1', pagada: false, monto: 1000 }],
    invitacionDigital: {
      titulo: 'Hola',
      regalos: {
        visible: true,
        items: [
          { id: 'g1', name: 'Cafetera', isClaimed: false },
          { id: 'g2', name: 'Licuadora', isClaimed: true, claimedBy: 'Tía Marta' },
        ],
      },
    },
  };
}

describe('El invitado reserva un regalo sin sesión', () => {
  beforeEach(() => {
    documento = fiesta();
    saveFiesta.mockReset();
    limite.mockReset();
    limite.mockResolvedValue(undefined);
  });

  it('un invitado anónimo reserva un regalo libre y queda a su nombre limpio', async () => {
    const r = await claimGift('f1', 'g1', '   Juan   Pérez  ');
    expect(r.success).toBe(true);
    expect(documento.invitacionDigital.regalos.items[0]).toMatchObject({ isClaimed: true, claimedBy: 'Juan Pérez' });
    expect(saveFiesta).not.toHaveBeenCalled();
    expect(limite).toHaveBeenCalledWith(expect.objectContaining({ identity: 'f1' }));
  });

  it('el nombre se corta a 80 caracteres', async () => {
    await claimGift('f1', 'g1', 'x'.repeat(200));
    expect(documento.invitacionDigital.regalos.items[0].claimedBy).toHaveLength(80);
  });

  it('un segundo invitado no pisa un regalo ya reservado', async () => {
    const r = await claimGift('f1', 'g2', 'Otro');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/eligió otro invitado/);
    expect(documento.invitacionDigital.regalos.items[1].claimedBy).toBe('Tía Marta');
  });

  it('un regalo que no existe se rechaza', async () => {
    const r = await claimGift('f1', 'g99', 'Juan');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/no encontrado/i);
  });

  it('sin nombre no reserva', async () => {
    const r = await claimGift('f1', 'g1', '   ');
    expect(r.success).toBe(false);
    expect(documento.invitacionDigital.regalos.items[0].isClaimed).toBe(false);
  });

  it('no cambia nada más de la fiesta (cuotas, nombre, otros regalos)', async () => {
    const antes = fiesta();
    await claimGift('f1', 'g1', 'Juan');
    expect(documento.cuotas).toEqual(antes.cuotas);
    expect(documento.nombreEvento).toBe(antes.nombreEvento);
    expect(documento.invitacionDigital.titulo).toBe('Hola');
    expect(documento.invitacionDigital.regalos.items[1]).toEqual(antes.invitacionDigital.regalos.items[1]);
  });

  it('el tope de intentos por fiesta frena a quien abusa', async () => {
    limite.mockRejectedValue(new Error('Demasiados intentos. Espera unos minutos y vuelve a probar.'));
    const r = await claimGift('f1', 'g1', 'Juan');
    expect(r.success).toBe(false);
    expect(documento.invitacionDigital.regalos.items[0].isClaimed).toBe(false);
  });
});
