'use server';

import { readData, writeData } from '@/lib/data-service';
import type {
  GlobalFeatureFlags,
  EventFeatureConfig,
  ServiceTier,
  FeatureModule,
} from '@/types/feature-flags';
import { TIER_DEFINITIONS, ALL_MODULES } from '@/types/feature-flags';

const FLAGS_FILE = 'feature-flags.json';

const DEFAULT_FLAGS: GlobalFeatureFlags = {
  defaultTier: 'Elite',
  tierOverrides: {},
  globalOverrides: {},
  updatedAt: new Date().toISOString(),
};

/** Allowlist of valid module IDs to prevent prototype pollution. */
const VALID_MODULES = new Set<string>(ALL_MODULES.map(m => m.id));

/** Allowlist of valid tier values. */
const VALID_TIERS = new Set<ServiceTier>(['Básico', 'Premium', 'Elite']);

/** Guard: reject keys that could pollute Object.prototype. */
function isSafeKey(key: string): boolean {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}

export async function getFeatureFlags(): Promise<GlobalFeatureFlags> {
  return readData<GlobalFeatureFlags>(FLAGS_FILE, DEFAULT_FLAGS);
}

export async function updateDefaultTier(tier: ServiceTier): Promise<{ success: boolean; error?: string }> {
  if (!VALID_TIERS.has(tier)) {
    return { success: false, error: 'Tier inválido.' };
  }
  try {
    const flags = await getFeatureFlags();
    flags.defaultTier = tier;
    flags.updatedAt = new Date().toISOString();
    await writeData(FLAGS_FILE, flags);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateGlobalOverride(
  module: FeatureModule,
  enabled: boolean | null
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_MODULES.has(module)) {
    return { success: false, error: 'Módulo inválido.' };
  }
  try {
    const flags = await getFeatureFlags();
    const nextOverrides = Object.assign(Object.create(null) as Record<string, boolean>, flags.globalOverrides);
    if (enabled === null) {
      delete nextOverrides[module];
    } else {
      nextOverrides[module] = enabled;
    }
    flags.globalOverrides = nextOverrides as Partial<Record<FeatureModule, boolean>>;
    flags.updatedAt = new Date().toISOString();
    await writeData(FLAGS_FILE, flags);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setEventTier(
  fiestaId: string,
  tier: ServiceTier
): Promise<{ success: boolean; error?: string }> {
  if (!isSafeKey(fiestaId)) {
    return { success: false, error: 'ID de evento inválido.' };
  }
  if (!VALID_TIERS.has(tier)) {
    return { success: false, error: 'Tier inválido.' };
  }
  try {
    const flags = await getFeatureFlags();
    const existing: EventFeatureConfig = flags.tierOverrides[fiestaId] ?? {
      fiestaId,
      tier: flags.defaultTier,
      overrides: {},
      updatedAt: new Date().toISOString(),
    };
    const updated: EventFeatureConfig = {
      ...existing,
      tier,
      updatedAt: new Date().toISOString(),
    };
    flags.tierOverrides = Object.assign(Object.create(null) as Record<string, EventFeatureConfig>, flags.tierOverrides, {
      [fiestaId]: updated,
    });
    flags.updatedAt = new Date().toISOString();
    await writeData(FLAGS_FILE, flags);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setEventModuleOverride(
  fiestaId: string,
  module: FeatureModule,
  enabled: boolean | null
): Promise<{ success: boolean; error?: string }> {
  if (!isSafeKey(fiestaId)) {
    return { success: false, error: 'ID de evento inválido.' };
  }
  if (!VALID_MODULES.has(module)) {
    return { success: false, error: 'Módulo inválido.' };
  }
  try {
    const flags = await getFeatureFlags();
    const existing: EventFeatureConfig = flags.tierOverrides[fiestaId] ?? {
      fiestaId,
      tier: flags.defaultTier,
      overrides: {},
      updatedAt: new Date().toISOString(),
    };
    const nextOverrides = Object.assign(
      Object.create(null) as Record<string, boolean>,
      existing.overrides
    );
    if (enabled === null) {
      delete nextOverrides[module];
    } else {
      nextOverrides[module] = enabled;
    }
    const updated: EventFeatureConfig = {
      ...existing,
      overrides: nextOverrides as Partial<Record<FeatureModule, boolean>>,
      updatedAt: new Date().toISOString(),
    };
    flags.tierOverrides = Object.assign(Object.create(null) as Record<string, EventFeatureConfig>, flags.tierOverrides, {
      [fiestaId]: updated,
    });
    flags.updatedAt = new Date().toISOString();
    await writeData(FLAGS_FILE, flags);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if a specific module is enabled for a given event (or globally).
 */
export async function isModuleEnabled(
  module: FeatureModule,
  fiestaId?: string
): Promise<boolean> {
  if (!VALID_MODULES.has(module)) return false;
  const flags = await getFeatureFlags();

  // Check global override first
  if (flags.globalOverrides[module] !== undefined) {
    return flags.globalOverrides[module] as boolean;
  }

  // Determine tier
  let tier: ServiceTier = flags.defaultTier;
  if (fiestaId && isSafeKey(fiestaId) && flags.tierOverrides[fiestaId]) {
    const eventConfig = flags.tierOverrides[fiestaId];
    // Check event-specific module override
    if (eventConfig.overrides[module] !== undefined) {
      return eventConfig.overrides[module] as boolean;
    }
    tier = eventConfig.tier;
  }

  // Check if module is available for the tier
  const tierDef = TIER_DEFINITIONS.find(t => t.tier === tier);
  return tierDef ? tierDef.modules.includes(module) : false;
}

export async function getEnabledModulesForEvent(fiestaId: string): Promise<FeatureModule[]> {
  if (!isSafeKey(fiestaId)) return [];
  const flags = await getFeatureFlags();
  const eventConfig = flags.tierOverrides[fiestaId];
  const tier: ServiceTier = eventConfig?.tier ?? flags.defaultTier;
  const tierDef = TIER_DEFINITIONS.find(t => t.tier === tier);
  const baseMods: FeatureModule[] = tierDef ? tierDef.modules : [];

  // Apply event-level overrides
  const result = new Set<FeatureModule>(baseMods);
  if (eventConfig?.overrides) {
    for (const [mod, enabled] of Object.entries(eventConfig.overrides)) {
      if (!VALID_MODULES.has(mod)) continue;
      if (enabled) {
        result.add(mod as FeatureModule);
      } else {
        result.delete(mod as FeatureModule);
      }
    }
  }

  // Apply global overrides
  for (const [mod, enabled] of Object.entries(flags.globalOverrides)) {
    if (!VALID_MODULES.has(mod)) continue;
    if (enabled) {
      result.add(mod as FeatureModule);
    } else {
      result.delete(mod as FeatureModule);
    }
  }

  return Array.from(result);
}

