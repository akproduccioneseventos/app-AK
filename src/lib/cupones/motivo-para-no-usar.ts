import type { Coupon } from '@/types/coupon';

/**
 * Lo que impide usar un cupón AHORA, o null si se puede.
 *
 * Es UNA sola regla para los dos momentos: cuando el vendedor lo prueba (`validarCupon`) y
 * cuando el presupuesto se guarda (`registrarUsoCupon`). Entre un momento y el otro el cupón
 * pudo vencerse, desactivarse o gastar su último uso; si cada lugar tuviera su copia de la
 * regla, una se olvidaría de algo (la fecha de inicio, por ejemplo) y el cupón se aplicaría
 * igual.
 */
export function motivoParaNoUsarCupon(cupon: Coupon, ahora: Date = new Date()): string | null {
  if (!cupon.activo) return 'Este cupón está desactivado.';

  const inicio = new Date(cupon.fechaInicio);
  const fin = new Date(cupon.fechaFin);
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return 'Las fechas del cupón no son válidas.';
  }
  fin.setHours(23, 59, 59, 999); // el último día cuenta entero

  if (ahora < inicio) return 'Este cupón aún no está vigente.';
  if (ahora > fin) return 'Este cupón ha expirado.';

  if (cupon.usosMaximos > 0 && cupon.usosActuales >= cupon.usosMaximos) {
    return 'Este cupón ya alcanzó el límite de usos.';
  }
  return null;
}
