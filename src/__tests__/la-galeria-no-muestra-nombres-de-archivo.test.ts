import fs from 'fs';
import path from 'path';
import { textoVisibleDeLaFoto } from '@/lib/galeria/texto-de-la-foto';

describe('Orden 96 Bloque 8: La galería no muestra nombres de archivo como título', () => {
  const rutaCatalogo = path.join(process.cwd(), 'src/data/catalogo-fotos.json');
  const fotosRaw = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf-8'));

  it('recorre todas las fotos del archivo real y ningún título visible empieza con Img seguido de números', () => {
    expect(fotosRaw.length).toBeGreaterThan(0);

    for (const foto of fotosRaw) {
      const { titulo, descripcion } = textoVisibleDeLaFoto(foto);

      // Ningún título visible puede empezar con 'Img' o 'img' seguido de números o guiones
      expect(titulo).not.toMatch(/^img[\s_-]*\d+/i);

      // Si la descripción original era la frase de catálogo repetida, se debe ocultar
      if (/del cat[aá]logo de servicios reales/i.test(foto.descripcion || '')) {
        expect(descripcion).toBe('');
      }
    }
  });

  it('convierte un título con nombre de archivo en su categoría de servicio', () => {
    const fotoMock = {
      titulo: 'Img 035 P04 X1123',
      descripcion: 'Foto de decoración del catálogo de servicios reales de AK Producciones.',
      categoriaServicio: 'Decoración',
    };

    const res = textoVisibleDeLaFoto(fotoMock);
    expect(res.titulo).toBe('Decoración');
    expect(res.descripcion).toBe('');
  });

  it('respeta títulos y descripciones legítimos de fotos', () => {
    const fotoMock = {
      titulo: 'Mesa de dulces ambientada con luces cálidas',
      descripcion: 'Detalle de la ambientación en Salón Club Uruguay.',
      categoriaServicio: 'Decoración',
    };

    const res = textoVisibleDeLaFoto(fotoMock);
    expect(res.titulo).toBe('Mesa de dulces ambientada con luces cálidas');
    expect(res.descripcion).toBe('Detalle de la ambientación en Salón Club Uruguay.');
  });
});
