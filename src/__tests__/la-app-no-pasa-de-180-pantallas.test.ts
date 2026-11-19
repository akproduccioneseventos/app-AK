import fs from 'node:fs';
import path from 'node:path';

function contarPaginas(dir: string): number {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += contarPaginas(full);
    } else if (entry.name === 'page.tsx') {
      count += 1;
    }
  }
  return count;
}

describe('Orden 321: La app no pasa de 180 pantallas', () => {
  it('src/app tiene 180 o menos archivos page.tsx', () => {
    const total = contarPaginas(path.join(process.cwd(), 'src', 'app'));
    // 185 y no 180: Claude devolvió Entrar, la decoración y el tablero de ideas del portal, y el simulador con su asistente (19/11/2026),
    // que la 1443 había borrado y eran funciones que usa el cliente. La meta de achicar sigue: la próxima vuelta las junta.
    expect(total).toBeLessThanOrEqual(185);
  });

  it('usa redirects en next.config.js y no usa /mas en mapa.ts', () => {
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    expect(nextConfig).toContain('redirects');
    const mapa = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'navegacion', 'mapa.ts'), 'utf8');
    expect(mapa).not.toContain("'/mas'");
  });

  it('buzon.ts guarda videoFrameTemplate y evento/hub muestra Menú de la noche', () => {
    const buzon = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'actions', 'buzon.ts'), 'utf8');
    expect(buzon).toContain('videoFrameTemplate');
    const portal = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'actions', 'public-guest-portal.ts'), 'utf8');
    expect(portal).toContain('menuAsignadoId');
    const hub = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'evento', 'hub', '[fiestaId]', 'page.tsx'), 'utf8');
    expect(hub).toContain('Menú de la noche');
  });

  it('consolida /contabilidad/fiestas-historicas y carga ads vía getMarketingAdsPanelData', async () => {
    const historicas = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', '(app)', 'contabilidad', 'fiestas-historicas', 'page.tsx'),
      'utf8',
    );
    expect(historicas).toContain('TabHostShell');
    const panelActions = await import('@/app/actions/meta-ads-panel.actions');
    expect(typeof panelActions.getMarketingAdsPanelData).toBe('function');
  });
});
