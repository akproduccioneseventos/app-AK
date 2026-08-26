import { readData, writeData } from '@/lib/data-service';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';

const PARTE_CACHE_FILE = 'parte-manana-cache.json';

export interface ItemParteManana {
  id: string;
  tipo: 'cobranza' | 'fiesta_proxima' | 'prospecto';
  titulo: string;
  detalle: string;
  accionHref?: string;
  accionTexto?: string;
}

export interface ParteDeLaManana {
  fecha: string;
  textoHablado: string;
  textoResumen: string;
  itemsPrincipales: ItemParteManana[];
  totalPendientes: number;
}

/**
 * Genera o lee el parte de la mañana del día (cacheado para gastar una sola vez al día).
 */
export async function getParteDeLaManana(forzar = false): Promise<ParteDeLaManana> {
  const hoyStr = new Date().toISOString().split('T')[0];

  if (!forzar) {
    try {
      const cache = await readData<ParteDeLaManana | null>(PARTE_CACHE_FILE, null);
      if (cache && cache.fecha === hoyStr) {
        return cache;
      }
    } catch {}
  }

  const parte = await calcularParteDeLaManana();
  await writeData(PARTE_CACHE_FILE, parte).catch(() => null);
  return parte;
}

/**
 * Calcula el parte matutino cruzando fiestas, cuotas y presupuestos.
 * Cumple estrictamente las reglas de calma: sin palabras de estrés.
 */
export async function calcularParteDeLaManana(): Promise<ParteDeLaManana> {
  const ahora = new Date();
  const hoyStr = ahora.toISOString().split('T')[0];
  const items: ItemParteManana[] = [];

  const [fiestas, presupuestos] = await Promise.all([
    getFiestas(false).catch(() => []),
    getPresupuestos().catch(() => []),
  ]);

  // 1. Cobranzas por atender en los próximos 7 días
  const presupuestosMap = new Map(presupuestos.map((p) => [p.id, p]));
  for (const fiesta of fiestas) {
    if (!fiesta.presupuestoId) continue;
    const p = presupuestosMap.get(fiesta.presupuestoId);
    if (!p || !p.clienteNombre) continue;

    const fechaFiesta = fiesta.configuracion?.fechaEvento || (fiesta.configuracion as any)?.fecha;
    if (!fechaFiesta) continue;

    const diasParaFiesta = Math.ceil((new Date(fechaFiesta).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    const pagos = (p.pagosCliente || [])
      .filter((pg) => pg.estadoPago !== 'rechazado')
      .reduce((acc, pg) => acc + (Number(pg.monto) || 0), 0);
    const total = Number(p.totalConDescuento || p.costoTotalEstimado || 0);
    const saldo = total - pagos;

    if (saldo > 500 && diasParaFiesta >= 0 && diasParaFiesta <= 14) {
      items.push({
        id: `cobro_${fiesta.id}`,
        tipo: 'cobranza',
        titulo: `Cobranza de ${p.clienteNombre}`,
        detalle: `Saldo de $${saldo.toLocaleString('es-UY')} para la fiesta en ${diasParaFiesta} días. Mensaje listo en bandeja.`,
        accionHref: '/contabilidad/crm/outbox',
        accionTexto: 'Ver mensaje',
      });
    }
  }

  // 2. Fiestas de las próximas 2 semanas (revisar qué falta)
  for (const fiesta of fiestas) {
    const fechaStr = fiesta.configuracion?.fechaEvento || (fiesta.configuracion as any)?.fecha;
    if (!fechaStr) continue;

    const dias = Math.ceil((new Date(fechaStr).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
    if (dias >= 0 && dias <= 14) {
      const nombre = fiesta.configuracion?.nombreEvento || 'Fiesta';
      const faltantes: string[] = [];

      if (!fiesta.menuAsignadoId && !fiesta.menuMesa?.platoPrincipal) {
        faltantes.push('confirmar menú');
      }
      if (!fiesta.invitados || fiesta.invitados.length === 0) {
        faltantes.push('cerrar lista de invitados');
      }

      if (faltantes.length > 0) {
        items.push({
          id: `fiesta_${fiesta.id}`,
          tipo: 'fiesta_proxima',
          titulo: `Coordinación de ${nombre}`,
          detalle: `Falta ${faltantes.join(' y ')} para el evento del ${new Date(fechaStr).toLocaleDateString('es-UY')}.`,
          accionHref: `/fiestas/nueva?fiestaId=${fiesta.id}`,
          accionTexto: 'Abrir fiesta',
        });
      }
    }
  }

  // 3. Prospectos con presupuestos enviados sin respuesta (5 a 14 días)
  for (const p of presupuestos) {
    if (p.estado === 'Enviado' && p.clienteNombre && p.timestamp) {
      const diasDesdeEnvio = Math.floor((ahora.getTime() - new Date(p.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      if (diasDesdeEnvio >= 5 && diasDesdeEnvio <= 30) {
        items.push({
          id: `prospecto_${p.id}`,
          tipo: 'prospecto',
          titulo: `Seguimiento a ${p.clienteNombre}`,
          detalle: `Presupuesto enviado hace ${diasDesdeEnvio} días. Mensaje preparado en bandeja.`,
          accionHref: '/contabilidad/crm/outbox',
          accionTexto: 'Ver seguimiento',
        });
      }
    }
  }

  const itemsPrincipales = items.slice(0, 3);
  const totalPendientes = items.length;

  let textoHablado = '';
  let textoResumen = '';

  if (totalPendientes === 0) {
    textoHablado = 'Buen día. Por hoy está todo al día.';
    textoResumen = 'Por hoy está todo al día.';
  } else {
    const nombresAcciones = itemsPrincipales.map((it) => it.titulo.toLowerCase()).join(', ');
    const extra = totalPendientes > 3 ? ` Además hay ${totalPendientes - 3} cosas más para ver.` : '';
    textoHablado = `Buen día. Hoy tenemos ${itemsPrincipales.length} puntos para avanzar: ${nombresAcciones}.${extra} ¿Por cuál empezamos?`;
    textoResumen = `Hoy hay ${totalPendientes} cosas para hacer.`;
  }

  return {
    fecha: hoyStr,
    textoHablado,
    textoResumen,
    itemsPrincipales,
    totalPendientes,
  };
}
