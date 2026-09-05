import {
  distancia,
  buscarFotosDeUnaCara,
  agruparEnPersonas,
  DISTANCIA_SEGURA,
  DISTANCIA_DUDOSA,
  type CaraEnFoto,
} from '@/lib/caras/agrupar-caras';

/**
 * Que la busqueda por cara encuentre lo de uno y NO lo de otro.
 *
 * Lo que se prueba es lo que decide si esto se puede usar en una fiesta de
 * quince: **que no le muestre a nadie las fotos de otra persona**. Un error de
 * mas -una foto ajena- es mucho peor que un error de menos.
 */

/** Una cara inventada: 128 numeros alrededor de una semilla. */
function caraDe(semilla: number, ruido = 0): number[] {
  return Array.from({ length: 128 }, (_, i) => semilla + Math.sin(i * semilla) * 0.01 + ruido);
}

const ANA = caraDe(1);
const BETO = caraDe(9); // bien distinto de Ana

describe('encontrar las fotos de una persona', () => {
  it('dos fotos de la misma persona se parecen, y dos personas distintas no', () => {
    expect(distancia(ANA, caraDe(1, 0.001))).toBeLessThan(DISTANCIA_SEGURA);
    expect(distancia(ANA, BETO)).toBeGreaterThan(DISTANCIA_DUDOSA);
  });

  it('devuelve las fotos de la persona y NINGUNA de otra', () => {
    const caras: CaraEnFoto[] = [
      { fotoId: 'f1', vector: caraDe(1, 0.001) },
      { fotoId: 'f2', vector: caraDe(1, 0.002) },
      { fotoId: 'f3', vector: BETO },
    ];
    const r = buscarFotosDeUnaCara([ANA], caras);
    expect(r.seguras).toEqual(['f1', 'f2']);
    // Lo que mas importa de toda la prueba: la foto de Beto no aparece por
    // ningun lado, ni siquiera entre las dudosas.
    expect(r.seguras).not.toContain('f3');
    expect(r.dudosas).not.toContain('f3');
  });

  it('lo que esta en el medio va al cajon de las dudosas, no al de las seguras', () => {
    // Una cara a media distancia: ni claramente ella, ni claramente otra.
    const enElMedio = ANA.map((v, i) => v + (i < 40 ? 0.09 : 0));
    const d = distancia(ANA, enElMedio);
    expect(d).toBeGreaterThan(DISTANCIA_SEGURA);
    expect(d).toBeLessThanOrEqual(DISTANCIA_DUDOSA);

    const r = buscarFotosDeUnaCara([ANA], [{ fotoId: 'f9', vector: enElMedio }]);
    expect(r.dudosas).toEqual(['f9']);
    expect(r.seguras).toEqual([]);
  });

  it('con varios cuadros de la cara encuentra lo que con uno solo se perdia', () => {
    // El caso real: la primera toma sale de costado y no alcanza; la segunda
    // sale de frente. Con una sola foto se perdia; con tres, no.
    const deCostado = ANA.map((v, i) => v + (i < 60 ? 0.09 : 0));
    const laFoto: CaraEnFoto[] = [{ fotoId: 'f1', vector: caraDe(1, 0.001) }];

    expect(buscarFotosDeUnaCara([deCostado], laFoto).seguras).toEqual([]);
    expect(buscarFotosDeUnaCara([deCostado, ANA], laFoto).seguras).toEqual(['f1']);
  });

  it('las mas parecidas se muestran primero', () => {
    const r = buscarFotosDeUnaCara([ANA], [
      { fotoId: 'lejos', vector: caraDe(1, 0.02) },
      { fotoId: 'cerca', vector: caraDe(1, 0.0001) },
    ]);
    expect(r.seguras[0]).toBe('cerca');
  });

  it('si los numeros no vienen, no inventa una coincidencia', () => {
    expect(distancia([], ANA)).toBe(Number.POSITIVE_INFINITY);
    expect(distancia([1, 2], ANA)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('la grilla de caras de la fiesta', () => {
  const caras: CaraEnFoto[] = [
    { fotoId: 'f1', vector: caraDe(1, 0.001), tamano: 0.9 },
    { fotoId: 'f2', vector: caraDe(1, 0.002), tamano: 0.5 },
    { fotoId: 'f3', vector: caraDe(1, 0.003), tamano: 0.4 },
    { fotoId: 'f4', vector: BETO, tamano: 0.8 },
    { fotoId: 'f5', vector: caraDe(9, 0.001), tamano: 0.3 },
    { fotoId: 'f6', vector: caraDe(5), tamano: 0.2 }, // uno que pasaba por atras
  ];

  it('junta a cada persona en un solo grupo', () => {
    const personas = agruparEnPersonas(caras);
    expect(personas).toHaveLength(2);
    expect(personas[0].fotoIds).toEqual(['f1', 'f2', 'f3']);
    expect(personas[1].fotoIds).toEqual(['f4', 'f5']);
  });

  it('el que aparece una sola vez no ensucia la grilla', () => {
    const personas = agruparEnPersonas(caras);
    expect(personas.flatMap((p) => p.fotoIds)).not.toContain('f6');
    // Pero si se pide, aparece: la regla es un ajuste, no algo clavado.
    expect(agruparEnPersonas(caras, { minimoDeApariciones: 1 })).toHaveLength(3);
  });

  it('para la grilla elige la cara mas grande, no una borrosa del fondo', () => {
    const personas = agruparEnPersonas(caras);
    expect(personas[0].representante.fotoId).toBe('f1');
  });

  it('primero los que mas aparecen', () => {
    const personas = agruparEnPersonas(caras);
    expect(personas[0].apariciones).toBeGreaterThanOrEqual(personas[1].apariciones);
  });

  it('NUNCA pone un nombre al lado de una cara', () => {
    // Esto encuentra fotos, no identifica personas. Si alguien agrega un campo
    // con el nombre del invitado, esto se pone en rojo.
    const personas = agruparEnPersonas(caras);
    for (const p of personas) {
      expect(p.id).toMatch(/^persona-\d+$/);
      expect(Object.keys(p)).toEqual(['id', 'representante', 'fotoIds', 'apariciones']);
    }
  });
});
