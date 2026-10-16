/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createSimulatorBudgetPdf } from '@/lib/budget/simulator-budget-pdf';
import { buildAnnualAdjustmentProjection } from '@/lib/budget/formal-budget';

describe('Logo de AK completo y usado en el presupuesto descargable', () => {
  const bytes = fs.readFileSync(path.join(process.cwd(), 'public/logo_ak_producciones.png'));

  it('decodifica todos los pixeles, no solo la cabecera PNG', async () => {
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBeGreaterThan(0);
    expect(info.height).toBeGreaterThan(0);
    expect(data.length).toBe(info.width * info.height * 4);
  });

  it('el generador real incorpora la imagen al PDF, sin caer al titulo alternativo', async () => {
    // Cargar la variante Node antes de simular el transporte de imagen del navegador.
    await import('jspdf');
    const previous = Object.fromEntries(['window', 'fetch', 'FileReader'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const fetchLogo = jest.fn().mockResolvedValue({ blob: async () => bytes });
    class LogoReader {
      result = '';
      onloadend?: () => void;
      readAsDataURL(blob: Buffer) {
        this.result = 'data:image/png;base64,' + blob.toString('base64');
        this.onloadend?.();
      }
    }
    try {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
      Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchLogo });
      Object.defineProperty(globalThis, 'FileReader', { configurable: true, value: LogoReader });
      const pdf = await createSimulatorBudgetPdf({
        documentId: 'qa-logo-original', publicUrl: 'https://example.invalid/presupuesto/qa-logo-original',
        clientName: 'Cliente ficticio', eventType: 'Boda', adults: 100, childrenAndTeens: 0,
        items: [], stats: { subtotalBruto: 100000, ahorroRegalos: 0, descPromo: 0,
          totalFinal: 100000, precioPorPersona: 1000, discountPercentage: 0,
          annualProjection: buildAnnualAdjustmentProjection({ baseTotal: 100000 }) },
      });
      expect(fetchLogo).toHaveBeenCalledWith('/logo_ak_producciones.png');
      const output = pdf.output();
      expect(output).toContain('/Subtype /Image');
      const metadata = await sharp(bytes).metadata();
      expect(output).toContain('/Width ' + metadata.width);
      expect(output).toContain('/Height ' + metadata.height);
      expect(pdf.getNumberOfPages()).toBeGreaterThan(0);
    } finally {
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  }, 20000);
});
