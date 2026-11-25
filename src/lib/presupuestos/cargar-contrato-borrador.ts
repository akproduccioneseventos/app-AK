import type { Presupuesto, PresupuestoFormData } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu, MenuItem } from '@/types/catering';
import { calculateSuggestedQuantity } from '@/lib/calculations';
import { parseUruguayDate } from '@/lib/utils';

export const CONTRATO_IA_STORAGE_KEY = 'ak_contrato_ia_borrador';

export const INITIAL_PRESUPUESTO_FORM_DATA: PresupuestoFormData = {
  clienteNombre: '',
  clienteContacto: '',
  eventoTipo: '',
  eventoFecha: undefined,
  eventoHoraInicio: '',
  duracionHoras: undefined,
  invitadosCantidad: 50,
  invitadosAdultos: 50,
  invitadosNinos: 0,
  invitadosAdolescentes: 0,
  salonFiestas: '',
  protagonista1Nombre: '',
  protagonista2Nombre: '',
  nombreEmpresa: '',
  serviciosSeleccionados: new Map(),
  selectedMenuId: '',
  notas: '',
  estado: 'Borrador',
  nombrePromocion: 'Descuento Promocional',
  descuentoTipo: 'porcentaje',
  descuentoValor: '10',
  vigenciaPromocion: 'Válido por 30 días',
};

export interface ContratoIaExtraido {
  clienteNombre: string;
  eventoFecha: string;
  montoTotal: number;
  tipoEvento?: string | null;
  telefono?: string | null;
  invitadosAdultos?: number | null;
  invitadosNinos?: number | null;
  fechaFirmaContrato?: string | null;
  contratoFirmado?: boolean | null;
  serviciosContratados?: string[] | null;
  sena?: number | null;
  cuotas?: Array<{ monto: number; fecha?: string | null; concepto?: string | null }> | null;
  tipoAjusteAnual?: 'acumulativo' | 'simple' | null;
}

export interface ContratoIaBorrador {
  data: ContratoIaExtraido;
  archivoNombre?: string;
  leidoEn?: string;
}

export function normalizarNombreServicio(valor: string): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizarTipoEventoDesdeContrato(tipo?: string | null): string {
  const limpio = (tipo || '').trim();
  if (!limpio) return '';
  const norm = normalizarNombreServicio(limpio);
  if (norm === 'boda' || norm === 'casamiento') return 'Boda';
  if (norm === 'xv' || norm === 'xv anos' || norm === '15 anos' || norm === 'quince anos') return 'XV años';
  if (norm === 'cumpleanos' || norm === 'cumple') return 'Cumpleaños';
  if (norm === 'evento corporativo' || norm === 'corporativo') return 'Evento corporativo';
  if (norm === 'cumpleanos infantil' || norm === 'infantil') return 'Cumpleaños infantil';
  return limpio;
}

function parsearFechaContrato(fecha?: string | null): Date | undefined {
  const trimmed = (fecha || '').trim();
  if (!trimmed) return undefined;
  const parsed = parseUruguayDate(trimmed);
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) || !Number.isNaN(Date.parse(trimmed));
  return isValid && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
}

function construirNotasDesdeContrato(data: ContratoIaExtraido): string {
  const lineas: string[] = [];
  if (typeof data.sena === 'number' && Number.isFinite(data.sena) && data.sena > 0) {
    lineas.push(`Seña informada en contrato: $${Math.round(data.sena).toLocaleString('es-UY')}`);
  }
  if (Array.isArray(data.cuotas) && data.cuotas.length > 0) {
    const detalleCuotas = data.cuotas
      .filter((c) => typeof c?.monto === 'number' && Number.isFinite(c.monto))
      .map((c, idx) => {
        const partes = [`Cuota ${idx + 1}: $${Math.round(c.monto).toLocaleString('es-UY')}`];
        if (c.fecha) partes.push(`(${c.fecha})`);
        if (c.concepto) partes.push(`- ${c.concepto}`);
        return partes.join(' ');
      });
    if (detalleCuotas.length > 0) {
      lineas.push(`Plan de cuotas leído del contrato:\n${detalleCuotas.join('\n')}`);
    }
  }
  if (typeof data.montoTotal === 'number' && Number.isFinite(data.montoTotal) && data.montoTotal > 0) {
    lineas.push(`Monto total leído del contrato: $${Math.round(data.montoTotal).toLocaleString('es-UY')}`);
  }
  return lineas.join('\n\n');
}

export function readContratoIaBorradorFromSession(): ContratoIaBorrador | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CONTRATO_IA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContratoIaBorrador;
    if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('No se pudo leer el borrador del contrato en sesión:', error);
    return null;
  }
}

export function buildSeleccionFromServicio(servicio: ServicioEmpresa, adultos: number, ninos: number) {
  return {
    cantidad: calculateSuggestedQuantity({
      calculationMethod: servicio.calculationMethod,
      invitadosPorUnidad: servicio.invitadosPorUnidad,
      nombreServicio: servicio.nombre,
      categoriaServicio: servicio.categoria,
      subcategoria: servicio.subcategoria,
    }, adultos, ninos),
    precioUnitarioOriginal: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
    precioUnitarioPresupuesto: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
    nombreServicio: servicio.nombre,
    unidad: servicio.unidad,
    categoriaServicio: servicio.categoria,
    subcategoria: servicio.subcategoria,
    esRegalo: false,
    calculationMethod: servicio.calculationMethod,
    precioBase: servicio.precioBase,
    precioPorPersona: servicio.precioPorPersona,
    invitadosPorUnidad: servicio.invitadosPorUnidad,
    tramosDePrecio: servicio.tramosDePrecio,
  };
}

