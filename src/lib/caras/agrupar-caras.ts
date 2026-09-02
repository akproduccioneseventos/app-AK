/**
 * Encontrar las fotos de una persona, sin saber quién es.
 *
 * **Cómo lo hace el rubro, y qué le falta.** De cada cara de cada foto se sacan
 * unos números que la describen —no la foto, números—. Después se comparan: si
 * dos se parecen lo suficiente, es la misma persona. Kamero, FotoOwl, Memzo,
 * Turtlepic y Wfolio hacen todos eso.
 *
 * **El agujero que ellos mismos reconocen** es que usan **un solo umbral para
 * todo el mundo**: si es estricto, al invitado le faltan fotos suyas; si es
 * flojo, le aparecen fotos de otro. Y encima no funciona igual con todas las
 * caras —hay un sesgo conocido—, así que a algunas personas les cuesta más
 * encontrarse.
 *
 * **Acá se resuelve con dos cajones en vez de uno**: las seguras se muestran
 * directo, y las dudosas van aparte, para que **las confirme la persona**. Así
 * no se pierde ninguna y no se le filtra a nadie la foto de otro.
 *
 * **Nada de esto guarda una cara.** Lo que se guarda por foto es este puñado de
 * números, que **no permite reconstruir la cara** ni saber de quién es. No hay
 * nombres en ningún lado: esto **encuentra fotos, no identifica personas**.
 */

/** Los números que describen una cara. Son 128 y no reconstruyen nada. */
export type VectorDeCara = readonly number[];

export interface CaraEnFoto {
  /** La foto donde apareció. */
  fotoId: string;
  /** Los números de esa cara. */
  vector: VectorDeCara;
  /**
   * Qué tan grande sale la cara en la foto, de 0 a 1. Sirve para elegir la
   * mejor foto de cada persona para la grilla: una cara grande y de frente se
   * reconoce mucho mejor que una del fondo.
   */
  tamano?: number;
}

export interface Persona {
  /** Un número de orden. **Nunca un nombre**: acá no se identifica a nadie. */
  id: string;
  /** La cara que mejor la representa, para mostrar en la grilla. */
  representante: CaraEnFoto;
  /** Todas las fotos donde aparece, sin repetir. */
  fotoIds: string[];
  /** Cuántas caras suyas se juntaron. Más caras, más confianza. */
  apariciones: number;
}

/**
 * **Los dos umbrales, y por qué estos números.**
 *
 * La medida es la distancia entre los números de dos caras: cuanto más chica,
 * más se parecen. En esta familia de modelos, **0,6 es el punto donde el rubro
 * corta**: debajo se considera la misma persona.
 *
 * Acá se parte en dos:
 * - **0,50 o menos: seguro.** Se muestra directo.
 * - **entre 0,50 y 0,62: dudoso.** Se muestra aparte y lo confirma la persona.
 * - **más de 0,62: no es.** Ni se ofrece.
 *
 * El de arriba se corrió apenas de 0,60 a 0,62 **a propósito**: en la zona
 * dudosa no hay riesgo de filtrar nada —lo confirma un humano—, así que
 * conviene ser generoso ahí y estricto en lo que se muestra solo.
 */
export const DISTANCIA_SEGURA = 0.5;
export const DISTANCIA_DUDOSA = 0.62;

/**
 * Cuán distintas son dos caras. Es la distancia de siempre: se restan número a
 * número, se elevan al cuadrado, se suman y se saca la raíz.
 */
export function distancia(a: VectorDeCara, b: VectorDeCara): number {
  if (a.length === 0 || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let suma = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    suma += d * d;
  }
  return Math.sqrt(suma);
}

export interface Resultado {
  /** Estas son suyas. Se muestran directo. */
  seguras: string[];
  /** Estas puede que sean suyas. **Las confirma la persona**, no la máquina. */
  dudosas: string[];
}

