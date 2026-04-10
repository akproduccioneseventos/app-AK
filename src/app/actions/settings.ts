
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { BudgetDisplaySettings, InvoiceTemplateSettings, CompanyInfo, WhatsAppSettings, WhatsAppTemplates } from '@/types/settings';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings, defaultCompanyInfo, defaultWhatsAppSettings, defaultWhatsAppTemplates } from '@/types/settings';

const BUDGET_SETTINGS_FILE = 'budget-display-settings.json';
const INVOICE_SETTINGS_FILE = 'invoice-template-settings.json';
const COMPANY_INFO_FILE = 'company-info.json';
const CONTRACT_TEMPLATE_FILE = 'contract-template.json';
const WHATSAPP_SETTINGS_FILE = 'whatsapp-settings.json';
const WHATSAPP_TEMPLATES_FILE = 'whatsapp-templates.json';

const defaultContractTemplate = `CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS 

En la ciudad de Salto, a los {{FECHA_HOY}}, comparecen por una parte {{EMPRESA_NOMBRE}}, RUT: {{EMPRESA_RUT}}, representado en este acto por el Sr. Alexander Knuth, C.I. 46173508, con domicilio en {{EMPRESA_DIRECCION}}, correo electrónico {{EMPRESA_EMAIL}}, en adelante el “PRESTADOR DEL SERVICIO”. Por otra parte, el/la Sr./Sra. {{CLIENTE_NOMBRE}}, con domicilio en {{CLIENTE_DIRECCION}}, cédula de identidad N° {{CLIENTE_CI}}, número de contacto {{CLIENTE_TELEFONO}}, en adelante el “CLIENTE”. Ambas partes acuerdan celebrar el presente contrato, sujeto a los términos y condiciones que se establecen a continuación:

PRIMERA: OBJETO El presente contrato tiene por objeto la prestación de servicios para la organización y realización de una fiesta o evento en la fecha {{EVENTO_FECHA}}, con una duración aproximada de siete (7) horas desde el inicio del evento como máximo, cobrándose un monto de cinco mil pesos por cada hora extra, conforme a las condiciones establecidas en el presupuesto adjunto, el cual forma parte integral del presente contrato. La prestación de los servicios se llevará a cabo en el salón {{EVENTO_SALON}}, cuyo costo será asumido exclusivamente por el CLIENTE.

SEGUNDA: FORMA DE PAGO: El CLIENTE abonará el precio total de {{PRESUPUESTO_TOTAL}} estipulado en el presupuesto adjunto conforme a las siguientes modalidades: a) Seña inicial: al momento de la firma del contrato, el CLIENTE abonará la suma de {{SENIA}}, la cual se imputará al precio total del servicio contratado. En caso de cancelación, dicha suma se considerará parte integrante de la multa prevista en la cláusula de cancelación y no será reintegrada. b) Pagos parciales: luego de la seña inicial, el CLIENTE podrá realizar pagos parciales en los montos y fechas que disponga, los cuales serán imputados al precio total del servicio. c) Saldo final: el saldo pendiente deberá estar totalmente cancelado con una antelación mínima de treinta (30) días corridos a la fecha del evento. El pago podrá realizarse en efectivo, transferencia bancaria a la cuenta designada por el PRESTADOR, o cualquier otro medio válido, entregándose siempre el comprobante correspondiente. El incumplimiento en la cancelación total en el plazo establecido facultará al PRESTADOR a rescindir el contrato, pudiendo exigir al CLIENTE el pago de una multa equivalente al treinta por ciento (30%) del presupuesto total.

TERCERA: CAMBIO DE FECHA Si por razones de fuerza mayor o decisión de EL CLIENTE, este debiera solicitar un cambio de fecha, deberá comunicarlo con una antelación mínima de 30 (treinta) días a la fecha establecida para el evento. El cambio quedará sujeto a la disponibilidad del PRESTADOR DEL SERVICIO. Cada cambio de fecha solicitado por EL CLIENTE implicará el pago de una multa equivalente al 10% (diez por ciento) del presupuesto total contratado, la cual deberá abonarse al momento de confirmar la nueva fecha. Si el cambio solicitado corresponde pasa a otro año, además de la multa indicada, se aplicará un ajuste del 15% (quince por ciento) anual correspondiente sobre el presupuesto. De no cumplirse con la antelación establecida o no encontrarse disponibilidad en la agenda de la empresa para la nueva fecha requerida, se aplicarán las condiciones de cancelación establecidas en la Cláusula Cuarta.

CUARTA: CANCELACIÓN En caso de que EL CLIENTE decida cancelar el evento o desistir de uno o más servicios previamente contratados, sea total o parcialmente, deberá abonar al PRESTADOR DEL SERVICIO una multa equivalente al 30% (treinta por ciento). Cuando la cancelación sea total, la multa se calculará sobre el monto total del presupuesto contratado. Cuando la cancelación sea parcial, ya sea por la eliminación o reducción de uno o más servicios, la multa se calculará sobre el valor correspondiente al o los servicios cancelados o reducidos, tomando como base el presupuesto previamente acordado. Esta penalización tiene por finalidad cubrir los costos de reserva, planificación, logística, tiempo de trabajo y cualquier otro gasto o perjuicio generado por la modificación o cancelación del servicio.

QUINTA: AJUSTE ANUAL DE PRECIOS Si el presente contrato se firma con una anticipación igual o superior a un (1) año respecto a la fecha del evento, se aplicará un ajuste del 15% (quince por ciento) anual, el cual se efectuará automáticamente el 1° de enero de cada año, independientemente de la fecha en que se haya suscrito el contrato. En caso de que la fecha del evento sea de más de un año posterior, se aplicará un ajuste adicional del 15% (quince por ciento) sobre el monto ya ajustado del año anterior, de manera acumulativa.

SEXTA: INVITADOS El costo del evento se basará en el número total de invitados contratados, independientemente de su asistencia. El CLIENTE podrá reducir hasta un 10% (diez por ciento) del número de invitados contratados sin costo adicional, notificando con al menos 7 días de anticipación. Asimismo, podrá aumentar hasta un 20% (veinte por ciento) del número de invitados contratados, sujeto a la disponibilidad de AK PRODUCCIONES EVENTOS, notificando con al menos 15 días de anticipación.

SÉPTIMA: PAGO Al momento de la firma del contrato, el CLIENTE abonará la suma de {{SENIA}} como seña, recibiendo el comprobante correspondiente. El saldo del precio se abonará conforme al plan de pagos acordado, y una vez cancelado el total, AK PRODUCCIONES EVENTOS emitirá el comprobante correspondiente.

OCTAVA – DAÑOS Y ROTURAS: Cualquier daño o rotura ocasionada por el Cliente, sus invitados, o terceros contratados por él, a las instalaciones, mobiliario, decoración, equipamiento o cualquier elemento provisto por el Prestador, será responsabilidad exclusiva del Cliente, quien deberá reintegrar el valor total del daño, previa evaluación, teniendo 7 días corridos para hacerlo después de ser notificado por el servicio.

NOVENA – ELEMENTOS PROVISTOS: Todos los elementos utilizados en la decoración, barra de tragos, discoteca, iluminación, mobiliario, utilería y demás servicios contratados son de uso exclusivo para el evento. Queda expresamente prohibido al Cliente o a sus invitados retirarlos, conservarlos o reclamarlos una vez finalizado el evento. Únicamente se entregará al Cliente la comida sobrante del catering, la porción correspondiente de la torta o postres, y la bebida alcohólica y no alcohólica traída por él.

DÉCIMA – EXONERACIÓN DE RESPONSABILIDAD: El Prestador no se responsabiliza por accidentes, daños personales, pérdidas u otros perjuicios causados por invitados, terceros o por situaciones fuera de su control. Cualquier incidente ajeno a la ejecución directa del servicio será responsabilidad exclusiva del Cliente.

DÉCIMO PRIMERA – USO DE IMAGEN: El Cliente autoriza al Prestador a utilizar fotografías y videos del evento con fines promocionales en redes sociales, sitio web y material publicitario. Si el Cliente no autoriza dicho uso, deberá informarlo por escrito antes del evento.

DÉCIMO SEGUNDA – FUERZA MAYOR: El Prestador no será responsable por incumplimientos ocasionados por fuerza mayor, tales como fenómenos naturales, cortes de energía u otras circunstancias fuera de su control. En tales casos, las partes procurarán reprogramar el evento en la primera fecha disponible sin penalización para ninguna de las partes.

DÉCIMO TERCERA: PRESUPUESTO Y MODIFICACIONES POSTERIORES Se adjunta a éste contrato el presupuesto final de los servicios contratados, sus costos individuales y el total a pagar por el cliente, el cual será firmado por ambas partes y las mismas reconocen y aceptan éste presupuesto como el acuerdo final de los servicios y costos. Toda modificación, reducción, agregado o ajuste de los servicios contratados deberá realizarse por escrito y con la firma de ambas partes. No se aceptarán modificaciones informales, ya sea de palabra, por mensajes o cualquier otro medio no formalizado. Cualquier modificación que implique un ajuste económico se documentará en una adenda al presente contrato, donde constarán los cambios y el nuevo valor acordado.

DÉCIMO CUARTA: RESPONSABILIDAD DE IMPUESTOS: El cliente asume la totalidad del pago correspondiente a Agadu el Prestador no asume responsabilidad por el incumplimiento o multa por éste concepto.

DÉCIMO QUINTA: JURISDICCIÓN Para cualquier conflicto derivado del presente contrato, ambas partes acuerdan someterse a la competencia de los Juzgados Letrados de Salto, constituyendo domicilio en los indicados al inicio del documento.

DÉCIMO SEXTA: DISPOSICIONES FINALES Las partes declaran haber leído, comprendido y aceptado todas y cada una de las cláusulas del presente contrato, firmando dos ejemplares de un mismo tenor y a un solo efecto. En señal de conformidad, ambas partes firman el presente contrato.

En la ciudad de Salto, el {{FECHA_HOY}}.

POR AK PRODUCCIONES EVENTOS: __________________________
EL CLIENTE: __________________________
TEC. ALEXANDER KNUTH`;


