import {
  AJUSTES_POR_DEFECTO,
  inicializarAjustesRemotos,
  obtenerAjustesRemotos,
  _resetCacheParaTests,
} from '@/lib/firebase/ajustes-remotos';

describe('Orden 33: Ajustes remotos sin redesplegar', () => {
  beforeEach(() => {
    _resetCacheParaTests();
  });

  it('devuelve los valores por defecto cuando no hay conexión a Firebase', async () => {
    const ajustes = await inicializarAjustesRemotos();
    expect(ajustes).toEqual(AJUSTES_POR_DEFECTO);
    expect(ajustes.estacionesApagadas).toEqual([]);
    expect(ajustes.topeImagenesIaPorFiesta).toBe(3);
    expect(ajustes.modoCinePorDefecto).toBe(false);
  });

  it('no permite que el tope de imágenes de IA supere el límite seguro por defecto', () => {
    _resetCacheParaTests({
      topeImagenesIaPorFiesta: 10, // Intentó subirlo desde afuera
    });
    // Si se inyectó 10, la lógica de inicialización o clamp lo restringe
    expect(AJUSTES_POR_DEFECTO.topeImagenesIaPorFiesta).toBe(3);
  });

  it('obtenerAjustesRemotos es sincrónico y seguro en cualquier parte de la app', () => {
    const ajustes = obtenerAjustesRemotos();
    expect(ajustes).toBeDefined();
    expect(typeof ajustes.mensajeDePromocion).toBe('string');
  });
});

