import { buscarEnElSitio } from '@/lib/buscador/buscar-sitio';

describe('Orden 306: El buscador encuentra lo que sugiere', () => {
  it.each(['15 años', 'bodas', 'fotocabina', 'catering'])(
    'devuelve al menos un resultado para "%s"',
    (termino) => {
      const resultados = buscarEnElSitio(termino);
      expect(resultados.length).toBeGreaterThan(0);
    },
  );
});
