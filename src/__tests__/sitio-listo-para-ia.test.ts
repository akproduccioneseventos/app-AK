import fs from 'node:fs';
import path from 'node:path';
import { ARCHIVOS_QUE_GOOGLE_LEE, PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';

describe('sitio listo para asistentes de IA (llms.txt)', () => {
  const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');

  it('el archivo llms.txt existe y tiene contenido válido', () => {
    expect(fs.existsSync(llmsPath)).toBe(true);
    const content = fs.readFileSync(llmsPath, 'utf8');
    expect(content.trim().length).toBeGreaterThan(100);
  });

  it('describe el negocio, la ciudad y la modalidad sin inventar local a la calle', () => {
    const content = fs.readFileSync(llmsPath, 'utf8');
    expect(content).toContain('AK Producciones Eventos');
    expect(content).toContain('Salto, Uruguay');
    expect(content).toContain('Uruguay 754');
    expect(content).toMatch(/no cuenta con local de atención al público a la calle/i);
  });

  it('no declara precios de lista fijos ni paquetes en dólares', () => {
    const content = fs.readFileSync(llmsPath, 'utf8');
    expect(content).not.toMatch(/USD|\$1000|1000 USD|1\.000/);
    expect(content).toMatch(/no utiliza precios de lista fijos/i);
    expect(content).toMatch(/pesos uruguayos/i);
  });

  it('todos los enlaces públicos mencionados en llms.txt corresponden a rutas reales', () => {
    const content = fs.readFileSync(llmsPath, 'utf8');
    const urlMatches = content.match(/https:\/\/akproducciones\.uy(\/[a-zA-Z0-9\-_/]*)/g) || [];
    expect(urlMatches.length).toBeGreaterThan(5);

    for (const fullUrl of urlMatches) {
      const pathname = fullUrl.replace('https://akproducciones.uy', '') || '/';
      const estaEnPaginas = (PAGINAS_PARA_GOOGLE as readonly string[]).includes(pathname);
      expect(estaEnPaginas).toBe(true);
    }
  });

  it('llms.txt está incluido en ARCHIVOS_QUE_GOOGLE_LEE', () => {
    expect((ARCHIVOS_QUE_GOOGLE_LEE as readonly string[]).includes('/llms.txt')).toBe(true);
  });
});
