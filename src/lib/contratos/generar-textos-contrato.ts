import { isClubUruguay } from '@/lib/club-uruguay';
import { conSinonimos } from '@/lib/contratos/marcadores';
import { calcularHitosDeContrato } from '@/lib/contratos/hitos';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { CompanyInfo } from '@/types/settings';
import { defaultCompanyInfo } from '@/types/settings';

export function esSalonClubUruguay(salon?: string): boolean {
  return isClubUruguay(salon);
}

export function formatFechaContrato(dateString?: string): string {
  if (!dateString) return '____________';
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return 'Fecha inválida';
  }
}

export function formatMonedaContrato(amount?: number): string {
  if (amount === undefined || isNaN(amount)) return '____________';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function hoyContratoTexto(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export interface SalonContractDraftInput {
  clienteNombre: string;
  clienteCi: string;
  clienteDomicilio: string;
  clienteTelefono: string;
  fechaEvento: string;
  salon: string;
  tipoEvento: string;
  invitados: number;
  ciudadFecha: string;
}

export function buildSalonContractDraft(data: SalonContractDraftInput): string {
  return `CONTRATO DE ARRENDAMIENTO DE SALÓN

En la ciudad de ${data.ciudadFecha}, entre Club Uruguay (en adelante "EL SALÓN") y ${data.clienteNombre || '________________________'}, con domicilio en ${data.clienteDomicilio || '________________________'}, cédula de identidad N° ${data.clienteCi || '_______________________'}, número de contacto ${data.clienteTelefono || '_______________________'} (en adelante "EL CLIENTE"), se celebra el presente contrato de arrendamiento de salón para eventos, sujeto a los términos y condiciones siguientes:

PRIMERA: OBJETO
EL SALÓN arrienda a EL CLIENTE el uso del salón ubicado en las instalaciones del Club Uruguay, para la realización de ${data.tipoEvento || '________________________'}, en la fecha ${data.fechaEvento || '____________'}, con una capacidad estimada de ${data.invitados || '____'} invitados.

SEGUNDA: PRECIO Y FORMA DE PAGO
El precio del arrendamiento del salón será el acordado entre las partes y especificado en el presupuesto adjunto. EL CLIENTE abonará una seña al momento de la firma del presente contrato, y el saldo restante deberá abonarse en su totalidad como mínimo treinta (30) días antes de la fecha del evento.

TERCERA: CONDICIONES DE USO
EL CLIENTE se compromete a utilizar el salón exclusivamente para el fin estipulado en la cláusula primera, respetando las normas internas del Club Uruguay, la capacidad máxima habilitada del local y la reglamentación vigente. Queda expresamente prohibido el uso del salón para fines distintos a los acordados sin previa autorización por escrito de EL SALÓN.

CUARTA: HORARIO
El evento comenzará y finalizará en los horarios acordados. Cualquier extensión deberá ser previamente autorizada por EL SALÓN y podrá implicar un costo adicional.

QUINTA: CANCELACIÓN Y CAMBIO DE FECHA
En caso de cancelación por parte de EL CLIENTE, la seña no será reintegrada. Ante solicitud de cambio de fecha, EL CLIENTE deberá notificarlo con al menos 30 días de anticipación, quedando sujeto a disponibilidad del salón y al pago de una multa equivalente al 10% del valor total del arrendamiento.

SEXTA: RESPONSABILIDAD POR DAÑOS
EL CLIENTE será responsable de todo daño o deterioro que se produzca en las instalaciones, mobiliario o equipamiento del salón durante la realización del evento, debiendo reparar o reponer los mismos a su costo.

SÉPTIMA: DISPOSICIONES FINALES
Ambas partes declaran haber leído y aceptado las cláusulas del presente contrato, firmando en señal de conformidad dos (2) ejemplares de idéntico tenor.`;
}

export interface GenerarTextoContratoServiciosParams {
  fiesta: Pick<FiestaEnPlanificacion, 'configuracion' | 'contratoDatos'>;
  cliente?: Customer | null;
  presupuesto?: Presupuesto | null;
  companyInfo?: Partial<CompanyInfo> | null;
  templateText: string;
  seniaMonto?: number | null;
  todayText?: string;
}

export function generarTextoContratoServicios({
  fiesta,
  cliente,
  presupuesto,
  companyInfo,
  templateText,
  seniaMonto,
  todayText,
}: GenerarTextoContratoServiciosParams): string {
  const hoy = todayText || hoyContratoTexto();
  const empresa = { ...defaultCompanyInfo, ...(companyInfo || {}) };
  const seniaValue =
    typeof seniaMonto === 'number' && !isNaN(seniaMonto) && seniaMonto > 0
      ? formatMonedaContrato(seniaMonto)
      : '__________________________';

  const hitos = calcularHitosDeContrato(
    fiesta.configuracion?.fechaEvento,
    fiesta.contratoDatos?.fechaFirmaContrato || presupuesto?.timestamp,
  );

  const replacements: Record<string, string> = {
    '{{FECHA_HOY}}': hoy,
    '{{FECHA_FIRMA_TEXTO}}': `a los ${hoy}`,
    '{{CIUDAD_FECHA}}': `Salto, a los ${hoy}`,
    '{{EMPRESA_NOMBRE}}': empresa.companyName,
    '{{EMPRESA_RUT}}': empresa.companyTaxId,
    '{{EMPRESA_DIRECCION}}': empresa.companyAddress,
    '{{EMPRESA_EMAIL}}': empresa.companyContact,
    '{{CLIENTE_NOMBRE}}':
      cliente?.name ||
      cliente?.companyName ||
      presupuesto?.clienteNombre ||
      fiesta.configuracion?.clienteNombre ||
      '________________________',
    '{{CLIENTE_DIRECCION}}':
      cliente?.address ||
      (cliente as any)?.domicilio ||
      (presupuesto as any)?.clienteDomicilio ||
      '________________________',
    '{{CLIENTE_CI}}':
      cliente?.ci ||
      cliente?.taxId ||
      (presupuesto as any)?.clienteCi ||
      (presupuesto as any)?.ci ||
      '_______________________',
    '{{CLIENTE_TELEFONO}}':
      cliente?.phone ||
      (cliente as any)?.telefono ||
      presupuesto?.clienteContacto ||
      '_______________________',
    '{{EVENTO_FECHA}}': formatFechaContrato(fiesta.configuracion?.fechaEvento),
    '{{EVENTO_SALON}}': fiesta.configuracion?.nombreLugar || '____________',
    '{{PRESUPUESTO_TOTAL}}': formatMonedaContrato(
      presupuesto?.totalConDescuento ?? presupuesto?.costoTotalEstimado,
    ),
    '{{SENIA}}': seniaValue,
    '{{HITO_30}}': hitos.hito30 || 'al primer tercio del plazo',
    '{{HITO_50}}': hitos.hito50 || 'a la mitad del plazo',
    '{{FECHA_SALDO_TOTAL}}': hitos.fechaSaldoTotal || '30 días antes del evento',
    '{{MOTIVO_CANCELACION}}': '________________________',
    '{{NUEVA_FECHA}}': '________________________',
    '{{PENALIZACION_PORCENTAJE}}': '30%',
    '{{NOMBRE_SALON}}': fiesta.configuracion?.nombreLugar || '____________',
  };

  let text = templateText || '';
  Object.entries(conSinonimos(replacements)).forEach(([key, val]) => {
    text = text.replaceAll(key, val);
  });
  return text;
}
