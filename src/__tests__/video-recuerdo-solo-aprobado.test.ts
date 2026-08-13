import { esAprobadoParaMostrar, soloAprobados } from '@/lib/social-fiesta/visibilidad';
import { puede, PERMISOS } from '@/lib/auth/perfiles';

/**
 * Dos reglas de las cuatro ideas grandes que no se pueden mirar a ojo.
 *
 * **Por qué esta prueba se reescribió.** La versión anterior armaba una lista
 * inventada adentro de la prueba y después la filtraba ahí mismo. O sea que probaba
 * su propio filtro, no el de la aplicación: si el video dejara de descartar las
 * fotos pendientes, la prueba habría seguido en verde. Una prueba que no puede
 * fallar es peor que no tener prueba, porque el próximo que la lea va a creer que la
 * regla está protegida.
 *
 * Estas llaman a la función que usa la aplicación de verdad.
 */

describe('qué contenido del muro se muestra', () => {
  it('lo aprobado se muestra', () => {
    expect(esAprobadoParaMostrar({ moderationStatus: 'approved' })).toBe(true);
  });

  it('lo que espera revisión NO se muestra', () => {
    expect(esAprobadoParaMostrar({ moderationStatus: 'pending' })).toBe(false);
  });

  it('lo escondido NO se muestra', () => {
    expect(esAprobadoParaMostrar({ moderationStatus: 'hidden' })).toBe(false);
  });

  it('lo viejo, de antes de la moderación, se considera aprobado', () => {
    expect(esAprobadoParaMostrar({})).toBe(true);
  });

  it('un estado desconocido NO se muestra: ante la duda, no se publica', () => {
    expect(esAprobadoParaMostrar({ moderationStatus: 'cualquier-cosa' })).toBe(false);
  });

  it('sin publicación no se rompe', () => {
    expect(esAprobadoParaMostrar(null)).toBe(false);
    expect(esAprobadoParaMostrar(undefined)).toBe(false);
  });

  it('filtrando una lista deja sólo lo aprobado', () => {
    const posts = [
      { id: '1', moderationStatus: 'approved' },
      { id: '2', moderationStatus: 'pending' },
      { id: '3', moderationStatus: 'hidden' },
      { id: '4' },
    ];

    expect(soloAprobados(posts).map((p) => p.id)).toEqual(['1', '4']);
    expect(soloAprobados(null)).toEqual([]);
  });
});

describe('el repaso de la mañana esconde la plata a quien no puede verla', () => {
  it('un operador no puede ver contabilidad', () => {
    expect(puede({ perfil: 'operador' }, PERMISOS.CONTABILIDAD)).toBe(false);
  });

  it('el administrador sí puede', () => {
    expect(puede({ role: 'admin' }, PERMISOS.CONTABILIDAD)).toBe(true);
  });

  it('sin usuario no se ve plata', () => {
    expect(puede(null, PERMISOS.CONTABILIDAD)).toBe(false);
    expect(puede(undefined, PERMISOS.CONTABILIDAD)).toBe(false);
  });
});