/**
 * Busca las fotos de una cara.
 *
 * `vectores` puede traer **más de uno**: la cámara toma dos o tres cuadros
 * seguidos sin que el invitado haga nada, y se queda con la mejor coincidencia
 * de cada foto. **Es lo que arregla la mala luz y la cara de costado**, que es
 * donde más falla el rubro, y no cuesta un peso más.
 */
export function buscarFotosDeUnaCara(
  vectores: VectorDeCara[],
  caras: readonly CaraEnFoto[],
): Resultado {
  const mejorPorFoto = new Map<string, number>();

  for (const cara of caras) {
    let mejor = Number.POSITIVE_INFINITY;
    for (const v of vectores) {
      const d = distancia(v, cara.vector);
      if (d < mejor) mejor = d;
    }
    const anterior = mejorPorFoto.get(cara.fotoId);
    if (anterior === undefined || mejor < anterior) mejorPorFoto.set(cara.fotoId, mejor);
  }

  const seguras: string[] = [];
  const dudosas: string[] = [];
  // Ordenadas de la que más se parece a la que menos: lo primero que ve la
  // persona son las que seguro son suyas.
  for (const [fotoId, d] of [...mejorPorFoto.entries()].sort((x, y) => x[1] - y[1])) {
    if (d <= DISTANCIA_SEGURA) seguras.push(fotoId);
    else if (d <= DISTANCIA_DUDOSA) dudosas.push(fotoId);
  }
  return { seguras, dudosas };
}

/**
 * Junta todas las caras de la fiesta en personas. **Es la grilla**: cada
 * persona una carita, se toca y salen sus fotos.
 *
 * Va de a una: cada cara se compara con las personas ya armadas y se suma a la
 * más parecida; si no se parece a ninguna, empieza una persona nueva. Se
 * ordenan primero las caras más grandes **a propósito**: así cada grupo arranca
 * desde una cara bien visible en vez de una borrosa del fondo, que es lo que
 * hace que después se parta en dos.
 */
export function agruparEnPersonas(
  caras: readonly CaraEnFoto[],
  opciones: { minimoDeApariciones?: number } = {},
): Persona[] {
  // Por defecto se piden dos apariciones. Una cara suelta suele ser alguien que
  // pasaba por atrás, y llenar la grilla de desconocidos la vuelve inutil.
  const minimo = opciones.minimoDeApariciones ?? 2;

  const porTamano = [...caras].sort((a, b) => (b.tamano ?? 0) - (a.tamano ?? 0));
  const grupos: { centro: VectorDeCara; miembros: CaraEnFoto[] }[] = [];

  for (const cara of porTamano) {
    let mejorGrupo: (typeof grupos)[number] | null = null;
    let mejorDistancia = Number.POSITIVE_INFINITY;

    for (const grupo of grupos) {
      const d = distancia(cara.vector, grupo.centro);
      if (d < mejorDistancia) {
        mejorDistancia = d;
        mejorGrupo = grupo;
      }
    }

    // Para agrupar se usa el umbral estricto: **es preferible que una persona
    // aparezca dos veces en la grilla a que dos personas queden mezcladas** y
    // alguien vea las fotos de otro.
    if (mejorGrupo && mejorDistancia <= DISTANCIA_SEGURA) {
      mejorGrupo.miembros.push(cara);
    } else {
      grupos.push({ centro: cara.vector, miembros: [cara] });
    }
  }

  return grupos
    .filter((g) => g.miembros.length >= minimo)
    // Primero los que más aparecen: arriba de la grilla quedan los de la
    // fiesta, no el que pasó por el fondo.
    .sort((a, b) => b.miembros.length - a.miembros.length)
    .map((g, i) => ({
      id: `persona-${i + 1}`,
      representante: g.miembros[0],
      fotoIds: [...new Set(g.miembros.map((m) => m.fotoId))],
      apariciones: g.miembros.length,
    }));
}
