
'use server';

import type { LandingPageSettings, PromoLandingPage } from '@/types/landing';
import { defaultLandingPageSettings } from '@/types/landing';
import { readData, writeData } from '@/lib/data-service';

const LANDING_SETTINGS_FILE = 'landing-settings.json';
const PROMO_PAGES_FILE = 'promo-pages.json';

// ─── Landing Page Settings ───────────────────────────────────────────────────

export async function getLandingPageSettings(): Promise<LandingPageSettings> {
  return readData<LandingPageSettings>(LANDING_SETTINGS_FILE, defaultLandingPageSettings);
}

export async function saveLandingPageSettings(
  settings: LandingPageSettings
): Promise<{ success: boolean; error?: string }> {
  await writeData(LANDING_SETTINGS_FILE, settings);
  return { success: true };
}

// ─── Promotional Landing Pages ───────────────────────────────────────────────

export async function getPromoPages(): Promise<PromoLandingPage[]> {
  return readData<PromoLandingPage[]>(PROMO_PAGES_FILE, []);
}

export async function getPromoPageBySlug(slug: string): Promise<PromoLandingPage | null> {
  const pages = await getPromoPages();
  return pages.find((p) => p.slug === slug && p.isActive) ?? null;
}

export async function savePromoPage(
  page: Omit<PromoLandingPage, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<{ success: boolean; page?: PromoLandingPage; error?: string }> {
  const pages = await getPromoPages();
  const now = new Date().toISOString();
  const savedPage: PromoLandingPage = {
    ...page,
    id: page.id || crypto.randomUUID(),
    createdAt: page.createdAt || now,
  };
  const index = pages.findIndex((p) => p.id === savedPage.id);
  if (index > -1) {
    pages[index] = savedPage;
  } else {
    pages.push(savedPage);
  }
  await writeData(PROMO_PAGES_FILE, pages);
  return { success: true, page: savedPage };
}

export async function deletePromoPage(
  id: string
): Promise<{ success: boolean; error?: string }> {
  let pages = await getPromoPages();
  pages = pages.filter((p) => p.id !== id);
  await writeData(PROMO_PAGES_FILE, pages);
  return { success: true };
}
