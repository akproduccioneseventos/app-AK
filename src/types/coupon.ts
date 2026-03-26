export interface Coupon {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number; // porcentaje (0-100) o monto en UYU
  fechaInicio: string; // ISO date
  fechaFin: string; // ISO date
  usosMaximos: number; // 0 = ilimitado
  usosActuales: number;
  activo: boolean;
  tipoEvento?: string; // Aplica solo a cierto tipo de evento, vacío = todos
  montoMinimo?: number; // Monto mínimo del presupuesto para usar el cupón
  creadoPor: string;
  creadoEn: string; // ISO date
  actualizadoEn?: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  codigoCupon: string;
  presupuestoId: string;
  clienteNombre: string;
  montoDescuento: number;
  montoPresupuesto: number;
  fechaUso: string; // ISO date
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  descuentoCalculado?: number;
}
