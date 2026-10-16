import fs from 'node:fs';
import path from 'node:path';

describe('Pantallas operativas, documentales y configuración de cuenta', () => {
  const root = process.cwd();

  it('la pantalla /settings/account tiene formulario de seguridad y cambio de contraseña', () => {
    const filePath = path.join(root, 'src/app/(app)/settings/account/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('changeAppPassword');
    expect(content).toContain('saveSecurityRecoverySettings');
  });

  it('la pantalla /fiestas/nueva/gestion-documental/cancelacion-parcial tiene cabecera y comprobante', () => {
    const filePath = path.join(root, 'src/app/(app)/fiestas/nueva/gestion-documental/cancelacion-parcial/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('cabecera-documento');
    expect(content).toContain('getFiestaById');
  });

  it('la pantalla /fiestas/nueva/portal-cliente/cierre-final calcula el estado de preparación del portal', () => {
    const filePath = path.join(root, 'src/app/(app)/fiestas/nueva/portal-cliente/cierre-final/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('buildClientFinalReadiness');
    expect(content).toContain('getClientFinalScore');
  });

  it('la pantalla /fiestas/nueva/social-fiesta-pro tiene integración con feed social y muro', () => {
    const filePath = path.join(root, 'src/app/(app)/fiestas/nueva/social-fiesta-pro/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('buildAkSoftSellingPosts');
    expect(content).toContain('buildLiveWallPremiumSlides');
  });

  it('la pantalla /fiestas/nueva/social-fiesta-pro/cierre-final evalúa el estado del social fiesta pro', () => {
    const filePath = path.join(root, 'src/app/(app)/fiestas/nueva/social-fiesta-pro/cierre-final/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('buildSocialFinalReadiness');
    expect(content).toContain('getSocialFinalScore');
  });
});
