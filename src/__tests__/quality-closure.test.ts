jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(false),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { generateSocialPost } from '@/ai/flows/generate-social-post-flow';
import { generateTestimonialFlow } from '@/ai/flows/generate-testimonial-flow';
import { suggestPalette } from '@/ai/flows/suggest-palette-flow';
import { analyzeEventPlan } from '@/ai/flows/analyze-event-plan-flow';

describe('quality closure fallbacks', () => {
  it('generates useful deterministic marketing content', async () => {
    const post = await generateSocialPost({
      eventName: 'Fiesta de Fin de Año',
      eventType: 'Corporativo',
      goal: 'Agradecer a los clientes y celebrar el cierre de año.',
      tone: 'Cálido y profesional',
      hashtags: ['FiestaEmpresarial', 'AKProducciones'],
    });

    expect(post.caption).toContain('Fiesta de Fin de Año');
    expect(post.shortCaption).toContain('Fiesta de Fin de Año');
    expect(post.hashtags).toEqual(expect.arrayContaining(['#FiestaEmpresarial', '#AKProducciones']));
  });

  it('generates a fallback testimonial from client highlights', async () => {
    const testimonial = await generateTestimonialFlow({
      clientName: 'Carla y Martín',
      eventType: 'Boda',
      eventDate: '2026-11-20',
      highlights: ['pista llena toda la noche', 'la comida estuvo increíble'],
    });

    expect(testimonial.testimonial).toContain('Carla y Martín');
    expect(testimonial.testimonial).toContain('Boda');
    expect(testimonial.testimonial).toContain('pista llena toda la noche, la comida estuvo increíble');
    expect(testimonial.shortQuote).toContain('Boda');
  });

  it('suggests a deterministic palette when AI is unavailable', async () => {
    const palette = await suggestPalette({ eventType: 'quince', baseColor: '#00AEEF' });

    expect(palette.paletteName).toBe('Quince glam moderno');
    expect(palette.colors).toHaveLength(4);
    expect(palette.colors[0].hex).toBe('#00AEEF');
  });

  it('analyzes an event plan deterministically and finds blockers', async () => {
    const result = await analyzeEventPlan({
      planData: {
        configuracion: { nombreEvento: 'Boda de Sofia' },
        invitados: [],
        tareas: [],
        personalAsignado: [],
      },
    });

    expect(result.summary).toContain('area(s) que conviene completar');
    expect(result.items.some((item) => item.module === 'Invitados' && item.status === 'Faltante')).toBe(true);
    expect(result.items.some((item) => item.module === 'Tareas' && item.status === 'Faltante')).toBe(true);
  });
});

