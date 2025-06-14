
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
    // Merge with defaults to ensure all keys are present, including new ones
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
    // Validate and ensure all fields are present, merging with defaults if necessary
    const settingsToSave: BudgetDisplaySettings = {
        ...defaultBudgetDisplaySettings, // Start with defaults
        ...settings, // Override with provided settings
        // Ensure specific types if necessary, e.g., annualAdjustmentPercentage is a number
        annualAdjustmentPercentage: Number(settings.annualAdjustmentPercentage) || 0,
        // Ensure promotionalDiscounts is an array even if undefined in input
        promotionalDiscounts: Array.isArray(settings.promotionalDiscounts) ? settings.promotionalDiscounts : [],
    };
    await writeBudgetDisplaySettingsFile(settingsToSave);
    return { success: true, settings: settingsToSave };
  } catch (error: any) {
    console.error('Error in saveBudgetDisplaySettings:', error);
    return { success: false, error: error.message || "Error desconocido al guardar la configuración." };
  }
}
