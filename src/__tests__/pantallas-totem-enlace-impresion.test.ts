import fs from 'node:fs';
import path from 'node:path';

describe('Pantalla /fiestas/nueva/pantallas-totem', () => {
  it('el código de la pantalla /fiestas/nueva/pantallas-totem incluye enlace a la estación de impresión', () => {
    const rutaArchivo = path.join(process.cwd(), 'src/components/panels/fiesta--pantallas-totem.tsx');
    expect(fs.existsSync(rutaArchivo)).toBe(true);

    const contenido = fs.readFileSync(rutaArchivo, 'utf8');

    // Debe existir el botón con Link hacia la estación de impresión
    expect(contenido).toMatch(/\/evento\/impresion\//);
    expect(contenido).toMatch(/Estación de impresión/);

    // Debe contener el identificador y ruta de la pantalla
    const coincideRuta = contenido.includes('/fiestas/nueva?fiestaId=') || contenido.includes('Pantallas Tótem');
    expect(coincideRuta).toBe(true);
  });

  it('verifica que el panel de pantallas-totem está registrado y exporta un componente por defecto', async () => {
    const modulo = await import('@/components/panels/fiesta--pantallas-totem');
    expect(modulo.default).toBeDefined();
    expect(typeof modulo.default).toBe('function');
  });
});
