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
    expect(albumContent).toContain('wa.me/59898355530');
    expect(albumContent).toContain('Escribinos por WhatsApp');
    expect(albumContent).toContain('Organizado y capturado por AK Producciones');

    // Hub
    expect(hubContent).toContain('wa.me/59898355530');
    expect(hubContent).toContain('¿Querés una fiesta con esta tecnología?');
  });

  it('comercial-360 tiene el aviso claro de EJEMPLO ILUSTRATIVO para evitar confusiones de costos en capacitaciones', () => {
    const comercialPath = path.join(RAIZ, 'src/app/(app)/contabilidad/comercial-360/page.tsx');
    expect(existsSync(comercialPath)).toBe(true);

    const content = readFileSync(comercialPath, 'utf8');
    expect(content).toContain('EJEMPLO ILUSTRATIVO');
    expect(content).toContain('No es precio real');
  });

  it('el simulador de presupuesto ofrece garantía de 7 días, botón para modificar y plan de pagos sugerido', () => {
    const simuladorPath = path.join(RAIZ, 'src/app/simulador-de-presupuesto/page.tsx');
    expect(existsSync(simuladorPath)).toBe(true);

    const content = readFileSync(simuladorPath, 'utf8');
    expect(content).toContain('Validez 7 días');
    expect(content).toContain('Modificar mi presupuesto');
    expect(content).toContain('Plan de pagos en cuotas fijas');
    expect(content).toContain('Seña para congelar fecha:');
    expect(content).toContain('$ 5.000');
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
    expect(content).toContain('Detalle en preparación por el equipo AK');
  });
});
