
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { BudgetDisplaySettings } from '@/types/settings';
import { defaultBudgetDisplaySettings } from '@/types/settings';

const SETTINGS_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const BUDGET_DISPLAY_SETTINGS_FILE_PATH = path.join(SETTINGS_DATA_DIR, 'budget-display-settings.json');

async function ensureDataDirectoryExists() {
  try {
    await fs.access(SETTINGS_DATA_DIR);
  } catch {
    await fs.mkdir(SETTINGS_DATA_DIR, { recursive: true });
  }
}

async function readBudgetDisplaySettingsFile(): Promise<BudgetDisplaySettings> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(BUDGET_DISPLAY_SETTINGS_FILE_PATH);
    const fileContent = await fs.readFile(BUDGET_DISPLAY_SETTINGS_FILE_PATH, 'utf-8');
    if (fileContent.trim() === '') return defaultBudgetDisplaySettings;
    const parsedContent = JSON.parse(fileContent) as Partial<BudgetDisplaySettings>;
    // Merge with defaults to ensure all keys are present
    return { ...defaultBudgetDisplaySettings, ...parsedContent };
  } catch (error) {
    // If file doesn't exist or error reading, write and return defaults
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

// Initialize file if it doesn't exist
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
    // Validate settings if necessary (e.g., ensure all boolean fields are present)
    const settingsToSave: BudgetDisplaySettings = {
        showClientData: typeof settings.showClientData === 'boolean' ? settings.showClientData : defaultBudgetDisplaySettings.showClientData,
        showEventTypeAndDate: typeof settings.showEventTypeAndDate === 'boolean' ? settings.showEventTypeAndDate : defaultBudgetDisplaySettings.showEventTypeAndDate,
        showPaymentMethodNotes: typeof settings.showPaymentMethodNotes === 'boolean' ? settings.showPaymentMethodNotes : defaultBudgetDisplaySettings.showPaymentMethodNotes,
        showPriceBreakdown: typeof settings.showPriceBreakdown === 'boolean' ? settings.showPriceBreakdown : defaultBudgetDisplaySettings.showPriceBreakdown,
        showCompanyLogo: typeof settings.showCompanyLogo === 'boolean' ? settings.showCompanyLogo : defaultBudgetDisplaySettings.showCompanyLogo,
    };
    await writeBudgetDisplaySettingsFile(settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    console.error('Error in saveBudgetDisplaySettings:', error);
    return { success: false, error: error.message || "Error desconocido al guardar la configuración." };
  }
}
