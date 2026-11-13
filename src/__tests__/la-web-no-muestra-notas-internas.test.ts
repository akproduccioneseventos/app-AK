import fs from 'fs';
import path from 'path';

describe('Orden 297: La web no muestra notas internas', () => {
  it('EventLandingPage no contiene "en el CRM"', () => {
    const file = path.join(process.cwd(), 'src/components/landing/EventLandingPage.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).not.toContain('en el CRM');
    expect(content).toContain('Recibimos tu consulta y te respondemos por WhatsApp');
  });

  it('LeadCaptureForm no contiene "medir esta campaña"', () => {
    const file = path.join(process.cwd(), 'src/components/landing/LeadCaptureForm.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).not.toContain('medir esta campaña');
    expect(content).toContain('saber cómo nos encontraste');
  });

  it('public-footer no contiene "Oficina & Atención"', () => {
    const file = path.join(process.cwd(), 'src/components/public-footer.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).not.toContain('Oficina & Atención');
  });

  it('club-uruguay no contiene "sonido robótico"', () => {
    const file = path.join(process.cwd(), 'src/app/club-uruguay/page.tsx');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).not.toContain('sonido robótico');
    expect(content).toContain('sonido profesional e iluminación robótica');
  });

  it('shared.ts y componentes no contienen "contigo" en tuteo', () => {
    const sharedFile = path.join(process.cwd(), 'src/data/event-catalogs/shared.ts');
    expect(fs.readFileSync(sharedFile, 'utf-8')).not.toContain('contigo');

    const faqFile = path.join(process.cwd(), 'src/components/public/FAQSection.tsx');
    const faqContent = fs.readFileSync(faqFile, 'utf-8');
    expect(faqContent).not.toContain('Aquí respondemos');

    const processFile = path.join(process.cwd(), 'src/components/public/EventProcess.tsx');
    expect(fs.readFileSync(processFile, 'utf-8')).not.toContain('contigo');
  });

  it('simulador viejo no contiene palabras sin tildes del barrido', () => {
    const simFile = path.join(process.cwd(), 'src/app/simulador/page.tsx');
    const simContent = fs.readFileSync(simFile, 'utf-8');
    expect(simContent).not.toMatch(/['">]Instantaneo['"<]/);
    expect(simContent).not.toMatch(/['">]Rapido['"<]/);
  });

  it('InteractiveTechShowcase dice Ilustración y no Después (IA)', () => {
    const techFile = path.join(process.cwd(), 'src/components/public/InteractiveTechShowcase.tsx');
    const techContent = fs.readFileSync(techFile, 'utf-8');
    expect(techContent).not.toContain('Después (IA)');
    expect(techContent).not.toContain('Exclusivo con IA');
    expect(techContent).toContain('Ilustración');
    expect(techContent).toContain('Con IA');
  });
});
