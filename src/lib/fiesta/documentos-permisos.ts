export interface DocMetadata {
  fileName?: string;
  nombre?: string;
  titulo?: string;
  tipo?: string;
}

const TIPOS_DOCUMENTO_CLIENTE = new Set([
  'contrato_fiesta',
  'contrato-servicio',
  'contrato_servicio',
  'contrato-salon',
  'contrato_salon',
  'presupuesto_firmado',
  'contrato_cambio_fecha',
  'cambio-fecha',
  'cambio_fecha',
  'sena_pago',
  'recibo_pago',
  'cancelacion',
  'cancelacion-parcial',
  'cancelacion_parcial',
  'adenda',
  'adenda_cambio_fecha',
]);

function normalizarTextoDoc(valor?: string | null): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function esReciboPersonal(doc?: DocMetadata | null, filename?: string): boolean {
  const tipo = normalizarTextoDoc(doc?.tipo);
  if (tipo === 'recibo_personal' || tipo === 'recibo-personal') {
    return true;
  }
  const texto = normalizarTextoDoc([doc?.tipo, doc?.nombre, doc?.titulo, doc?.fileName, filename].filter(Boolean).join(' '));
  return /\brecibo[\s_-]*(de[\s_-]*)?(pago[\s_-]*(de[\s_-]*)?)?personal\b|\bsueldo\b|\bliquidacion\b|\bnomina\b/.test(texto);
}

export function esDocumentoDePlata(doc?: DocMetadata | null, filename?: string): boolean {
  if (esReciboPersonal(doc, filename)) return true;
  const tipo = normalizarTextoDoc(doc?.tipo);
  if (
    tipo &&
    /^(contrato|recibo|sena|factura|adenda|cancelacion|presupuesto|pago|cambio[-_]?fecha)/.test(tipo)
  ) {
    return true;
  }
  const texto = normalizarTextoDoc([doc?.tipo, doc?.nombre, doc?.titulo, doc?.fileName, filename].filter(Boolean).join(' '));
  return /\b(contrato|recibo|sena|factura|adenda|cancelacion|presupuesto|pago|comprobante|agadu|sueldo|liquidacion|cambio[\s_-]*fecha)\b/.test(texto);
}

export function esDocumentoDelCliente(doc?: DocMetadata | null, filename?: string): boolean {
  if (!doc || esReciboPersonal(doc, filename)) return false;
  const tipo = normalizarTextoDoc(doc.tipo);
  const texto = normalizarTextoDoc([doc.tipo, doc.nombre, doc.titulo, doc.fileName, filename].filter(Boolean).join(' '));
  if (/\b(personal|empleado|empleados|sueldo|sueldos|liquidacion|nomina|agadu|recibo[\s_-]*salon|interno|interna)\b/.test(texto)) {
    return false;
  }
  if (tipo) {
    return TIPOS_DOCUMENTO_CLIENTE.has(tipo);
  }
  return /\b(contrato|presupuesto|adenda|cancelacion|cambio[\s_-]*fecha|sena|recibo[\s_-]*(de[\s_-]*)?pago)\b/.test(texto);
}
