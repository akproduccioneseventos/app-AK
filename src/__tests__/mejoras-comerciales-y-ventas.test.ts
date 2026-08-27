import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();

describe('Mejoras comerciales y de ventas antes de publicar', () => {
  it('el footer del álbum y el hub del invitado tienen contacto directo por WhatsApp contextualizado', () => {
    const albumPath = path.join(RAIZ, 'src/app/evento/album/[fiestaId]/page.tsx');
    const hubPath = path.join(RAIZ, 'src/app/evento/hub/[fiestaId]/page.tsx');

    expect(existsSync(albumPath)).toBe(true);
    expect(existsSync(hubPath)).toBe(true);

    const albumContent = readFileSync(albumPath, 'utf8');
    const hubContent = readFileSync(hubPath, 'utf8');

    // Álbum
    expect(albumContent).toContain('buildAkWhatsAppUrl');
    expect(albumContent).toContain('Escribinos por WhatsApp');
    expect(albumContent).toContain('Organizado y capturado por AK Producciones');

    // Hub
    expect(hubContent).toContain('buildAkWhatsAppUrl');
    expect(hubContent).toContain('¿Querés una fiesta con esta tecnología?');
    expect(hubContent).toContain('source=guest_portal');
    expect(hubContent).toContain('refFiesta=');
  });

  it('las estaciones de captura tienen cierre de marca discreto y contacto por WhatsApp', () => {
    const fotocabinaPath = path.join(RAIZ, 'src/app/evento/fotocabina/[fiestaId]/page.tsx');
    const espejoPath = path.join(RAIZ, 'src/app/evento/espejo-magico/[fiestaId]/page.tsx');
    const plataforma360Path = path.join(RAIZ, 'src/app/evento/plataforma-360/[fiestaId]/page.tsx');

    expect(existsSync(fotocabinaPath)).toBe(true);
    expect(existsSync(espejoPath)).toBe(true);
    expect(existsSync(plataforma360Path)).toBe(true);

    const fotocabinaContent = readFileSync(fotocabinaPath, 'utf8');
    const espejoContent = readFileSync(espejoPath, 'utf8');
    const plataforma360Content = readFileSync(plataforma360Path, 'utf8');

    expect(fotocabinaContent).toContain('Esto lo hizo AK Producciones');
    expect(fotocabinaContent).toContain('wa.me/59898355530');

    expect(espejoContent).toContain('Esto lo hizo AK Producciones');
    expect(espejoContent).toContain('wa.me/59898355530');

    expect(plataforma360Content).toContain('Esto lo hizo AK Producciones');
    expect(plataforma360Content).toContain('wa.me/59898355530');
  });

  it('la presentacion LED tiene acceso directo a Salón Club Uruguay y boton de compartir propuesta', () => {
    const ledPath = path.join(RAIZ, 'src/app/presentacion-led/page.tsx');
    const cierreSlidePath = path.join(RAIZ, 'src/app/presentacion-led/slides/cierre-slide.tsx');

    expect(existsSync(ledPath)).toBe(true);
    expect(existsSync(cierreSlidePath)).toBe(true);

    const ledContent = readFileSync(ledPath, 'utf8');
    const cierreSlideContent = readFileSync(cierreSlidePath, 'utf8');

    expect(ledContent).toContain('Salón Club Uruguay');
    expect(ledContent).toContain('handleCompartirPropuesta');
    expect(cierreSlideContent).toContain('Compartir');
    expect(cierreSlideContent).toContain('Paquete integral');
    expect(cierreSlideContent).toContain('contratando todo junto');
  });

  it('comercial-360 tiene el aviso claro de EJEMPLO ILUSTRATIVO para evitar confusiones de costos en capacitaciones', () => {
    const comercialPath = path.join(RAIZ, 'src/app/(app)/contabilidad/comercial-360/page.tsx');
    expect(existsSync(comercialPath)).toBe(true);

    const content = readFileSync(comercialPath, 'utf8');
    expect(content).toContain('EJEMPLO ILUSTRATIVO');
    expect(content).toContain('No es precio real');
  });

  it('el simulador mantiene la vigencia formal, permite modificar y usa el plan calculado', () => {
    const simuladorPath = path.join(RAIZ, 'src/app/simulador-de-presupuesto/page.tsx');
    expect(existsSync(simuladorPath)).toBe(true);

    const content = readFileSync(simuladorPath, 'utf8');
    expect(content).toContain('Validez 30 días');
    expect(content).toContain('Modificar mi presupuesto');
    expect(content).toContain('Plan de pagos estimado');
    expect(content).toContain('Seña para reservar la fecha:');
    expect(content).toContain('budgetSettings.bookingDepositAmount');
    expect(content).toContain('paymentPlan.installmentAmount');
  });

  it('el portal del cliente incluye sección de extras contratables para sumar mejoras a la fiesta', () => {
    const portalPath = path.join(RAIZ, 'src/app/portal/page.tsx');
    expect(existsSync(portalPath)).toBe(true);

    const content = readFileSync(portalPath, 'utf8');
    expect(content).toContain('Mejoras y Extras para tu Fiesta');
    expect(content).toContain('Hora adicional de fiesta y DJ');
    expect(content).toContain('Show de Robot LED gigante');
    expect(content).toContain('Vals en las Nubes (Humo bajo)');
    expect(content).toContain('Me interesa sumar esto');
  });

  it('no existen textos frios ni errores de "AK todavia no cargo" en el portal público', () => {
    const portalViewPath = path.join(RAIZ, 'src/app/portal/c/[accessKey]/PublicPortalView.tsx');
    expect(existsSync(portalViewPath)).toBe(true);

    const content = readFileSync(portalViewPath, 'utf8');
    expect(content).not.toContain('AK todavia no cargo');
    expect(content).not.toContain('AK todabia no cargo');
    expect(content).not.toContain('AK todavía no cargó');
    expect(content).toContain('Detalle en preparación por el equipo AK');
  });
});
