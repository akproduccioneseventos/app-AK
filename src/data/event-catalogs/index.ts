// Central registry — maps URL slugs to catalog data.
// Add new event types here to register them in the public catalog.

import type { EventCatalogData } from '@/types/public-landing';
import bodasData from './bodas';
import xvAnosData from './xv-anos';
import fiestasData from './fiestas';
import cumpleanosData from './cumpleanos';
import corporativosData from './corporativos';
import aniversariosData from './aniversarios';

export const eventCatalogs: Record<string, EventCatalogData> = {
  bodas: bodasData,
  'xv-anos': xvAnosData,
  fiestas: fiestasData,
  cumpleanos: cumpleanosData,
  corporativos: corporativosData,
  aniversarios: aniversariosData,
};

export function getCatalogBySlug(slug: string): EventCatalogData | null {
  return eventCatalogs[slug] ?? null;
}

export const catalogList = Object.values(eventCatalogs);
