
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { BudgetDisplaySettings, InvoiceTemplateSettings } from '@/types/settings';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings } from '@/types/settings';

const SETTINGS_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const BUDGET_DISPLAY_SETTINGS_FILE_PATH = path.join(SETTINGS_DATA_DIR, 'budget-display-settings.json');
const INVOICE_TEMPLATE_SETTINGS_FILE_PATH = path.join(SETTINGS_DATA_DIR, 'invoice-template-settings.json');

async function ensureDataFileExists(filePath: string, defaultContent: string) {
    try {
        await fs.access(SETTINGS_DATA_DIR);
    } catch {
        await fs.mkdir(SETTINGS_DATA_DIR, { recursive: true });
    }
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, defaultContent, 'utf-8');
    }
}


// --- Budget Display Settings ---
async function readBudgetDisplaySettingsFile(): Promise<BudgetDisplaySettings> {
  await ensureDataFileExists(BUDGET_DISPLAY_SETTINGS_FILE_PATH, JSON.stringify(defaultBudgetDisplaySettings));
  try {
    const fileContent = await fs.readFile(BUDGET_DISPLAY_SETTINGS_FILE_PATH, 'utf-8');
    const parsedContent = JSON.parse(fileContent.trim() === '' ? '{}' : fileContent) as Partial<BudgetDisplaySettings>;
    return { ...defaultBudgetDisplaySettings, ...parsedContent };
  } catch (error) {
    console.error('Error reading budget display settings, returning defaults.', error);
    await writeBudgetDisplaySettingsFile(defaultBudgetDisplaySettings); // Attempt to fix
    return defaultBudgetDisplaySettings;
  }
}

async function writeBudgetDisplaySettingsFile(data: BudgetDisplaySettings): Promise<void> {
  await ensureDataFileExists(BUDGET_DISPLAY_SETTINGS_FILE_PATH, JSON.stringify(defaultBudgetDisplaySettings));
  await fs.writeFile(BUDGET_DISPLAY_SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getBudgetDisplaySettings(): Promise<BudgetDisplaySettings> {
  return readBudgetDisplaySettingsFile();
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
    await writeBudgetDisplaySettingsFile(settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    console.error('Error in saveBudgetDisplaySettings:', error);
    return { success: false, error: error.message || "Error desconocido al guardar la configuración." };
  }
}

// --- Invoice Template Settings ---
async function readInvoiceTemplateSettingsFile(): Promise<InvoiceTemplateSettings> {
  await ensureDataFileExists(INVOICE_TEMPLATE_SETTINGS_FILE_PATH, JSON.stringify(defaultInvoiceTemplateSettings));
  try {
    const fileContent = await fs.readFile(INVOICE_TEMPLATE_SETTINGS_FILE_PATH, 'utf-8');
    const parsedContent = JSON.parse(fileContent.trim() === '' ? '{}' : fileContent) as Partial<InvoiceTemplateSettings>;
    return { ...defaultInvoiceTemplateSettings, ...parsedContent };
  } catch (error) {
    console.error('Error reading invoice template settings, returning defaults.', error);
    await writeInvoiceTemplateSettingsFile(defaultInvoiceTemplateSettings); // Attempt to fix
    return defaultInvoiceTemplateSettings;
  }
}

async function writeInvoiceTemplateSettingsFile(data: InvoiceTemplateSettings): Promise<void> {
  await ensureDataFileExists(INVOICE_TEMPLATE_SETTINGS_FILE_PATH, JSON.stringify(defaultInvoiceTemplateSettings));
  await fs.writeFile(INVOICE_TEMPLATE_SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getInvoiceTemplateSettings(): Promise<InvoiceTemplateSettings> {
  return readInvoiceTemplateSettingsFile();
}

export async function saveInvoiceTemplateSettings(
  settings: InvoiceTemplateSettings
): Promise<{ success: boolean; settings?: InvoiceTemplateSettings; error?: string }> {
  try {
    const currentSettings = await readInvoiceTemplateSettingsFile();
    const settingsToSave: InvoiceTemplateSettings = {
      ...currentSettings,
      ...settings,
      logoUrl: settings.logoUrl !== undefined ? settings.logoUrl : currentSettings.logoUrl,
    };
    await writeInvoiceTemplateSettingsFile(settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    console.error('Error in saveInvoiceTemplateSettings:', error);
    return { success: false, error: error.message || "Error desconocido al guardar la plantilla de factura." };
  }
}
