import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('PR 771 public release contract', () => {
  it('does not publish fabricated success stories as verified customer reviews', () => {
    const source = read('src/components/landing/TestimonialsSection.tsx');

    expect(source).not.toContain('SUCCESS_STORIES');
    expect(source).not.toContain('Logro verificado');
    expect(source).not.toContain('Casos de Éxito Reales');
    expect(source).toContain('Opinión publicada');
  });

  it('keeps video and testimonial dialogs keyboard-visible and modal', () => {
    const testimonials = read('src/components/landing/TestimonialsSection.tsx');
    const videos = read('src/components/landing/VideoSection.tsx');
    const faq = read('src/components/landing/FAQSection.tsx');

    for (const source of [testimonials, videos]) {
      expect(source).toContain('aria-modal="true"');
      expect(source).toContain('focus-visible:ring-2');
      expect(source).toContain("e.key !== 'Tab'");
    }
    expect(videos).toContain('<button');
    expect(videos).not.toContain('role="button"');
    expect(faq).toContain('focus-visible:ring-inset');
  });

  it('allows the simulator to continue after a temporary availability error', () => {
    const source = read('src/app/simulador-de-presupuesto/page.tsx');

    expect(source).toContain("dateAvailabilityStatus === 'occupied'");
    expect(source).toContain("setDateAvailabilityStatus('error')");
    expect(source).toContain('Podés continuar y AK confirmará la fecha');
    expect(source).not.toContain('if (dateWarning) {');
  });

  it('does not print a false one-page count in either formal budget template', () => {
    const unified = read('src/components/budget/BudgetDocument.tsx');
    const manual = read('src/components/presupuestos/BudgetPrintTemplate.tsx');

    for (const source of [unified, manual]) {
      expect(source).not.toContain('>1/1<');
      expect(source).toContain('Formato');
      expect(source).toContain('>A4<');
    }
    expect(unified).not.toContain('text-slate-850');
  });

  it('does not expose an unusable WhatsApp anchor on the live wall', () => {
    const source = read('src/app/evento/muro-en-vivo/[fiestaId]/page.tsx');

    expect(source).toContain('if (wa && waDigits)');
    expect(source).not.toContain("url: wa ? `https://wa.me/${wa}` : '#'");
  });
});
