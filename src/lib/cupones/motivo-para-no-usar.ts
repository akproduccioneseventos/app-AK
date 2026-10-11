import type { Coupon } from '@/types/coupon';

const calendarioUruguay = new Intl.DateTimeFormat('en', {
  timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit',
});

function limiteDelDia(valor: string, fin: boolean): Date | null {
  const soloDia = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const horaSinZona = /^\d{4}-\d{2}-\d{2}T/.test(valor) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(valor);
  const parsed = new Date(horaSinZona ? `${valor}-03:00` : valor);
  if (Number.isNaN(parsed.getTime())) return null;
  if (soloDia && parsed.toISOString().slice(0, 10) !== valor) return null;
  if (!fin && !soloDia) return parsed;
  const partes = calendarioUruguay.formatToParts(parsed);
  const campo = (tipo: Intl.DateTimeFormatPartTypes) => partes.find(p => p.type === tipo)?.value;
  const dia = soloDia ? valor : `${campo('year')}-${campo('month')}-${campo('day')}`;
  const limite = new Date(`${dia}T${fin ? '23:59:59.999' : '00:00:00'}-03:00`);
  return Number.isNaN(limite.getTime()) ? null : limite;
}

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

  const inicio = limiteDelDia(cupon.fechaInicio, false);
  const fin = limiteDelDia(cupon.fechaFin, true);
  if (!inicio || !fin) {
    return 'Las fechas del cupón no son válidas.';
  }

  if (ahora < inicio) return 'Este cupón aún no está vigente.';
  if (ahora > fin) return 'Este cupón ha expirado.';

  if (cupon.usosMaximos > 0 && cupon.usosActuales >= cupon.usosMaximos) {
    return 'Este cupón ya alcanzó el límite de usos.';
  }
  return null;
}
