/**
 * MATAFUEGO — El pedido al proveedor pide lo que FALTA, no todo lo que lleva la fiesta.
 *
 * 25 de septiembre de 2026: el mensaje de WhatsApp al proveedor usaba la cantidad total de la
 * receta e ignoraba el depósito: con 8 kg en stock y 20 necesarios, se pedían 20. Plata tirada.
 * Se probo rompiendolo: usando la cantidad necesaria en vez de la que falta, se pone en rojo.
 */
import { armarPedidoAlProveedor } from '@/lib/catering/pedido-al-proveedor';

describe('El pedido al proveedor pide lo que falta', () => {
  const texto = armarPedidoAlProveedor({
    nombreEvento: 'XV de Sofía',
    fechaEvento: '2026-10-10',
    proveedor: 'Carnes del Norte',
    renglones: [
      { nombre: 'Vacío', unit: 'kg', cantidadAComprar: 12, cantidadNecesaria: 20 } as any,
      { nombre: 'Chorizo', unit: 'kg', cantidadAComprar: 0, cantidadNecesaria: 5 } as any,
      { nombre: 'Pan', unit: 'unidades', cantidadAComprar: 40.2 } as any,
    ],
  });

  it('pide lo que falta después del depósito', () => {
    expect(texto).toContain('• Vacío: 12 kg');
    expect(texto).not.toContain('20 kg');
  });

  it('no pide lo que ya hay en el depósito', () => {
    expect(texto).not.toContain('Chorizo');
  });

  it('las unidades van enteras y para arriba', () => {
    expect(texto).toContain('• Pan: 41 unidades');
  });
});
