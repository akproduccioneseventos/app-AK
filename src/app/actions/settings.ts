
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { BudgetDisplaySettings, InvoiceTemplateSettings, CompanyInfo } from '@/types/settings';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings, defaultCompanyInfo } from '@/types/settings';

const BUDGET_SETTINGS_FILE = 'budget-display-settings.json';
const INVOICE_SETTINGS_FILE = 'invoice-template-settings.json';
const COMPANY_INFO_FILE = 'company-info.json';


// --- Company Info ---
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const data = await readData<Partial<CompanyInfo>>(COMPANY_INFO_FILE, {});
  return { ...defaultCompanyInfo, ...data };
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

// --- Budget Display Settings ---
export async function getBudgetDisplaySettings(): Promise<BudgetDisplaySettings> {
  const data = await readData<Partial<BudgetDisplaySettings>>(BUDGET_SETTINGS_FILE, {});
  return { ...defaultBudgetDisplaySettings, ...data };
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
  const data = await readData<Partial<InvoiceTemplateSettings>>(INVOICE_SETTINGS_FILE, {});
  return { ...defaultInvoiceTemplateSettings, ...data };
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
