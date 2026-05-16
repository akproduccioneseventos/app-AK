import { assignGuestsFlow } from '@/ai/flows/assign-guests-flow';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { generateSocialPost } from '@/ai/flows/generate-social-post-flow';
import { generateTestimonialFlow } from '@/ai/flows/generate-testimonial-flow';
import { suggestPalette } from '@/ai/flows/suggest-palette-flow';
import { analyzeEventPlan } from '@/ai/flows/analyze-event-plan-flow';

describe('quality closure fallbacks', () => {
  it('assigns guests without exceeding table capacity', async () => {
    const result = await assignGuestsFlow({
      fiestaId: 'fiesta_1',
      invitados: [
        { id: 'g1', nombre: 'Ana' },
        { id: 'g2', nombre: 'Luis' },
        { id: 'g3', nombre: 'Mia' },
      ],
      mesas: [{ id: 'm1', numero: 'Mesa 1', capacidad: 2 }],
    });

    expect(result.asignaciones).toHaveLength(2);
    expect(result.sinMesa).toHaveLength(1);
  });

  it('generates useful deterministic marketing content', async () => {
    const post = await generateSocialPost({
      eventType: 'quince',
      eventName: 'XV Valentina',
      goal: 'mostrar zona digital y muro social',
      audience: 'adolescentes',
      tone: 'moderno',
    });

    expect(post.caption).toContain('XV Valentina');
    expect(post.hashtags).toContain('#AKProducciones');
  });

  it('suggests a usable palette with a client base color', async () => {
    const palette = await suggestPalette({ eventType: 'quince', baseColor: '#00AEEF' });

    expect(palette.colors[0].hex).toBe('#00AEEF');
    expect(palette.colors.length).toBeGreaterThanOrEqual(4);
  });

  it('creates a testimonial instead of throwing', async () => {
    const testimonial = await generateTestimonialFlow({
      clientName: 'Sofia',
      eventType: 'cumpleanos',
      eventDate: '2026-05-16',
      rating: 5,
    });

    expect(testimonial.testimonial).toContain('Sofia');
    expect(testimonial.shortQuote).toContain('AK');
  });

  it('extracts basic receipt data from readable text', async () => {
    const text = 'Proveedor AK\nFecha 16/05/2026\nTotal $ 1234,50';
    const result = await extractReceiptData({
      receiptDataUri: `data:text/plain;base64,${Buffer.from(text).toString('base64')}`,
    });

    expect(result.vendor).toBe('Proveedor AK');
    expect(result.date).toBe('2026-05-16');
    expect(result.amount).toBe(1234.5);
  });

  it('analyzes event plan gaps without requiring external AI', async () => {
    const result = await analyzeEventPlan({
      planData: {
        configuracion: { nombreEvento: 'Demo', fechaEvento: '2026-05-16', invitadosEstimados: 80 },
        invitados: [],
        tareas: [{ completed: true }, { completed: false }],
        personalAsignado: [],
      },
    });

    expect(result.summary).toContain('area');
    expect(result.items.some((item) => item.module === 'Invitados')).toBe(true);
  });
});
