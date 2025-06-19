
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { BudgetDisplaySettings, InvoiceTemplateSettings } from '@/types/settings';
import { defaultBudgetDisplaySettings, defaultInvoiceTemplateSettings } from '@/types/settings';

const SETTINGS_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const BUDGET_DISPLAY_SETTINGS_FILE_PATH = path.join(SETTINGS_DATA_DIR, 'budget-display-settings.json');
const INVOICE_TEMPLATE_SETTINGS_FILE_PATH = path.join(SETTINGS_DATA_DIR, 'invoice-template-settings.json');


async function ensureDataDirectoryExists() {
  try {
    await fs.access(SETTINGS_DATA_DIR);
  } catch {
    await fs.mkdir(SETTINGS_DATA_DIR, { recursive: true });
  }
}

// --- Budget Display Settings ---
async function readBudgetDisplaySettingsFile(): Promise<BudgetDisplaySettings> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(BUDGET_DISPLAY_SETTINGS_FILE_PATH);
    const fileContent = await fs.readFile(BUDGET_DISPLAY_SETTINGS_FILE_PATH, 'utf-8');
    if (fileContent.trim() === '') return defaultBudgetDisplaySettings;
    const parsedContent = JSON.parse(fileContent) as Partial<BudgetDisplaySettings>;
    return { ...defaultBudgetDisplaySettings, ...parsedContent };
  } catch (error) {
    await writeBudgetDisplaySettingsFile(defaultBudgetDisplaySettings);
    return defaultBudgetDisplaySettings;
  }
}

async function writeBudgetDisplaySettingsFile(data: BudgetDisplaySettings): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    await fs.writeFile(BUDGET_DISPLAY_SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing budget display settings JSON file:', error);
  }
}

async function initializeBudgetDisplaySettingsFile() {
  await readBudgetDisplaySettingsFile();
}
initializeBudgetDisplaySettingsFile();


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
  try {
    await ensureDataDirectoryExists();
    await fs.access(INVOICE_TEMPLATE_SETTINGS_FILE_PATH);
    const fileContent = await fs.readFile(INVOICE_TEMPLATE_SETTINGS_FILE_PATH, 'utf-8');
    if (fileContent.trim() === '') return defaultInvoiceTemplateSettings;
    const parsedContent = JSON.parse(fileContent) as Partial<InvoiceTemplateSettings>;
    return { ...defaultInvoiceTemplateSettings, ...parsedContent };
  } catch (error) {
    await writeInvoiceTemplateSettingsFile(defaultInvoiceTemplateSettings);
    return defaultInvoiceTemplateSettings;
  }
}

async function writeInvoiceTemplateSettingsFile(data: InvoiceTemplateSettings): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    await fs.writeFile(INVOICE_TEMPLATE_SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing invoice template settings JSON file:', error);
  }
}

async function initializeInvoiceTemplateSettingsFile() {
  await readInvoiceTemplateSettingsFile();
}
initializeInvoiceTemplateSettingsFile();

export async function getInvoiceTemplateSettings(): Promise<InvoiceTemplateSettings> {
  return readInvoiceTemplateSettingsFile();
}

export async function saveInvoiceTemplateSettings(
  settings: InvoiceTemplateSettings
): Promise<{ success: boolean; settings?: InvoiceTemplateSettings; error?: string }> {
  try {
    // Ensure logoUrl is either a string or null, not undefined
    const settingsToSave: InvoiceTemplateSettings = {
      ...defaultInvoiceTemplateSettings,
      ...settings,
      logoUrl: settings.logoUrl || null, 
    };
    await writeInvoiceTemplateSettingsFile(settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    console.error('Error in saveInvoiceTemplateSettings:', error);
    return { success: false, error: error.message || "Error desconocido al guardar la plantilla de factura." };
  }
}
