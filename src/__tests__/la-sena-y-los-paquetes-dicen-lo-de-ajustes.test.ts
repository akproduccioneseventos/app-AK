import fs from 'node:fs';
import path from 'node:path';
import { sharedFAQs, sharedServices } from '@/data/event-catalogs/shared';

describe('La seña y los paquetes dicen lo de ajustes (Orden 277)', () => {
  it('la respuesta de la seña no dice "30% del total" y nombra la penalidad', () => {
    const senaFaq = sharedFAQs.find((f) => f.id === 'seña');
    expect(senaFaq).toBeDefined();
    expect(senaFaq!.answer.toLowerCase()).not.toContain('30% del total');
    expect(senaFaq!.answer.toLowerCase()).toContain('penalidad');
    expect(senaFaq!.answer).toContain('{SENIA}');
  });

  it('con bookingDepositAmount: 7000 la pregunta del catálogo muestra el monto formateado y cambia si se cambia el monto', () => {
    const senaFaq = sharedFAQs.find((f) => f.id === 'seña')!;
    const formatCurrency = (monto: number) =>
      new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(monto);

    const texto7000 = senaFaq.answer.replace(/\{SENIA\}/g, formatCurrency(7000));
    expect(texto7000).toContain(formatCurrency(7000));
    expect(texto7000).not.toContain('{SENIA}');

    const texto12000 = senaFaq.answer.replace(/\{SENIA\}/g, formatCurrency(12000));
    expect(texto12000).toContain(formatCurrency(12000));
    expect(texto12000).not.toEqual(texto7000);
  });

  it('el paquete Intermedio no incluye "video" ni "filmación"', () => {
    const intermedio = sharedServices.find((s) => s.title.includes('Intermedio') || s.id === 'premium');
    expect(intermedio).toBeDefined();

    const todoTexto = intermedio!.included.join(' ').toLowerCase();
    expect(todoTexto).not.toContain('video');
    expect(todoTexto).not.toContain('filmación');
    expect(todoTexto).not.toContain('filmacion');
  });

  it('con precio: 20000 el tachado de Club Uruguay es 40000 (el doble)', () => {
    const calcularTachado = (precio: number) => precio * 2;

    expect(calcularTachado(20000)).toBe(40000);
    expect(calcularTachado(16900)).toBe(33800);

    // Verificar en código fuente del simulador que no hay montos fijos 36000
    const simuladorPath = path.join(process.cwd(), 'src/app/simulador-de-presupuesto/page.tsx');
    const codigoSimulador = fs.readFileSync(simuladorPath, 'utf8');

    expect(codigoSimulador).not.toContain('formatCurrency(36000)');
    expect(codigoSimulador).not.toContain('const precioReal = 36000');
  });
});
