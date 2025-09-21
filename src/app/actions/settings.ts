
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { BudgetDisplaySettings, InvoiceTemplateSettings } from '@/types/settings';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings } from '@/types/settings';

const BUDGET_SETTINGS_FILE = 'budget-display-settings.json';
const INVOICE_SETTINGS_FILE = 'invoice-template-settings.json';

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
        promotionalDiscounts: Array.isArray(settings.promotionalDiscounts) ? settings.promotionalDiscounts : [],
    };
    await writeData(BUDGET_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la configuración." };
  }
}

export async function getInvoiceTemplateSettings(): Promise<InvoiceTemplateSettings> {
  const data = await readData<Partial<InvoiceTemplateSettings>>(INVOICE_SETTINGS_FILE, {});
  return { ...defaultInvoiceTemplateSettings, ...data };
}

export async function saveInvoiceTemplateSettings(
  settings: InvoiceTemplateSettings
): Promise<{ success: boolean; settings?: InvoiceTemplateSettings; error?: string }> {
  try {
    const currentSettings = await getInvoiceTemplateSettings();
    const settingsToSave: InvoiceTemplateSettings = {
      ...currentSettings,
      ...settings,
      logoUrl: settings.logoUrl !== undefined ? settings.logoUrl : currentSettings.logoUrl,
    };
    await writeData(INVOICE_SETTINGS_FILE, settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar la plantilla de factura." };
  }
}
