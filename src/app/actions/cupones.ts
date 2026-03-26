'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Coupon, CouponUsage, CouponValidationResult } from '@/types/coupon';

const CUPONES_FILE = 'cupones.json';
const CUPONES_USAGE_FILE = 'cupones-usage.json';

// ===== CRUD =====

export async function getCupones(): Promise<Coupon[]> {
  return readData<Coupon[]>(CUPONES_FILE, []);
}

export async function getCuponById(id: string): Promise<Coupon | null> {
  const cupones = await getCupones();
  return cupones.find(c => c.id === id) || null;
}

export async function saveCupon(
  data: Omit<Coupon, 'id' | 'usosActuales' | 'creadoEn'> & { id?: string }
): Promise<{ success: boolean; error?: string; cupon?: Coupon }> {
  try {
    let cupones = await getCupones();

    // Validaciones
    if (!data.codigo || data.codigo.trim() === '') {
      return { success: false, error: 'El código del cupón es obligatorio.' };
    }
    if (!data.nombre || data.nombre.trim() === '') {
      return { success: false, error: 'El nombre del cupón es obligatorio.' };
    }
    if (data.valor <= 0) {
      return { success: false, error: 'El valor del cupón debe ser mayor a cero.' };
    }
    if (data.tipo === 'porcentaje' && data.valor > 100) {
      return { success: false, error: 'El porcentaje no puede ser mayor a 100%.' };
    }

    const codigoNorm = data.codigo.trim().toUpperCase();

    if (data.id) {
      // Editar existente
      const idx = cupones.findIndex(c => c.id === data.id);
      if (idx === -1) return { success: false, error: 'Cupón no encontrado.' };

      // Verificar código duplicado (excluyendo el actual)
      const duplicado = cupones.find(c => c.codigo === codigoNorm && c.id !== data.id);
      if (duplicado) return { success: false, error: `Ya existe un cupón con el código "${codigoNorm}".` };

      cupones[idx] = {
        ...cupones[idx],
        ...data,
        codigo: codigoNorm,
        actualizadoEn: new Date().toISOString(),
      };

      await writeData(CUPONES_FILE, cupones);
      return { success: true, cupon: cupones[idx] };
    } else {
      // Crear nuevo
      const duplicado = cupones.find(c => c.codigo === codigoNorm);
      if (duplicado) return { success: false, error: `Ya existe un cupón con el código "${codigoNorm}".` };

      const nuevo: Coupon = {
        id: `cup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        codigo: codigoNorm,
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        tipo: data.tipo,
        valor: data.valor,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        usosMaximos: data.usosMaximos || 0,
        usosActuales: 0,
        activo: data.activo ?? true,
        tipoEvento: data.tipoEvento || undefined,
        montoMinimo: data.montoMinimo || undefined,
        creadoPor: data.creadoPor || 'Admin',
        creadoEn: new Date().toISOString(),
      };

      cupones.push(nuevo);
      await writeData(CUPONES_FILE, cupones);
      return { success: true, cupon: nuevo };
    }
  } catch (error: any) {
    console.error('Error guardando cupón:', error);
    return { success: false, error: error.message || 'Error al guardar el cupón.' };
  }
}

export async function toggleCuponActivo(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cupones = await getCupones();
    const idx = cupones.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, error: 'Cupón no encontrado.' };

    cupones[idx].activo = !cupones[idx].activo;
    cupones[idx].actualizadoEn = new Date().toISOString();
    await writeData(CUPONES_FILE, cupones);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCupon(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let cupones = await getCupones();
    cupones = cupones.filter(c => c.id !== id);
    await writeData(CUPONES_FILE, cupones);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ===== VALIDACIÓN =====

export async function validarCupon(
  codigo: string,
  montoPresupuesto: number,
  tipoEvento?: string
): Promise<CouponValidationResult> {
  if (!codigo || codigo.trim() === '') {
    return { valid: false, error: 'Ingresa un código de cupón.' };
  }

  const cupones = await getCupones();
  const cupon = cupones.find(c => c.codigo === codigo.trim().toUpperCase());

  if (!cupon) {
    return { valid: false, error: 'Código de cupón no válido.' };
  }

  if (!cupon.activo) {
    return { valid: false, error: 'Este cupón está desactivado.' };
  }

  const ahora = new Date();
  const inicio = new Date(cupon.fechaInicio);
  const fin = new Date(cupon.fechaFin);
  fin.setHours(23, 59, 59, 999); // Include the full last day

  if (ahora < inicio) {
    return { valid: false, error: 'Este cupón aún no está vigente.' };
  }
  if (ahora > fin) {
    return { valid: false, error: 'Este cupón ha expirado.' };
  }

  if (cupon.usosMaximos > 0 && cupon.usosActuales >= cupon.usosMaximos) {
    return { valid: false, error: 'Este cupón ya alcanzó el límite de usos.' };
  }

  if (cupon.tipoEvento && tipoEvento && cupon.tipoEvento !== tipoEvento) {
    return { valid: false, error: `Este cupón solo aplica para eventos de tipo "${cupon.tipoEvento}".` };
  }

  if (cupon.montoMinimo && montoPresupuesto < cupon.montoMinimo) {
    return { valid: false, error: `El monto mínimo para usar este cupón es $${cupon.montoMinimo.toLocaleString()}.` };
  }

  // Calcular descuento
  let descuentoCalculado = 0;
  if (cupon.tipo === 'porcentaje') {
    descuentoCalculado = Math.round((montoPresupuesto * cupon.valor) / 100);
  } else {
    descuentoCalculado = Math.min(cupon.valor, montoPresupuesto); // No puede ser mayor al monto
  }

  return {
    valid: true,
    coupon: cupon,
    descuentoCalculado,
  };
}

// ===== REGISTRAR USO =====

export async function registrarUsoCupon(
  couponId: string,
  presupuestoId: string,
  clienteNombre: string,
  montoDescuento: number,
  montoPresupuesto: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Incrementar usos del cupón
    const cupones = await getCupones();
    const idx = cupones.findIndex(c => c.id === couponId);
    if (idx === -1) return { success: false, error: 'Cupón no encontrado.' };

    cupones[idx].usosActuales += 1;
    cupones[idx].actualizadoEn = new Date().toISOString();
    await writeData(CUPONES_FILE, cupones);

    // Registrar uso
    const usages = await readData<CouponUsage[]>(CUPONES_USAGE_FILE, []);
    usages.push({
      id: `cupu_${Date.now()}`,
      couponId,
      codigoCupon: cupones[idx].codigo,
      presupuestoId,
      clienteNombre,
      montoDescuento,
      montoPresupuesto,
      fechaUso: new Date().toISOString(),
    });
    await writeData(CUPONES_USAGE_FILE, usages);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ===== ESTADÍSTICAS =====

export async function getCuponStats(couponId: string): Promise<{
  totalUsos: number;
  totalDescuento: number;
  usos: CouponUsage[];
}> {
  const usages = await readData<CouponUsage[]>(CUPONES_USAGE_FILE, []);
  const cuponUsages = usages.filter(u => u.couponId === couponId);

  return {
    totalUsos: cuponUsages.length,
    totalDescuento: cuponUsages.reduce((sum, u) => sum + u.montoDescuento, 0),
    usos: cuponUsages,
  };
}

export async function getAllCuponUsages(): Promise<CouponUsage[]> {
  return readData<CouponUsage[]>(CUPONES_USAGE_FILE, []);
}
