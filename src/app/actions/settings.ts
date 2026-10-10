
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { BudgetDisplaySettings, InvoiceTemplateSettings, CompanyInfo, WhatsAppSettings, WhatsAppTemplates, ContractSettings, ContractTemplateItem, ContractType, AjustesLlegadaPersonal } from '@/types/settings';
import type { CuentaBancaria } from '@/types/fiesta';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings, defaultCompanyInfo, defaultWhatsAppSettings, defaultWhatsAppTemplates, defaultContractSettings, defaultAjustesLlegadaPersonal } from '@/types/settings';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { findInvalidWhatsAppTemplateMarkers } from '@/lib/whatsapp-template-markers';

import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { AsyncMutex } from '@/lib/mutex';
const BUDGET_SETTINGS_FILE = 'budget-display-settings.json';
const INVOICE_SETTINGS_FILE = 'invoice-template-settings.json';
const COMPANY_INFO_FILE = 'company-info.json';
const CONTRACT_TEMPLATE_FILE = 'contract-template.json';
const CONTRACT_TEMPLATES_FILE = 'contract-templates.json';
const CONTRACT_SETTINGS_FILE = 'contract-settings.json';
const WHATSAPP_SETTINGS_FILE = 'whatsapp-settings.json';
const WHATSAPP_TEMPLATES_FILE = 'whatsapp-templates.json';
import { CONTRACT_TEMPLATE } from '@/lib/contract-template';

const defaultContractTemplate = CONTRACT_TEMPLATE;

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
  // Guarda las cuentas bancarias de la empresa. La version que usan las pantallas
  // abiertas es `getCompanyInfoPublica`, que no las trae.
  await requireAppSession();
  return leerCompanyInfo();
}

/** Sin comprobar sesion: uso interno de este archivo y de la version publica. */
async function leerCompanyInfo(): Promise<CompanyInfo> {
  try {
    const data = await readData<Partial<CompanyInfo>>(COMPANY_INFO_FILE, {});
    return { ...defaultCompanyInfo, ...data };
  } catch {
    return { ...defaultCompanyInfo };
  }
}

/**
 * Los datos de la empresa para las pantallas que se abren sin cuenta: nombre,
 * logo, contacto, textos. **Sin las cuentas bancarias**, que son las de cobro de
 * AK y no las necesita ninguna pantalla publica.
 */
export async function getCompanyInfoPublica(): Promise<CompanyInfo> {
  const info = await leerCompanyInfo();
  return { ...info, cuentasBancariasPortal: [] };
}

