import type { EventCatalog } from '@/types/public-landing';
import { bodasCatalog } from './bodas';
import { xvAnosCatalog } from './xv-anos';
import { cumpleaniosCatalog } from './cumpleanios';
import { eventosCorporativosCatalog } from './eventos-corporativos';
import { fiestasTematicosCatalog } from './fiestas-tematicas';

export const allCatalogs: EventCatalog[] = [
  bodasCatalog,
  xvAnosCatalog,
  cumpleaniosCatalog,
  eventosCorporativosCatalog,
  fiestasTematicosCatalog,
];

export function getCatalogBySlug(slug: string): EventCatalog | undefined {
  return allCatalogs.find((c) => c.slug === slug);
}

export { bodasCatalog, xvAnosCatalog, cumpleaniosCatalog, eventosCorporativosCatalog, fiestasTematicosCatalog };