// --- Company Info ---
export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const data = await readData<Partial<CompanyInfo>>(COMPANY_INFO_FILE, {});
    return { ...defaultCompanyInfo, ...data };
  } catch {
    return { ...defaultCompanyInfo };
  }
}

export async function saveCompanyInfo(
  settings: Partial<CompanyInfo>
): Promise<{ success: boolean; data?: CompanyInfo; error?: string }> {
  try {
    const currentSettings = await getCompanyInfo();
    const settingsToSave = { ...currentSettings, ...settings };
    await writeData(COMPANY_INFO_FILE, settingsToSave);
    return { success: true, data: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la información de la empresa." };
  }
}

// --- Contract Template ---
export async function getContractTemplate(): Promise<string> {
  try {
    return await readData<string>(CONTRACT_TEMPLATE_FILE, defaultContractTemplate);
  } catch {
    return defaultContractTemplate;
  }
}

export async function saveContractTemplate(text: string): Promise<{ success: boolean; error?: string }> {
    try {
        await writeData(CONTRACT_TEMPLATE_FILE, text);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Budget Display Settings ---
export async function getBudgetDisplaySettings(): Promise<BudgetDisplaySettings> {
  try {
    const data = await readData<Partial<BudgetDisplaySettings>>(BUDGET_SETTINGS_FILE, {});
    return { ...defaultBudgetDisplaySettings, ...data };
  } catch {
    return { ...defaultBudgetDisplaySettings };
  }
}

export async function saveBudgetDisplaySettings(
  settings: BudgetDisplaySettings
): Promise<{ success: boolean; settings?: BudgetDisplaySettings; error?: string }> {
  try {
    const settingsToSave: BudgetDisplaySettings = {
        ...defaultBudgetDisplaySettings, 
        ...settings, 
        annualAdjustmentPercentage: Number(settings.annualAdjustmentPercentage) || 0,
        promotionalDiscounts: Array.isArray(settings.promotionalDiscounts) 
          ? settings.promotionalDiscounts.map(d => ({
              ...d,
              value: Number(d.value) || 0,
            })) 
          : [],
    };
    await writeData(BUDGET_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la configuración." };
  }
}

// --- Invoice Template Settings ---
export async function getInvoiceTemplateSettings(): Promise<InvoiceTemplateSettings> {
  try {
    const data = await readData<Partial<InvoiceTemplateSettings>>(INVOICE_SETTINGS_FILE, {});
    return { ...defaultInvoiceTemplateSettings, ...data };
  } catch {
    return { ...defaultInvoiceTemplateSettings };
  }
}

export async function saveInvoiceTemplateSettings(
  settings: Partial<InvoiceTemplateSettings>
): Promise<{ success: boolean; settings?: InvoiceTemplateSettings; error?: string }> {
  try {
    const currentSettings = await getInvoiceTemplateSettings();
    const settingsToSave: InvoiceTemplateSettings = {
      ...currentSettings,
      ...settings,
    };
    await writeData(INVOICE_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la plantilla de factura." };
  }
}

// --- WhatsApp Settings ---
export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  try {
    const data = await readData<Partial<WhatsAppSettings>>(WHATSAPP_SETTINGS_FILE, {});
    return { ...defaultWhatsAppSettings, ...data };
  } catch {
    return { ...defaultWhatsAppSettings };
  }
}

export async function saveWhatsAppSettings(
  settings: Partial<WhatsAppSettings>
): Promise<{ success: boolean; settings?: WhatsAppSettings; error?: string }> {
  try {
    const currentSettings = await getWhatsAppSettings();
    const settingsToSave: WhatsAppSettings = { ...currentSettings, ...settings };
    await writeData(WHATSAPP_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la configuración de WhatsApp." };
  }
}

// --- WhatsApp Templates ---
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplates> {
  try {
    const data = await readData<Partial<WhatsAppTemplates>>(WHATSAPP_TEMPLATES_FILE, {});
    return { ...defaultWhatsAppTemplates, ...data };
  } catch {
    return { ...defaultWhatsAppTemplates };
  }
}

export async function saveWhatsAppTemplates(
  templates: Partial<WhatsAppTemplates>
): Promise<{ success: boolean; templates?: WhatsAppTemplates; error?: string }> {
  try {
    const currentTemplates = await getWhatsAppTemplates();
    const templatesToSave: WhatsAppTemplates = { ...currentTemplates, ...templates };
    await writeData(WHATSAPP_TEMPLATES_FILE, templatesToSave);
    return { success: true, templates: templatesToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar las plantillas de WhatsApp." };
  }
}
