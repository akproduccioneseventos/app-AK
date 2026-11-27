import 'server-only';

import { readData, writeData, deleteDataItem } from '@/lib/data-service';
import { esLecturaFallida } from '@/lib/marca-de-lectura';
import { verifySession } from '@/lib/auth/session-token';
import { perfilDe } from '@/lib/auth/perfiles';
import { esSesionDeAuditor, esSesionDeSoloLectura } from '@/lib/auth/solo-lectura';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Invoice } from '@/types/invoice';

const ESTADO_LIMPIEZA_FILE = 'limpiar-pruebas-estado.json';
const COPIA_RESPALDO_FILE = 'limpiar-pruebas-copia.json';

const NOMBRES_EXACTOS_PRUEBA = new Set([
  'prueba test',
  'prueba led transferencia 23nov',
  'cliente prueba',
]);

/**
 * Detecta exclusivamente nombres de prueba explícitos de Orden 355:
 * empieza con "PRUEBA" (palabra completa, sin plurales como "Pruebas de sonido")
 * o coincide exactamente con los 3 nombres autorizados por el dueño.
 */
export function esNombreDePruebaAutorizado(nombre?: string | null): boolean {
  const raw = String(nombre || '').trim();
  if (!raw) return false;
  const norm = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (NOMBRES_EXACTOS_PRUEBA.has(norm)) return true;
  return /^prueba(?:\s|$|[-_:]|\d)/i.test(norm);
}

export interface ResultadoLimpiarPruebas {
  ejecutada: boolean;
  omitido?: 'solo_dueno' | 'ya_corrio' | 'lectura_fallida';
  borrados: Array<{ modulo: string; id: string; nombre: string }>;
  noBorrados: Array<{ modulo: string; id: string; nombre: string; motivo: string }>;
  errores: string[];
}

export interface OpcionesLimpiarPruebas {
  ahora?: Date;
  validarDueno?: boolean;
}

