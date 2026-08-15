import fs from 'fs';
import path from 'path';

/**
 * Defecto real: el paso de cierre de contratacion pedia el monto de la sena pero
 * nunca preguntaba como habia entrado la plata. La sena quedaba asentada como
 * "Efectivo" siempre, y ese metodo se copiaba despues al pago de la factura: una
 * transferencia figuraba como plata en mano y la caja no cerraba con el banco.
 */

const raiz = process.cwd();
const dialogo = fs.readFileSync(
  path.join(raiz, 'src/components/crm/BookingConfirmationDialog.tsx'),
  'utf-8',
);
const accion = fs.readFileSync(path.join(raiz, 'src/app/actions/crm.ts'), 'utf-8');

describe('la sena del contrato dice como entro', () => {
  it('el formulario pregunta el metodo y lo manda al servidor', () => {
    expect(dialogo).toContain('¿Cómo entró la seña?');
    expect(dialogo).toContain("formData.append('metodoPago', metodoSenia)");
  });

  it('el servidor no adivina el metodo: lo rechaza si falta', () => {
    expect(accion).toContain('Falta indicar cómo entró la seña');
    // El relleno viejo no puede volver.
    expect(accion).not.toContain("metodoPago ?? 'Efectivo'");
  });
});
