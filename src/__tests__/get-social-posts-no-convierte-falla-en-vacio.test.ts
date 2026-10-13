/** Orden 154 (3): una lectura caída de publicaciones lanza; el vacío verdadero sigue siendo []. */
let falla = true;
let valor: unknown[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, d: unknown) => d),
  readDataConDetalle: jest.fn(async () => ({ valor, huboFalla: falla })),
  writeData: jest.fn(),
}));
jest.mock('@/lib/generic-json-store', () => ({ mutarDocumento: jest.fn() }));
const mockPermiso = jest.fn();
jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: (...a: unknown[]) => mockPermiso(...a) }));
jest.mock('@/lib/auth/perfiles', () => ({ PERMISOS: { CRM: 'crm' } }));
jest.mock('@/lib/marketing/internal-token', () => ({ MARKETING_AUTOMATION_INTERNAL_TOKEN: 't' }));
jest.mock('@/lib/instagram/public-feed', () => ({ getPublicInstagramFeed: jest.fn(), idOriginalDeInstagram: jest.fn() }));
jest.mock('@/components/landing/gallery-media-utils', () => ({ classifyGalleryCategories: jest.fn() }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ hayPresupuestoParaIA: jest.fn(), registrarConsumoIA: jest.fn() }));
jest.mock('@/ai/flows/marketing-agent-flow', () => ({ chatWithMarketingAgent: jest.fn() }));
jest.mock('@/lib/presencia-digital/publicador', () => ({ publishPostInternal: jest.fn() }));

import { getSocialPosts } from '@/app/actions/social-media';

beforeEach(() => { mockPermiso.mockResolvedValue({ ok: true }); });

test('lectura caída: lanza, no devuelve []', async () => {
  falla = true; valor = [];
  await expect(getSocialPosts()).rejects.toThrow(/No se pudieron leer/);
});
test('vacío verdadero: devuelve []', async () => {
  falla = false; valor = [];
  await expect(getSocialPosts()).resolves.toEqual([]);
});
test('sin permiso: sigue devolviendo [] (la autorización no cambia)', async () => {
  falla = true;
  mockPermiso.mockResolvedValue({ ok: false });
  await expect(getSocialPosts()).resolves.toEqual([]);
});
