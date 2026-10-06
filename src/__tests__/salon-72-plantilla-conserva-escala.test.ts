/** @jest-environment node */
/**
 * MATAFUEGO — Auditoría 72 de Codex (orden 123, SALON72-1). 6/10/2026.
 *
 * Guardar una plantilla del salón perdía la escala: al cargarla, una mesa de 160 px dibujada a
 * 80 px/m (2 m) se leía con la escala de fábrica, 40, y pasaba a medir 4 m.
 *
 * Se probó rompiéndolo: sacando `pixelsPerMeter` de lo que se guarda, se pone en rojo.
 */
let guardado: any[] = [];
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => JSON.parse(JSON.stringify(guardado))),
  writeData: jest.fn(async (_f: string, d: any) => { guardado = JSON.parse(JSON.stringify(d)); }),
}));

import { saveSalonLayoutTemplate, getSalonLayoutTemplates } from '@/app/actions/salon-layout-templates';

const plano = (escala?: number) => ({
  salonWidth: 18,
  salonHeight: 12,
  salonPlanBackgroundImageUrl: 'fondo.png',
  ...(escala ? { pixelsPerMeter: escala } : {}),
  salonElements: [
    { id: 'm1', type: 'mesa-redonda', x: 100, y: 100, width: 160, height: 160, rotation: 30 },
    { id: 'p1', type: 'pista', x: 400, y: 200, width: 320, height: 240, rotation: 0 },
    { id: 'z1', type: 'zona', x: 50, y: 500, width: 200, height: 80, rotation: 0 },
    { id: 'b1', type: 'barra', x: 700, y: 50, width: 240, height: 60, rotation: 90 },
  ],
});

beforeEach(() => { guardado = []; });

describe('La plantilla del salón vuelve con su escala', () => {
  it.each([80, 40])('a %i px/m: la mesa sigue midiendo lo mismo en metros', async (escala) => {
    await saveSalonLayoutTemplate('Club', plano(escala) as any);
    const [t] = await getSalonLayoutTemplates();
    expect(t.layoutData.pixelsPerMeter).toBe(escala);
    const mesa = t.layoutData.salonElements!.find((e: any) => e.id === 'm1')!;
    expect(mesa.width / t.layoutData.pixelsPerMeter!).toBe(160 / escala);
    expect(t.layoutData.salonElements).toHaveLength(4);
    expect(t.layoutData.salonPlanBackgroundImageUrl).toBe('fondo.png');
    expect((t.layoutData.salonElements as any[]).find((e) => e.id === 'b1').rotation).toBe(90);
  });

  it('un plano sin escala (como las plantillas viejas) no inventa una', async () => {
    await saveSalonLayoutTemplate('Viejo', plano() as any);
    const [t] = await getSalonLayoutTemplates();
    expect('pixelsPerMeter' in t.layoutData).toBe(false);
  });
});