export async function correrLimpiezaDePruebas(
  opciones: OpcionesLimpiarPruebas = {},
): Promise<ResultadoLimpiarPruebas> {
  const resultado: ResultadoLimpiarPruebas = {
    ejecutada: false,
    borrados: [],
    noBorrados: [],
    errores: [],
  };

  if (opciones.validarDueno !== false) {
    const sesion = await verifySession().catch(() => ({ success: false as const }));
    const user = (sesion as any)?.user;
    const esDueno =
      sesion.success &&
      Boolean(user) &&
      perfilDe(user) === 'dueno' &&
      user.perfil !== 'auditor' &&
      user.role !== 'auditor' &&
      !(await esSesionDeAuditor()) &&
      !(await esSesionDeSoloLectura());
    if (!esDueno) {
      return { ...resultado, omitido: 'solo_dueno' };
    }
  }

  const estadoPrevio = await readData<{ ejecutada?: boolean }>(ESTADO_LIMPIEZA_FILE, {});
  if (estadoPrevio?.ejecutada) {
    return { ...resultado, omitido: 'ya_corrio' };
  }

  const [menus, leads, presupuestos, clientes, empleados, salones, insumos, fiestas, facturas] = await Promise.all([
    readData<any[]>('menus-catering.json', []),
    readData<any[]>('crm-leads.json', []),
    readData<Presupuesto[]>('presupuestos.json', []),
    readData<any[]>('customers.json', []),
    readData<any[]>('empleados.json', []),
    readData<any[]>('salones.json', []),
    readData<any[]>('insumos.json', []),
    readData<FiestaEnPlanificacion[]>('fiestas.json', []),
    readData<Invoice[]>('invoices.json', []),
  ]);

  if ([menus, leads, presupuestos, clientes, empleados, salones, insumos, fiestas, facturas].some((r) => esLecturaFallida(r))) {
    return { ...resultado, omitido: 'lectura_fallida' };
  }

  const fiestasPorPresupuesto = new Map<string, FiestaEnPlanificacion>();
  for (const f of Array.isArray(fiestas) ? fiestas : []) {
    if (f?.presupuestoId) fiestasPorPresupuesto.set(f.presupuestoId, f);
  }
  const facturasPorPresupuesto = new Set<string>(
    (Array.isArray(facturas) ? facturas : [])
      .map((inv: any) => inv?.sourcePresupuestoId)
      .filter(Boolean),
  );

  type Candidato = {
    modulo: string;
    file: string;
    collection: string;
    id: string;
    nombre: string;
    raw: any;
  };
  const aBorrar: Candidato[] = [];

  const evaluarLista = (
    items: any[],
    modulo: string,
    file: string,
    collection: string,
    getNombre: (x: any) => string,
  ) => {
    for (const item of Array.isArray(items) ? items : []) {
      const nombre = getNombre(item);
      if (!item?.id || !esNombreDePruebaAutorizado(nombre)) continue;

      if (modulo === 'presupuestos') {
        const tienePagos = Array.isArray(item.pagosCliente) &&
          item.pagosCliente.some((p: any) => p && p.estadoPago !== 'rechazado' && Number(p.monto) > 0);
        const fiestaAsociada = fiestasPorPresupuesto.get(item.id);
        const tieneCuotaPagada = Boolean(
          fiestaAsociada?.planDePagos?.cuotas?.some((c) => c.estado === 'pagado' || c.estado === 'parcial'),
        );
        const tieneContratoFirmado = Boolean(
          fiestaAsociada?.contratoFirmaInfo?.isSigned || fiestaAsociada?.firmaDigitalConstancia?.signedAt,
        );
        const tieneFactura = facturasPorPresupuesto.has(item.id) ||
          Boolean(fiestaAsociada?.invoiceIds && fiestaAsociada.invoiceIds.length > 0);

        if (tienePagos || tieneCuotaPagada || tieneContratoFirmado || tieneFactura) {
          resultado.noBorrados.push({
            modulo,
            id: item.id,
            nombre,
            motivo: 'Tiene cobros, cuotas pagadas, factura o contrato firmado.',
          });
          continue;
        }
      }

      aBorrar.push({ modulo, file, collection, id: item.id, nombre, raw: item });
    }
  };

  evaluarLista(menus, 'menus-catering', 'menus-catering.json', 'menus_catering', (x) => x?.name || x?.nombre || '');
  evaluarLista(leads, 'crm', 'crm-leads.json', 'prospectos', (x) => x?.name || x?.nombre || '');
  evaluarLista(presupuestos, 'presupuestos', 'presupuestos.json', 'presupuestos', (x) => x?.clienteNombre || x?.nombre || '');
  evaluarLista(clientes, 'clientes', 'customers.json', 'clientes', (x) => x?.name || x?.nombre || '');
  evaluarLista(empleados, 'empleados', 'empleados.json', 'empleados', (x) => x?.nombre || x?.name || '');
  evaluarLista(salones, 'salones', 'salones.json', 'salones', (x) => x?.nombre || x?.name || '');
  evaluarLista(insumos, 'insumos', 'insumos.json', 'insumos', (x) => x?.nombre || x?.name || '');

  if (aBorrar.length > 0) {
    await writeData(COPIA_RESPALDO_FILE, {
      fecha: (opciones.ahora ?? new Date()).toISOString(),
      registros: aBorrar.map((c) => ({ modulo: c.modulo, id: c.id, nombre: c.nombre, dato: c.raw })),
    }, undefined, { skipAutoBackup: true });
  }

  for (const item of aBorrar) {
    try {
      const ok = await deleteDataItem(item.file, item.collection, item.id);
      if (ok) {
        resultado.borrados.push({ modulo: item.modulo, id: item.id, nombre: item.nombre });
      } else {
        resultado.noBorrados.push({
          modulo: item.modulo,
          id: item.id,
          nombre: item.nombre,
          motivo: 'No se encontró al borrar.',
        });
      }
    } catch (err: any) {
      resultado.errores.push(`${item.modulo}:${item.id} (${err?.message || 'error'})`);
    }
  }

  const finalEstado = {
    ejecutada: true,
    fecha: (opciones.ahora ?? new Date()).toISOString(),
    borrados: resultado.borrados,
    noBorrados: resultado.noBorrados,
    errores: resultado.errores,
  };
  await writeData(ESTADO_LIMPIEZA_FILE, finalEstado, undefined, { skipAutoBackup: true });
  resultado.ejecutada = true;
  return resultado;
}
