
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { BudgetDisplaySettings, InvoiceTemplateSettings, CompanyInfo, WhatsAppSettings, WhatsAppTemplates, ContractSettings, ContractTemplateItem, ContractType } from '@/types/settings';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings, defaultCompanyInfo, defaultWhatsAppSettings, defaultWhatsAppTemplates, defaultContractSettings } from '@/types/settings';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { verifySession } from '@/lib/auth/session-token';

const BUDGET_SETTINGS_FILE = 'budget-display-settings.json';
const INVOICE_SETTINGS_FILE = 'invoice-template-settings.json';
const COMPANY_INFO_FILE = 'company-info.json';
const CONTRACT_TEMPLATE_FILE = 'contract-template.json';
const CONTRACT_TEMPLATES_FILE = 'contract-templates.json';
const WHATSAPP_SETTINGS_FILE = 'whatsapp-settings.json';
const WHATSAPP_TEMPLATES_FILE = 'whatsapp-templates.json';
const CONTRACT_SETTINGS_FILE = 'contract-settings.json';

const defaultContractTemplate = `CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS

En la ciudad de {{CIUDAD_FECHA}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT 220372680019, Nº de Empresa 0000008898364, representada por el Tec. Alexander Nicolás Knuth Canto, C.I. 4.617.350-8, con domicilio en Gaboto 3390, Salto, Uruguay, en adelante “LA EMPRESA”; y por otra parte {{CLIENTE_NOMBRE}}, C.I. {{CLIENTE_CI}}, domicilio {{CLIENTE_DOMICILIO}}, teléfono {{CLIENTE_TELEFONO}}, en adelante “EL/LA CLIENTE”.
- - - - -
CLÁUSULA 1 - OBJETO DEL CONTRATO:
LA EMPRESA prestará los servicios indicados en el presupuesto firmado para el evento del {{FECHA_EVENTO}}, en {{SALON}}, con una duración máxima de siete (7) horas. Toda hora extra costará $5.000 por hora o fracción. Todo servicio no incluido será adicional.

Ante enfermedad, rotura, desperfecto o imprevisto, LA EMPRESA podrá sustituir personal, equipos o elementos por otros similares. Si un servicio puntual no pudiera prestarse, podrá sustituirse por otro equivalente o acreditarse únicamente su importe, sin afectar el resto del contrato.
- - - - -
CLÁUSULA 2 - PRESUPUESTO VIGENTE Y AJUSTE ANUAL:
El presupuesto vigente será el original firmado más cambios, agregados, reducciones y ajustes. Si el evento es en un año posterior al de contratación, se aplicará un ajuste del 15% cada 1.º de enero, acumulativo. Los pagos parciales no congelan el precio. Los servicios agregados se cobrarán al precio vigente al momento de contratarlos.
- - - - -
CLÁUSULA 3 - PLAN DE PAGOS, SEÑA E INCUMPLIMIENTO:
EL/LA CLIENTE abonará una seña de {{MONTO_SENA}}. No podrá permanecer más de tres meses sin pagar y deberá abonar como mínimo $5.000 cada tres meses. El total deberá quedar cancelado 30 días antes del evento. Ante incumplimiento, LA EMPRESA podrá intimar por cinco días; si no se regulariza, podrá resolver el contrato, liberar la fecha y aplicar la cancelación. Aceptar pagos atrasados no modifica los demás vencimientos.
- - - - -
CLÁUSULA 4 - CAMBIO DE FECHA Y CANCELACIÓN:
El cambio de fecha deberá solicitarse por escrito con 30 días de anticipación, sujeto a disponibilidad, y tendrá un costo del 10% del presupuesto vigente. La cancelación total o parcial tendrá una multa del 30% del valor cancelado. La multa compensa reserva de fecha, planificación, trabajo administrativo, pérdida de otras contrataciones y compromisos asumidos. La seña y los pagos se imputarán a la multa. También podrán descontarse gastos directos, comprobables y no recuperables, sin duplicar conceptos.
- - - - -
CLÁUSULA 5 - INVITADOS Y MENÚES:
La lista final deberá entregarse siete días antes. Podrá reducirse hasta 10% de los invitados, ajustando solo servicios por persona, y aumentarse hasta 30%, sujeto a disponibilidad y pago previo. No habrá devolución por inasistencias. Alergias, intolerancias o menúes especiales deberán informarse por escrito 15 días antes.
- - - - -
CLÁUSULA 6 - CONTRATO PERSONAL Y PAGOS:
El contrato es personal e intransferible. La persona firmante será la única responsable, aunque terceros colaboren, organicen o paguen. Los recibos se emitirán a nombre de EL/LA CLIENTE.
- - - - -
CLÁUSULA 7 - MENORES, DAÑOS Y RESPONSABILIDAD:
LA EMPRESA no tendrá funciones de cuidado de menores. EL/LA CLIENTE responderá por daños causados por él/ella, invitados, menores o proveedores externos. Los daños podrán probarse con fotos, videos, inventarios, presupuestos o facturas y deberán abonarse dentro de 15 días. LA EMPRESA no responderá por hurtos, conflictos, fallas del salón, cortes, clima u otros hechos no imputables y fuera de su control razonable.
- - - - -
CLÁUSULA 8 - SEGURIDAD Y SUSPENSIÓN:
EL/LA CLIENTE deberá colaborar con el personal de seguridad y respetar las normas del salón. Ante violencia, amenazas, agresiones, armas, daños o riesgo para personas o equipos, LA EMPRESA podrá suspender el servicio, retirar al personal o solicitar intervención de la autoridad. Si la situación fue causada por EL/LA CLIENTE, invitados o proveedores, no corresponderá devolución.
- - - - -
CLÁUSULA 9 - ELEMENTOS PROVISTOS:
Los elementos de decoración, discoteca, barra, comida, iluminación, mobiliario, vajilla, mantelería y estructuras pertenecen a LA EMPRESA o a terceros contratados. No podrán retirarse ni retenerse. Los sobrantes se entregarán solo cuando las condiciones del servicio y conservación lo permitan.
- - - - -
CLÁUSULA 10 - USO DE IMAGEN:
EL/LA CLIENTE autoriza expresamente a AK PRODUCCIONES EVENTOS a utilizar fotografías y videos del evento con fines promocionales en redes sociales, página web y publicidad. Esta autorización no genera derecho a pago. Si no autoriza, deberá comunicarlo por escrito antes del evento.
- - - - -
CLÁUSULA 11 - FUERZA MAYOR:
Ante pandemia, emergencia, prohibición de eventos, cierre del salón, incendio, inundación, clima grave o medida oficial, el contrato no se cancelará automáticamente. Los pagos pasarán a una nueva fecha, sujeta a disponibilidad y ajustes correspondientes. Si EL/LA CLIENTE no desea reprogramar, se aplicarán las condiciones de cancelación y podrán descontarse gastos comprobables y no recuperables.
- - - - -
CLÁUSULA 12 - AGADU Y SALÓN:
AGADU, permisos y trámites serán responsabilidad de EL/LA CLIENTE. Cuando el salón no sea propiedad de LA EMPRESA, también serán responsabilidad de EL/LA CLIENTE sus condiciones de uso, horarios, energía, agua, acceso y seguridad, salvo pacto escrito distinto.
- - - - -
CLÁUSULA 13 - MODIFICACIONES Y WHATSAPP:
El presupuesto firmado forma parte del contrato. WhatsApp y otros medios electrónicos podrán usarse para coordinación y constancia de conversaciones, pero no modificarán por sí solos la fecha, precio, servicios, multas ni condiciones. Todo cambio importante, cancelación, cambio de fecha o modificación económica deberá documentarse mediante adenda, nuevo presupuesto o escrito aceptado expresamente por ambas partes.
- - - - -
CLÁUSULA 14 - NOTIFICACIONES:
Las intimaciones, cancelaciones por incumplimiento y comunicaciones con efectos legales deberán realizarse por telegrama colacionado, carta documento, acta notarial u otro medio fehaciente.
- - - - -
CLÁUSULA 15 - PROVEEDORES EXTERNOS:
Los proveedores contratados por EL/LA CLIENTE actuarán bajo su responsabilidad y deberán respetar horarios, seguridad, normas del salón y coordinación de LA EMPRESA. LA EMPRESA no responderá por daños, retrasos o incumplimientos de dichos proveedores.
- - - - -
CLÁUSULA 16 - JURISDICCIÓN:
Para cualquier conflicto serán competentes los tribunales que correspondan conforme a la normativa vigente. Las partes procurarán previamente una solución directa y documentada.
- - - - -
CLÁUSULA 17 - ACEPTACIÓN FINAL:
Leído el contrato, las partes declaran comprenderlo y aceptarlo. Se firman dos ejemplares junto con el presupuesto correspondiente.


____________________________________
POR AK PRODUCCIONES EVENTOS
Tec. Alexander Nicolás Knuth Canto
C.I. 4.617.350-8

____________________________________
EL/LA CLIENTE
Nombre: {{CLIENTE_NOMBRE}}
C.I.: {{CLIENTE_CI}}`;

