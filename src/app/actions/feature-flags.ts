'use server';

import { readData, writeData } from '@/lib/data-service';
import type {
  GlobalFeatureFlags,
  EventFeatureConfig,
  ServiceTier,
  FeatureModule,
} from '@/types/feature-flags';
import { TIER_DEFINITIONS } from '@/types/feature-flags';

const FLAGS_FILE = 'feature-flags.json';

const DEFAULT_FLAGS: GlobalFeatureFlags = {
  defaultTier: 'Elite',
  tierOverrides: {},
  globalOverrides: {},
  updatedAt: new Date().toISOString(),
};

export async function getFeatureFlags(): Promise<GlobalFeatureFlags> {
  return readData<GlobalFeatureFlags>(FLAGS_FILE, DEFAULT_FLAGS);
}

export async function updateDefaultTier(tier: ServiceTier): Promise<{ success: boolean; error?: string }> {
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
  try {
    const flags = await getFeatureFlags();
    if (enabled === null) {
      delete flags.globalOverrides[module];
    } else {
      flags.globalOverrides[module] = enabled;
    }
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
  try {
    const flags = await getFeatureFlags();
    const existing = flags.tierOverrides[fiestaId] || {
      fiestaId,
      tier: flags.defaultTier,
      overrides: {},
      updatedAt: new Date().toISOString(),
    };
    existing.tier = tier;
    existing.updatedAt = new Date().toISOString();
    flags.tierOverrides[fiestaId] = existing;
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
  try {
    const flags = await getFeatureFlags();
    const existing = flags.tierOverrides[fiestaId] || {
      fiestaId,
      tier: flags.defaultTier,
      overrides: {},
      updatedAt: new Date().toISOString(),
    };
    if (enabled === null) {
      delete existing.overrides[module];
    } else {
      existing.overrides[module] = enabled;
    }
    existing.updatedAt = new Date().toISOString();
    flags.tierOverrides[fiestaId] = existing;
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
  const flags = await getFeatureFlags();

  // Check global override first
  if (flags.globalOverrides[module] !== undefined) {
    return flags.globalOverrides[module] as boolean;
  }

  // Determine tier
  let tier: ServiceTier = flags.defaultTier;
  if (fiestaId && flags.tierOverrides[fiestaId]) {
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
  const flags = await getFeatureFlags();
  const eventConfig = flags.tierOverrides[fiestaId];
  const tier: ServiceTier = eventConfig?.tier ?? flags.defaultTier;
  const tierDef = TIER_DEFINITIONS.find(t => t.tier === tier);
  const baseMods: FeatureModule[] = tierDef ? tierDef.modules : [];

  // Apply event-level overrides
  const result = new Set<FeatureModule>(baseMods);
  if (eventConfig?.overrides) {
    for (const [mod, enabled] of Object.entries(eventConfig.overrides)) {
      if (enabled) {
        result.add(mod as FeatureModule);
      } else {
        result.delete(mod as FeatureModule);
      }
    }
  }

  // Apply global overrides
  for (const [mod, enabled] of Object.entries(flags.globalOverrides)) {
    if (enabled) {
      result.add(mod as FeatureModule);
    } else {
      result.delete(mod as FeatureModule);
    }
  }

  return Array.from(result);
}
