/**
 * Decision del dueno, 7 de octubre de 2026: *"si no hay foto pones una de ejemplo, no vuelvas a
 * preguntar"*. Ningun plato ni servicio que se le ofrece al cliente queda en blanco, y la foto de
 * ejemplo es del tema correcto (el glitter bar no lleva la foto de una barra de tragos, ni la
 * Mesa bufet una pizarra vacia).
 *
 * Ademas: las doce fotos `glitter_bar_img_*` eran sesiones de quince y la galeria las mostraba
 * como "Glitter Bar". Se corrigen al leer, porque la copia de la base tiene la categoria vieja.
 */
import fs from 'fs';
import path from 'path';
import {
  cateringDishIdsWithoutConfirmedImage,
  fotoDeEjemploPorPlato,
  fotoDelPlatoParaMostrar,
  GLITTER_BAR_FOTO_DE_EJEMPLO,
} from '@/lib/catering/menu-images';

const existe = (url: string) => fs.existsSync(path.join(process.cwd(), 'public', url));
const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');

let catalogoGuardado: unknown[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => JSON.parse(JSON.stringify(catalogoGuardado))),
  writeData: jest.fn(),
  createDataItem: jest.fn(),
  updateDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(),
}));

describe('si no hay foto, va una de ejemplo', () => {
  it('cada plato sin foto confirmada tiene su foto de ejemplo, y el archivo existe', () => {
    for (const id of cateringDishIdsWithoutConfirmedImage) {
      const foto = fotoDelPlatoParaMostrar({ id, imageUrl: `/catering/menus/xv/${id}.jpeg` });
      expect(foto).toBe(fotoDeEjemploPorPlato[id]);
      expect(existe(foto!)).toBe(true);
    }
    // La Mesa bufet nunca vuelve a la pizarra vacia.
    expect(fotoDelPlatoParaMostrar({ id: 'dish_main_19', imageUrl: '/catering/menus/xv/dish_main_19.jpeg' }))
      .not.toBe('/catering/menus/xv/dish_main_19.jpeg');
  });

  it('una foto real que sube el dueno se muestra en lugar del ejemplo', () => {
    expect(fotoDelPlatoParaMostrar({ id: 'dish_main_19', imageUrl: '/media/mi-bufet-real.jpg' }))
      .toBe('/media/mi-bufet-real.jpg');
  });

  it('el glitter bar lleva su imagen de ejemplo en el simulador, la portada y la presentacion', () => {
    expect(existe(GLITTER_BAR_FOTO_DE_EJEMPLO)).toBe(true);
    for (const archivo of [
      'src/app/simulador-de-presupuesto/page.tsx',
      'src/app/page.tsx',
      'src/app/presentacion-led/slides/categoria-servicios-slide.tsx',
    ]) {
      const texto = leer(archivo);
      expect(texto).toContain('GLITTER_BAR_FOTO_DE_EJEMPLO');
      // Se pregunta por "glitter" ANTES que por "bar": si no, le toca la foto de los tragos.
      const glitter = texto.search(/includes\("glitter"\)|includes\('glitter'\)|\/glitter\/\.test/);
      const bebidas = texto.indexOf('blog_bebidas.png');
      if (bebidas >= 0) expect(glitter).toBeGreaterThan(-1);
      if (bebidas >= 0) expect(glitter).toBeLessThan(bebidas);
    }
  });

  it('las sesiones de quince que se importaron como "Glitter Bar" se leen como fotografia', async () => {
    catalogoGuardado = [
      { id: 'a', url: '/media/catalogo-servicios/glitter_bar_img_241_p25_x1663.jpeg', categoriaServicio: 'Glitter Bar', descripcion: 'vieja' },
      { id: 'b', url: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg', categoriaServicio: 'Barra de Tragos' },
    ];
    const { getCatalogoFotos } = await import('@/app/actions/catalogo-fotos');
    const fotos = await getCatalogoFotos();
    expect(fotos[0].categoriaServicio).toBe('Fotografía y Cabina');
    expect(fotos[1].categoriaServicio).toBe('Barra de Tragos');
    const enElArchivo = JSON.parse(leer('src/data/catalogo-fotos.json')) as Array<{ url: string; categoriaServicio: string }>;
    expect(enElArchivo.filter((f) => f.categoriaServicio === 'Glitter Bar' && f.url.includes('glitter_bar_img_'))).toEqual([]);
  });
});