async function saveCompanyInfoInterno(
  settings: Partial<CompanyInfo>
): Promise<{ success: boolean; data?: CompanyInfo; error?: string }> {
  try {
    await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
    const currentSettings = await leerCompanyInfo();
    const settingsToSave = { ...currentSettings, ...settings };

    // El nombre y el RUT salen impresos en los contratos y las facturas. Se
    // podian borrar y guardar vacios: el documento del cliente salia con el
    // renglon en blanco y nadie se enteraba hasta tenerlo sobre la mesa.
    if (!settingsToSave.companyName?.trim()) {
      return { success: false, error: 'El nombre de la empresa es obligatorio: sale en los contratos y las facturas.' };
    }
    if (!settingsToSave.companyTaxId?.trim()) {
      return { success: false, error: 'El RUT es obligatorio: sale en los contratos y las facturas.' };
    }

    // Una cuenta bancaria a medias es peor que ninguna: el cliente no sabe
    // adonde transferir y llama para preguntar.
    const cuentaIncompleta = (settingsToSave.cuentasBancariasPortal ?? []).find(
      (c: CuentaBancaria) => !c.banco?.trim() || !c.titular?.trim() || !c.numero?.trim(),
    );
    if (cuentaIncompleta) {
      return {
        success: false,
        error: 'Hay una cuenta bancaria sin completar. Poné banco, titular y número, o borrala.',
      };
    }

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
    const isOldDefaultServicios = stored && d.type === 'servicios' && (
      stored.template.includes('$5.000 cada') ||
      stored.template.includes('un total de $5.000 (pesos uruguayos cinco mil)') ||
      stored.template.includes('aumentar hasta un 30%') ||
      stored.template.includes('aumentarse hasta 30%')
    );
    const resolvedTemplate = isOldDefaultServicios ? defaultContractTemplate : (stored?.template || d.template);

    return {
      ...d,
      ...stored,
      id: d.id,
      type: d.type,
      isDefault: true,
      name: stored.name || d.name,
      template: resolvedTemplate,
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
  await requireAppSession();
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
  await requireAppSession();
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
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);

    const templateText = typeof input === 'string' ? input : input.template || '';
    const { marcadoresDesconocidos } = await import('@/lib/contratos/marcadores');
    const desconocidos = marcadoresDesconocidos(templateText);
    if (desconocidos.length > 0) {
      return {
        success: false,
        error: `La plantilla contiene marcadores no válidos o desconocidos: ${desconocidos.join(', ')}.`,
      };
    }

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
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
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
  await requireAppSession();
  const templates = await getContractTemplates();
  const found = templates.find(t => t.type === type);
  if (found) return found;
  return DEFAULT_CONTRACT_TEMPLATES[0];
}

// --- Budget Display Settings ---
export async function getBudgetDisplaySettings(): Promise<BudgetDisplaySettings> {
  // PUBLICA A PROPOSITO: la leen el portal del cliente, el simulador y la
  // presentacion de venta, que se abren SIN cuenta. Son ajustes de como se muestra
  // un presupuesto (que columnas, que textos), no datos del negocio.
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
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
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
  // PUBLICA A PROPOSITO: de aca sale el LOGO, y lo muestran la pantalla de ingreso
  // (antes de que exista sesion), el muro en vivo y la presentacion de venta.
  try {
    const data = await readData<Partial<InvoiceTemplateSettings>>(INVOICE_SETTINGS_FILE, {});
    return { ...defaultInvoiceTemplateSettings, ...data };
  } catch {
    return { ...defaultInvoiceTemplateSettings };
  }
}

async function saveInvoiceTemplateSettingsInterno(
  settings: Partial<InvoiceTemplateSettings>
): Promise<{ success: boolean; settings?: InvoiceTemplateSettings; error?: string }> {
  try {
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
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
  // PUBLICA A PROPOSITO: la usa el motor de automatizacion de WhatsApp, que corre
  // desde el despertador externo y no tiene sesion de nadie.
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
    await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
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
  await requireAppSession();
  try {
    const data = await readData<Partial<ContractSettings>>(CONTRACT_SETTINGS_FILE, {});
    let clauses = defaultContractSettings.clauses;
    if (data.clauses && data.clauses.length > 0) {
      const coincideConViejoPorOmision = data.clauses.some((c) =>
        c.content.includes('$5.000 cada') ||
        c.content.includes('un total de $5.000 (pesos uruguayos cinco mil)') ||
        c.content.includes('aumentar hasta un 30%')
      );
      if (!coincideConViejoPorOmision) {
        clauses = data.clauses;
      }
    }
    return { ...defaultContractSettings, ...data, clauses };
  } catch {
    return { ...defaultContractSettings };
  }
}

export async function saveContractSettings(settings: ContractSettings): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
    await writeData(CONTRACT_SETTINGS_FILE, settings);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- WhatsApp Templates ---
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplates> {
  // PUBLICA A PROPOSITO: mismo motivo que los ajustes de WhatsApp.
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
    await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
    const currentTemplates = await getWhatsAppTemplates();
    const templatesToSave: WhatsAppTemplates = { ...currentTemplates, ...templates };

    const markerErrors = findInvalidWhatsAppTemplateMarkers(templatesToSave);
    if (markerErrors.length > 0) {
      const details = markerErrors.map(({ field, markers }) => `${field}: ${markers.join(', ')}`).join('; ');
      return {
        success: false,
        error: `Las plantillas contienen marcadores no validos: ${details}.`,
      };
    }

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
  await requireAppSession();
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
    await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
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
  await requireAppSession();
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
  await requireAppSession();
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

/**
 * UN TURNO PARA LOS AJUSTES DE LA EMPRESA.
 *
 * Los dos guardados leen la ficha entera, le cambian un campo y la escriben entera. Si dos
 * personas tocan Ajustes al mismo tiempo, el segundo pisa al primero y el dato que se perdio
 * despues sale mal en los contratos y en las facturas.
 */
const turnoDeAjustes = new AsyncMutex();

export async function saveCompanyInfo(...datos: Parameters<typeof saveCompanyInfoInterno>): ReturnType<typeof saveCompanyInfoInterno> {
  return turnoDeAjustes.runExclusive(() => saveCompanyInfoInterno(...datos));
}

export async function saveInvoiceTemplateSettings(...datos: Parameters<typeof saveInvoiceTemplateSettingsInterno>): ReturnType<typeof saveInvoiceTemplateSettingsInterno> {
  return turnoDeAjustes.runExclusive(() => saveInvoiceTemplateSettingsInterno(...datos));
}

const AJUSTES_LLEGADA_FILE = 'ajustes-llegada.json';

export async function getAjustesLlegadaPersonal(): Promise<AjustesLlegadaPersonal> {
  const data = await readData<AjustesLlegadaPersonal>(AJUSTES_LLEGADA_FILE, defaultAjustesLlegadaPersonal);
  return {
    ...defaultAjustesLlegadaPersonal,
    ...data,
  };
}

export async function saveAjustesLlegadaPersonal(
  settings: Partial<AjustesLlegadaPersonal>
): Promise<AjustesLlegadaPersonal> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
  const current = await getAjustesLlegadaPersonal();
  const updated: AjustesLlegadaPersonal = {
    ...current,
    ...settings,
  };
  await writeData(AJUSTES_LLEGADA_FILE, updated);
  return updated;
}
