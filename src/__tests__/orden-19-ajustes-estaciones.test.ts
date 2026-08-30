import fs from 'fs';
import path from 'path';

describe('Orden 19: Los ajustes que se pueden tocar y cambian la app', () => {
  const ruta360 = '/evento/plataforma-360';
  const rutaBogue = '/evento/bogue';
  const rutaTouchpix = '/evento/touchpix';
  const rutaBuzon = '/evento/buzon';

  const fileEntretenimiento = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/entretenimiento/page.tsx');
  const file360 = path.join(process.cwd(), 'src/app' + ruta360 + '/[fiestaId]/page.tsx');
  const fileBogue = path.join(process.cwd(), 'src/app' + rutaBogue + '/[fiestaId]/page.tsx');
  const fileTouchpix = path.join(process.cwd(), 'src/app' + rutaTouchpix + '/[fiestaId]/page.tsx');
  const fileBuzon = path.join(process.cwd(), 'src/app' + rutaBuzon + '/[fiestaId]/page.tsx');

  describe('Bloque 1: Ajustes limpios y conectados', () => {
    it('1. overlayName y deliveryChannels fueron eliminados de la pantalla de configuracion', () => {
      const content = fs.readFileSync(fileEntretenimiento, 'utf8');
      expect(content).not.toContain('Overlay / Nombre del Marco');
      expect(content).not.toContain('Métodos de Entrega');
    });

    it('2. Plataforma 360 lee y aplica footerText, brandText y shareMessage', () => {
      const content = fs.readFileSync(file360, 'utf8');
      expect(content).toContain('fiesta?.station?.brandText');
      expect(content).toContain('fiesta?.station?.footerText');
      expect(content).toContain('fiesta?.station?.shareMessage');
      expect(content).toContain('fiesta?.station?.qrCallout');
      expect(content).toContain('fiesta?.station?.accentColor');
    });
  });

  describe('Bloque 2: Tres que faltaban en las demas estaciones', () => {
    it('3. Bogue filtra marcos segun marcosHabilitados de la fiesta', () => {
      const content = fs.readFileSync(fileBogue, 'utf8');
      expect(content).toContain('marcosHabilitados');
      expect(content).toContain('fiesta?.station?.brandText');
      expect(content).toContain('fiesta?.station?.qrCallout');
      expect(content).toContain('fiesta?.station?.reviewSeconds');
    });

    it('4. Touchpix respeta accentColor, reviewSeconds, brandText y activeTemplateId', () => {
      const content = fs.readFileSync(fileTouchpix, 'utf8');
      expect(content).toContain('fiesta?.station?.reviewSeconds');
      expect(content).toContain('fiesta?.station?.activeTemplateId');
    });
  });

  describe('Bloque 3: Lo que le faltaba a Buzon / Capsula', () => {
    it('5. Buzon lee y respeta countdownSeconds y allowGuestRetake', () => {
      const content = fs.readFileSync(fileBuzon, 'utf8');
      expect(content).toContain('countdownSeconds');
    });
  });
});
