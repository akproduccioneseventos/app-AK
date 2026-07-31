import { buildConciergeContext, answerConciergeQuestion } from '../lib/concierge/concierge-engine';
import { FiestaEnPlanificacion } from '@/types/fiesta';

const mockFiesta: FiestaEnPlanificacion = {
  id: '1',
  configuracion: {
    nombre: 'Mi Fiesta',
    nombreLugar: 'Salón Principal',
    fecha: '2026-10-10'
  },
  invitados: [
    { id: '1', nombre: 'Juan', contacto: '', rsvp: 'confirmado' },
    { id: '2', nombre: 'Maria', contacto: '', rsvp: 'pendiente' }
  ]
} as any;

describe('Concierge Engine', () => {
  it('buildConciergeContext returns a non-empty string', () => {
    const context = buildConciergeContext(mockFiesta);
    expect(context.length).toBeGreaterThan(0);
    expect(context).toContain('Mi Fiesta');
  });

  it('answerConciergeQuestion answers "cuantos invitados confirmaron"', () => {
    const result = answerConciergeQuestion(mockFiesta, 'cuantos invitados confirmaron');
    expect(result.answer).toContain('1 invitados confirmados');
    expect(result.dataPoints?.length).toBe(4);
  });

  it('answerConciergeQuestion answers "donde es la fiesta"', () => {
    const result = answerConciergeQuestion(mockFiesta, 'dónde es la fiesta');
    expect(result.answer).toContain('Salón Principal');
  });
});
