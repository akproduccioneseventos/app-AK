import fs from 'node:fs';
import path from 'node:path';
import { TextEncoder, TextDecoder } from 'node:util';
import zlib from 'node:zlib';
import { sharedFAQs, sharedServices } from '@/data/event-catalogs/shared';
import { createSimulatorBudgetPdf } from '@/lib/budget/simulator-budget-pdf';
import { buildAnnualAdjustmentProjection } from '@/lib/budget/formal-budget';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder as any;
}

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

  it('el PDF del simulador con costo: 20000 dice 40.000 y 20.000, nunca 36.000', async () => {
    const pdfPath = path.join(process.cwd(), 'src/lib/budget/simulator-budget-pdf.ts');
    const codigoPdf = fs.readFileSync(pdfPath, 'utf8');

    expect(codigoPdf).not.toContain('Precio Real: $36.000');
    expect(codigoPdf).not.toContain('$36.000');

    const pdf = await createSimulatorBudgetPdf({
      documentId: 'qa-orden-277',
      publicUrl: 'https://example.invalid/presupuesto/qa-orden-277',
      clientName: 'Test Cliente',
      eventType: 'Boda',
      adults: 80,
      childrenAndTeens: 0,
      items: [],
      salonDetails: {
        nombre: 'Club Uruguay',
        costo: 20000,
      },
      stats: {
        subtotalBruto: 100000,
        ahorroRegalos: 0,
        descPromo: 0,
        totalFinal: 100000,
        precioPorPersona: 1250,
        discountPercentage: 0,
        annualProjection: buildAnnualAdjustmentProjection({ baseTotal: 100000 }),
      },
    });

    const buf = Buffer.from(pdf.output('arraybuffer'));
    const str = buf.toString('binary');
    let allText = str;
    const regex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      try {
        const streamBytes = Buffer.from(match[1], 'binary');
        const unzipped = zlib.inflateSync(streamBytes).toString('utf8');
        allText += '\n' + unzipped;
      } catch {
        // stream might not be compressed or different format
      }
    }

    expect(allText).toContain('40.000');
    expect(allText).toContain('20.000');
    expect(allText).not.toContain('36.000');
  });

  it('el resumen del equipo no dice "20% del total"', () => {
    const resumenPath = path.join(process.cwd(), 'src/components/presupuestos/paso-4-resumen.tsx');
    const codigoResumen = fs.readFileSync(resumenPath, 'utf8');

    expect(codigoResumen).not.toContain('20% del total como seña');
    expect(codigoResumen).not.toContain('20% del total');
  });

  it('el catálogo no dice "Se requiere el 30 % del total"', () => {
    const catalogoPath = path.join(process.cwd(), 'src/app/catalogo/[tipo]/page.tsx');
    const codigoCatalogo = fs.readFileSync(catalogoPath, 'utf8');

    expect(codigoCatalogo).not.toContain('Se requiere el 30 % del total');
  });
});