export function buildSeleccionFromMenuItem(item: MenuItem, adultos: number, ninos: number) {
  const precio = Number(item.suggestedSellingPrice) || Number(item.totalDishCost) || 0;
  const subcategoria = item.type || 'Catering';
  const nombreServicio = item.name;
  const cantidad = calculateSuggestedQuantity({
    calculationMethod: 'porPersona',
    nombreServicio,
    categoriaServicio: 'Servicio de catering',
    subcategoria,
  }, adultos, ninos);
  return {
    cantidad,
    precioUnitarioOriginal: precio,
    precioUnitarioPresupuesto: precio,
    nombreServicio,
    unidad: 'personas',
    categoriaServicio: 'Servicio de catering',
    subcategoria,
    esRegalo: false,
    calculationMethod: 'porPersona' as const,
    precioPorPersona: precio,
  };
}

export function armarBorradorDesdeContrato(
  borrador: ContratoIaBorrador,
  services: ServicioEmpresa[] = [],
  menuData: FullMenu[] = [],
): {
  formData: PresupuestoFormData;
  tipoAjusteAnual: 'acumulativo' | 'simple';
  fechaFirmaContrato?: string;
  contratoAdjuntoNombre?: string;
  serviciosNoCoincidentes: string[];
} {
  const data = borrador.data;
  const adultos =
    typeof data.invitadosAdultos === 'number' && Number.isFinite(data.invitadosAdultos)
      ? Math.max(0, Math.round(data.invitadosAdultos))
      : INITIAL_PRESUPUESTO_FORM_DATA.invitadosAdultos || 0;
  const ninos =
    typeof data.invitadosNinos === 'number' && Number.isFinite(data.invitadosNinos)
      ? Math.max(0, Math.round(data.invitadosNinos))
      : 0;
  const fechaFirmaContrato = (data.fechaFirmaContrato || '').trim() || undefined;
  const tipoAjusteAnual: 'acumulativo' | 'simple' =
    data.tipoAjusteAnual === 'simple' ? 'simple' : 'acumulativo';
  const estado: Presupuesto['estado'] =
    data.contratoFirmado || Boolean(fechaFirmaContrato) ? 'Aceptado' : 'Borrador';
  const contratoAdjuntoNombre = borrador.archivoNombre?.trim() || undefined;

  const serviciosPorNombre = new Map<string, ServicioEmpresa>();
  for (const s of services) {
    if (s.tipoItem !== 'Servicio') continue;
    const clave = normalizarNombreServicio(s.nombre);
    if (clave && !serviciosPorNombre.has(clave)) {
      serviciosPorNombre.set(clave, s);
    }
  }

  const menuItemsPorNombre = new Map<string, { item: MenuItem; menuId: string }>();
  for (const menu of menuData) {
    for (const item of menu.items || []) {
      const clave = normalizarNombreServicio(item.name);
      if (clave && !menuItemsPorNombre.has(clave)) {
        menuItemsPorNombre.set(clave, { item, menuId: menu.id });
      }
    }
  }

  const serviciosSeleccionados = new Map<
    string,
    ReturnType<typeof buildSeleccionFromServicio> | ReturnType<typeof buildSeleccionFromMenuItem>
  >();
  const serviciosNoCoincidentes: string[] = [];
  let selectedMenuId = '';

  for (const nombreCrudo of data.serviciosContratados || []) {
    const limpio = typeof nombreCrudo === 'string' ? nombreCrudo.trim() : '';
    if (!limpio) continue;
    const clave = normalizarNombreServicio(limpio);
    const servicioMatch = serviciosPorNombre.get(clave);
    if (servicioMatch) {
      serviciosSeleccionados.set(servicioMatch.id, buildSeleccionFromServicio(servicioMatch, adultos, ninos));
      continue;
    }
    const menuMatch = menuItemsPorNombre.get(clave);
    if (menuMatch) {
      serviciosSeleccionados.set(menuMatch.item.id, buildSeleccionFromMenuItem(menuMatch.item, adultos, ninos));
      if (!selectedMenuId) selectedMenuId = menuMatch.menuId;
      continue;
    }
    serviciosNoCoincidentes.push(limpio);
  }

  const formData: PresupuestoFormData = {
    ...INITIAL_PRESUPUESTO_FORM_DATA,
    clienteNombre: (data.clienteNombre || '').trim(),
    clienteContacto: (data.telefono || '').trim(),
    eventoTipo: normalizarTipoEventoDesdeContrato(data.tipoEvento),
    eventoFecha: parsearFechaContrato(data.eventoFecha),
    invitadosAdultos: adultos,
    invitadosNinos: ninos,
    invitadosAdolescentes: 0,
    invitadosCantidad: adultos + ninos,
    selectedMenuId,
    serviciosSeleccionados,
    notas: construirNotasDesdeContrato(data),
    estado,
  };

  return {
    formData,
    tipoAjusteAnual,
    fechaFirmaContrato,
    contratoAdjuntoNombre,
    serviciosNoCoincidentes,
  };
}
