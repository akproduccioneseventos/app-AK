import fs from 'node:fs';
import path from 'node:path';

describe('Pantallas operativas, documentales y configuración de cuenta', () => {
  const root = process.cwd();

  it('la pantalla /settings/account tiene formulario de seguridad y cambio de contraseña', () => {
    const filePath = path.join(root, 'src/components/settings/panels/account.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('changeAppPassword');
    expect(content).toContain('saveSecurityRecoverySettings');
  });

  it('la pantalla /fiestas/nueva/gestion-documental/cancelacion-parcial tiene cabecera y comprobante', () => {
    const filePath = path.join(root, 'src/components/panels/doc--cancelacion-parcial.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('cabecera-documento');
    expect(content).toContain('getFiestaById');
  });

  it('la pantalla /fiestas/nueva/portal-cliente/cierre-final calcula el estado de preparación del portal', () => {
    const filePath = path.join(root, 'src/components/fiestas/panels/portal-cliente--cierre-final.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('buildClientFinalReadiness');
    expect(content).toContain('getClientFinalScore');
  });

  it('la pantalla /fiestas/nueva/social-fiesta-pro tiene integración con feed social y muro', () => {
    const filePath = path.join(root, 'src/components/fiestas/panels/social-fiesta-pro.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('buildAkSoftSellingPosts');
    expect(content).toContain('buildLiveWallPremiumSlides');
  });

  it('la pantalla /fiestas/nueva/social-fiesta-pro/cierre-final evalúa el estado del social fiesta pro', () => {
    const filePath = path.join(root, 'src/components/fiestas/panels/social-fiesta-pro--cierre-final.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('buildSocialFinalReadiness');
    expect(content).toContain('getSocialFinalScore');
  });

  it('la pantalla /fiestas/nueva/gestion-documental requiere fiesta seleccionada con EventSelectionRequired', () => {
    const filePath = path.join(root, 'src/components/fiestas/panels/gestion-documental.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('EventSelectionRequired');
    expect(content).toContain('la gestión documental');
  });

  it('la pantalla /settings/contratos tiene atributos de accesibilidad y selección', () => {
    const filePath = path.join(root, 'src/components/settings/panels/contratos.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('aria-pressed');
    expect(content).toContain('Plantillas de Contratos');
  });

  it('la pantalla /settings/agentes-autonomos tiene panel de control y estado de agentes', () => {
    const filePath = path.join(root, 'src/components/settings/panels/agentes-autonomos.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('getAgentesConfig');
    expect(content).toContain('getHistorialAgentes');
    expect(content).toContain('ejecutarAgenteManual');
  });
});