const DEFAULT_CONTRACT_TEMPLATE_DATE = '2026-01-01T00:00:00.000Z';

const DEFAULT_CONTRACT_TEMPLATES: ContractTemplateItem[] = [
  {
    id: 'default-servicios',
    type: 'servicios',
    name: 'Contrato de Servicios',
    template: defaultContractTemplate,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-cancelacion',
    type: 'cancelacion',
    name: 'Constancia de Cancelación',
    template: `CONSTANCIA DE CANCELACIÓN DE CONTRATO

En la ciudad de Salto, a los {{FECHA_HOY}}, comparecen {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}}, dejando constancia de la cancelación del contrato correspondiente al evento del {{EVENTO_FECHA}} en {{EVENTO_SALON}}.

MOTIVO DE CANCELACIÓN: {{MOTIVO_CANCELACION}}.

Presupuesto total pactado: {{PRESUPUESTO_TOTAL}}.
Penalización aplicable: {{PENALIZACION_PORCENTAJE}} del total.
Monto de seña/anticipo registrado: {{SENIA}}.

Las partes acuerdan que, con la firma de la presente constancia, quedan documentadas las condiciones económicas y legales de la cancelación, sin perjuicio de los derechos y obligaciones ya devengados.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-cancelacion-servicios',
    type: 'cancelacion-servicios',
    name: 'Cancelación de uno o más servicios',
    template: `ADENDA DE CANCELACIÓN PARCIAL DE SERVICIOS

En la ciudad de Salto, a los {{FECHA_HOY}}, {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}} acuerdan la cancelación parcial de uno o más servicios vinculados al evento del {{EVENTO_FECHA}}.

Detalle de la modificación/cancelación: {{MOTIVO_CANCELACION}}.
Penalización aplicable sobre servicios afectados: {{PENALIZACION_PORCENTAJE}}.

El resto del contrato principal permanece vigente en todos sus términos, salvo las modificaciones expresamente establecidas en esta adenda.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-cambio-fecha',
    type: 'cambio-fecha',
    name: 'Cambio de Fecha',
    template: `CONSTANCIA DE CAMBIO DE FECHA

En la ciudad de Salto, a los {{FECHA_HOY}}, {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}} acuerdan modificar la fecha del evento originalmente prevista para {{EVENTO_FECHA}}.

Nueva fecha acordada: {{NUEVA_FECHA}}.
Motivo del cambio: {{MOTIVO_CANCELACION}}.
Penalización por cambio (si corresponde): {{PENALIZACION_PORCENTAJE}}.

Se deja constancia de que el contrato principal continúa vigente en todas las cláusulas no modificadas por la presente.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
  {
    id: 'default-salon',
    type: 'salon',
    name: 'Contrato de Salón',
    template: `CONTRATO DE SALÓN

En la ciudad de Salto, a los {{FECHA_HOY}}, comparecen {{EMPRESA_NOMBRE}} y {{CLIENTE_NOMBRE}} para acordar el arrendamiento y uso del salón {{NOMBRE_SALON}} con fecha {{EVENTO_FECHA}}.

Condiciones económicas:
- Monto total: {{PRESUPUESTO_TOTAL}}
- Seña: {{SENIA}}

Si corresponde cancelación o cambio, se aplicará una penalización de {{PENALIZACION_PORCENTAJE}} sobre los montos definidos contractualmente.

Las partes firman en conformidad.

Firma empresa: __________________________
Firma cliente: __________________________`,
    isDefault: true,
    createdAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
    updatedAt: DEFAULT_CONTRACT_TEMPLATE_DATE,
  },
];


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
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const currentSettings = await getCompanyInfo();
    const settingsToSave = { ...currentSettings, ...settings };
    await writeData(COMPANY_INFO_FILE, settingsToSave);
    return { success: true, data: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la información de la empresa." };
  }
}

// --- Contract Template ---
function mergeContractTemplates(saved: ContractTemplateItem[], fallbackServiciosTemplate: string): ContractTemplateItem[] {
  const defaultsById = new Map(DEFAULT_CONTRACT_TEMPLATES.map(t => [t.id, t]));
  const defaultTypeToId = new Map(DEFAULT_CONTRACT_TEMPLATES.map(t => [t.type, t.id]));
  const defaultMerged = DEFAULT_CONTRACT_TEMPLATES.map((d) => {
    const byId = saved.find(s => s.id === d.id);
    const byType = saved.find(s => s.type === d.type && s.isDefault !== false);
    const stored = byId || byType;
    if (!stored) {
      if (d.type === 'servicios') return { ...d, template: fallbackServiciosTemplate };
      return d;
    }
    return {
      ...d,
      ...stored,
      id: d.id,
      type: d.type,
      isDefault: true,
      name: stored.name || d.name,
      template: stored.template || d.template,
      createdAt: stored.createdAt || d.createdAt,
      updatedAt: stored.updatedAt || d.updatedAt,
    };
  });

  const customTemplates = saved.filter((item) => {
    if (item.isDefault) return false;
    if (defaultsById.has(item.id)) return false;
    const maybeDefaultId = defaultTypeToId.get(item.type);
    return !maybeDefaultId;
  });

  return [...defaultMerged, ...customTemplates];
}

export async function getContractTemplates(): Promise<ContractTemplateItem[]> {
  try {
    const [savedTemplates, legacyServiciosTemplate] = await Promise.all([
      readData<ContractTemplateItem[]>(CONTRACT_TEMPLATES_FILE, []),
      readData<string>(CONTRACT_TEMPLATE_FILE, defaultContractTemplate),
    ]);
    return mergeContractTemplates(savedTemplates, legacyServiciosTemplate || defaultContractTemplate);
  } catch {
    return [...DEFAULT_CONTRACT_TEMPLATES];
  }
}

export async function getContractTemplate(): Promise<string> {
  try {
    const templates = await getContractTemplates();
    const servicios = templates.find(t => t.type === 'servicios') || DEFAULT_CONTRACT_TEMPLATES[0];
    return servicios.template;
  } catch {
    return defaultContractTemplate;
  }
}

export async function saveContractTemplate(input: string | ContractTemplateItem): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const now = new Date().toISOString();
    const templates = await getContractTemplates();

    if (typeof input === 'string') {
      const servicios = templates.find(t => t.type === 'servicios') || DEFAULT_CONTRACT_TEMPLATES[0];
      const updatedServicios: ContractTemplateItem = { ...servicios, template: input, updatedAt: now, isDefault: true };
      const nextTemplates = templates.map(t => (t.id === updatedServicios.id ? updatedServicios : t));
      await Promise.all([
        writeData(CONTRACT_TEMPLATES_FILE, nextTemplates),
        writeData(CONTRACT_TEMPLATE_FILE, input),
      ]);
      return { success: true };
    }

    const isDefaultType = DEFAULT_CONTRACT_TEMPLATES.some(t => t.type === input.type);
    const normalizedItem: ContractTemplateItem = {
      ...input,
      id: input.id || `contract-template-${Date.now()}`,
      name: input.name?.trim() || 'Plantilla personalizada',
      template: input.template || '',
      isDefault: isDefaultType ? true : !!input.isDefault,
      createdAt: input.createdAt || now,
      updatedAt: now,
    };

    const nextTemplates = templates.filter(t => {
      if (normalizedItem.isDefault && t.type === normalizedItem.type) return false;
      return t.id !== normalizedItem.id;
    });
    nextTemplates.push(normalizedItem);
    await writeData(CONTRACT_TEMPLATES_FILE, nextTemplates);

    if (normalizedItem.type === 'servicios') {
      await writeData(CONTRACT_TEMPLATE_FILE, normalizedItem.template);
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteContractTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const templates = await getContractTemplates();
    const target = templates.find(t => t.id === id);
    if (!target) return { success: false, error: 'Plantilla no encontrada.' };
    if (target.isDefault) return { success: false, error: 'No se pueden eliminar plantillas por defecto.' };
    const nextTemplates = templates.filter(t => t.id !== id);
    await writeData(CONTRACT_TEMPLATES_FILE, nextTemplates);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getContractTemplateByType(type: ContractType): Promise<ContractTemplateItem> {
  const templates = await getContractTemplates();
  const found = templates.find(t => t.type === type);
  if (found) return found;
  return DEFAULT_CONTRACT_TEMPLATES[0];
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
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
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
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
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
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const currentSettings = await getWhatsAppSettings();
    const settingsToSave: WhatsAppSettings = { ...currentSettings, ...settings };
    await writeData(WHATSAPP_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la configuración de WhatsApp." };
  }
}

// --- Contract Settings ---
export async function getContractSettings(): Promise<ContractSettings> {
  try {
    const data = await readData<Partial<ContractSettings>>(CONTRACT_SETTINGS_FILE, {});
    return { ...defaultContractSettings, ...data, clauses: data.clauses?.length ? data.clauses : defaultContractSettings.clauses };
  } catch {
    return { ...defaultContractSettings };
  }
}

export async function saveContractSettings(settings: ContractSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    await writeData(CONTRACT_SETTINGS_FILE, settings);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
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
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };

    const validWhatsAppMarkers = new Set([
      '{{NOMBRE}}',
      '{{CLIENTE_NOMBRE}}',
      '{{FECHA_EVENTO}}',
      '{{EVENTO_FECHA}}',
      '{{SALON}}',
      '{{EVENTO_SALON}}',
      '{{LINK}}',
      '{{URL_DOCUMENTO}}',
      '{{SENIA}}',
      '{{MONTO_SENA}}',
      '{{PRESUPUESTO_TOTAL}}',
      '{{TOTAL}}',
      '{{SALDO}}',
    ]);

    const unknownMarkers: string[] = [];
    for (const [, value] of Object.entries(templates)) {
      if (typeof value === 'string') {
        const matches = value.match(/\{\{[^}]+\}\}/g) ?? [];
        for (const m of matches) {
          if (!validWhatsAppMarkers.has(m)) {
            unknownMarkers.push(m);
          }
        }
      }
    }

    if (unknownMarkers.length > 0) {
      const unique = Array.from(new Set(unknownMarkers));
      return {
        success: false,
        error: `La plantilla contiene marcadores no válidos o desconocidos: ${unique.join(', ')}.`,
      };
    }

    const currentTemplates = await getWhatsAppTemplates();
    const templatesToSave: WhatsAppTemplates = { ...currentTemplates, ...templates };
    await writeData(WHATSAPP_TEMPLATES_FILE, templatesToSave);
    return { success: true, templates: templatesToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar las plantillas de WhatsApp." };
  }
}

// ── AI Assistant Settings ──────────────────────────────────────────────────

const AI_ASSISTANT_SETTINGS_FILE = 'ai-assistant-settings.json';
const AI_ASSISTANT_DOCUMENT_MAX_CHARS = 12000; // Protects storage/prompt size for assistant context.
const AI_ASSISTANT_TEXT_MAX_CHARS = 20000;
const AI_ASSISTANT_APP_SCAN_MAX_ROUTES = 200;

export interface AiAssistantSettings {
  customInstructions: string;
  operationalInstructions: string;
  salesMarketingInstructions: string;
  dynamicBusinessRules: string;
  lessonsLearned: string;
  appFunctionalityContext: string;
  knowledgeDocuments: Array<{
    id: string;
    name: string;
    type: string;
    content: string;
    updatedAt: string;
  }>;
  updatedAt: string;
}

const defaultAiAssistantSettings: AiAssistantSettings = {
  customInstructions: '',
  operationalInstructions: '',
  salesMarketingInstructions: '',
  dynamicBusinessRules: '',
  lessonsLearned: '',
  appFunctionalityContext: '',
  knowledgeDocuments: [],
  updatedAt: '',
};

export async function getAiAssistantSettings(): Promise<AiAssistantSettings> {
  const data = await readData<Partial<AiAssistantSettings>>(AI_ASSISTANT_SETTINGS_FILE, {});
  return { ...defaultAiAssistantSettings, ...data };
}

export async function saveAiAssistantSettings(
  settings: Pick<
    AiAssistantSettings,
    | 'customInstructions'
    | 'operationalInstructions'
    | 'salesMarketingInstructions'
    | 'dynamicBusinessRules'
    | 'lessonsLearned'
    | 'appFunctionalityContext'
    | 'knowledgeDocuments'
  >
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await verifySession();
    if (!auth.success) return { success: false, error: auth.error };
    const sanitizedKnowledgeDocuments = Array.isArray(settings.knowledgeDocuments)
      ? settings.knowledgeDocuments
          .map(doc => ({
            id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: doc.name || 'Documento',
            type: doc.type || 'text/plain',
            content: (doc.content || '').slice(0, AI_ASSISTANT_DOCUMENT_MAX_CHARS),
            updatedAt: doc.updatedAt || new Date().toISOString(),
          }))
      : [];

    const toSave: AiAssistantSettings = {
      customInstructions: (settings.customInstructions || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      operationalInstructions: (settings.operationalInstructions || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      salesMarketingInstructions: (settings.salesMarketingInstructions || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      dynamicBusinessRules: (settings.dynamicBusinessRules || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      lessonsLearned: (settings.lessonsLearned || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      appFunctionalityContext: (settings.appFunctionalityContext || '').slice(0, AI_ASSISTANT_TEXT_MAX_CHARS),
      knowledgeDocuments: sanitizedKnowledgeDocuments,
      updatedAt: new Date().toISOString(),
    };
    await writeData(AI_ASSISTANT_SETTINGS_FILE, toSave);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Convierte una ruta absoluta de un archivo `page.tsx` dentro de `src/app`
 * en su URL de App Router.
 * Remueve route groups `(group)` para exponer la ruta pública real.
 */
function buildRouteFromPagePath(absolutePagePath: string, appDir: string): string {
  const rel = path.relative(appDir, absolutePagePath).replace(/\\/g, '/');
  const withoutPage = rel.replace(/\/page\.tsx$/, '');
  const segments = withoutPage
    .split('/')
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment)); // ignore route groups

  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

/**
 * Recorre recursivamente `src/app` para encontrar archivos `page.tsx`
 * y agrega cada ruta URL normalizada al array recibido.
 */
async function collectPageRoutes(dir: string, appDir: string, routes: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectPageRoutes(fullPath, appDir, routes);
      continue;
    }

    if (entry.isFile() && entry.name === 'page.tsx') {
      const route = buildRouteFromPagePath(fullPath, appDir);
      routes.push(route);
    }
  }
}

export async function scanAiAssistantAppContext(): Promise<{ success: boolean; context?: string; error?: string }> {
  try {
    const appDir = path.join(process.cwd(), 'src', 'app');
    const routes: string[] = [];
    await collectPageRoutes(appDir, appDir, routes);

    const uniqueRoutes = Array.from(new Set(routes)).sort();
    const listedRoutes = uniqueRoutes.slice(0, AI_ASSISTANT_APP_SCAN_MAX_ROUTES);

    const context = [
      'Escaneo automático de rutas funcionales de la app (src/app):',
      ...listedRoutes.map((route) => `- ${route}`),
      uniqueRoutes.length > listedRoutes.length
        ? `- ... y ${uniqueRoutes.length - listedRoutes.length} rutas adicionales (omitidas por límite)`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    return { success: true, context };
  } catch (error: any) {
    return { success: false, error: error?.message || 'No se pudo escanear la app.' };
  }
}

const GEMINI_CONNECTION_TIMEOUT_MS = 15000;
const GEMINI_CONNECTION_MODELS = [
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
] as const;

export async function testGeminiConnection(): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: 'La API key de Gemini no está configurada en el servidor. Verificá que el secreto "google-api-key" esté creado en Firebase y que el backend tenga acceso a él.',
    };
  }
  try {
    let lastModelError = '';
    for (const model of GEMINI_CONNECTION_MODELS) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respondé solo la palabra: ok' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
          signal: AbortSignal.timeout(GEMINI_CONNECTION_TIMEOUT_MS),
        }
      );
      if (resp.ok) return { ok: true };

      const errData = await resp.json().catch(() => ({}));
      const msg = (errData as any)?.error?.message || `HTTP ${resp.status}`;
      lastModelError = `${model}: ${msg}`;
      if (![404, 429, 500, 502, 503, 504].includes(resp.status)) {
        return { ok: false, error: `Gemini respondió con error: ${msg}` };
      }
    }
    return { ok: false, error: `Gemini no respondió con ningún modelo compatible. ${lastModelError}` };
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) };
  }
}
