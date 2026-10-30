import { crearObservacionesPosfiesta, invitadosAsistentesReales, normalizarEntradaObservacion, sugerenciasPosfiesta } from './sugerencias-posfiesta';

describe('observaciones y sugerencias posfiesta', () => {
  const fiesta = {
    id: 'fiesta-1',
    configuracion: { fechaEvento: '2026-10-01', tipoCelebracion: 'boda', invitadosEstimados: 150 },
    invitados: [{ partySize: 3, checkedIn: true }, { partySize: 2, checkedIn: true }, { partySize: 4 }],
  };

  it('registra hechos acotados con personas reales; no convierte ausencia en cero', () => {
    const hechos = crearObservacionesPosfiesta(fiesta, [
      { categoria: 'bebida', tipo: 'sobro', elemento: 'vino', cantidad: 2, unidad: 'cajas' },
    ], '2026-10-02T12:00:00.000Z');
    expect(hechos[0]).toMatchObject({ id: 'fiesta-1:2026-10-01:bebida%3Asobro%3Avino%3Acajas', invitadosReales: 5, cantidad: 2 });
    expect(crearObservacionesPosfiesta({ ...fiesta, invitados: [] }, [
      { categoria: 'comida', tipo: 'falto', elemento: 'pan', cantidad: 1, unidad: 'caja' },
    ], 'x')[0].invitadosReales).toBeNull();
  });

  it('rechaza importes, PII sospechosa y cantidades cero o inválidas', () => {
    expect(normalizarEntradaObservacion(null)).toBeNull();
    expect(normalizarEntradaObservacion([])).toBeNull();
    expect(normalizarEntradaObservacion({ categoria: 'comida', tipo: 'sobro', elemento: 'carne', cantidad: 0, unidad: 'kg' })).toBeNull();
    expect(normalizarEntradaObservacion({ categoria: 'comida', tipo: 'sobro', elemento: 'persona@correo.com', cantidad: 1, unidad: 'kg' })).toBeNull();
    expect(normalizarEntradaObservacion({ categoria: 'comida', tipo: 'sobro', elemento: 'carne', cantidad: 1.5, unidad: 'kg' })).toMatchObject({ cantidad: 1.5 });
  });

  it('admite fracciones de comida/bebida y exige cantidades enteras para personal', () => {
    expect(normalizarEntradaObservacion({ categoria: 'comida', tipo: 'sobro', elemento: 'harina', cantidad: 0.5, unidad: 'kg' })).toMatchObject({ cantidad: 0.5, unidad: 'kg' });
    expect(normalizarEntradaObservacion({ categoria: 'bebida', tipo: 'falto', elemento: 'vino', cantidad: 0.25, unidad: 'litros' })).toMatchObject({ cantidad: 0.25 });
    expect(normalizarEntradaObservacion({ categoria: 'comida', tipo: 'sobro', elemento: 'harina', cantidad: 2.53, unidad: 'kg' })).toMatchObject({ cantidad: 2.53 });
    expect(normalizarEntradaObservacion({ categoria: 'comida', tipo: 'sobro', elemento: 'harina', cantidad: 1.234, unidad: 'kg' })).toBeNull();
    expect(normalizarEntradaObservacion({ categoria: 'personal', tipo: 'falto', elemento: 'mozos', cantidad: 0.5, unidad: 'personas' })).toBeNull();
  });

  it('cuenta personas (partySize) sin truncar grupos y no inventa asistencia', () => {
    expect(invitadosAsistentesReales([{ checkedIn: true, partySize: 4 }, { checkin: true, partySize: 1000 }])).toBe(1004);
    expect(invitadosAsistentesReales([{ partySize: 10 }])).toBeNull();
    expect(invitadosAsistentesReales([{ checkedIn: true, partySize: 1000.5 }])).toBeNull();
  });

  it('sugiere solo hechos del mismo tipo con invitados reales y muestra diferencia', () => {
    const hechos = crearObservacionesPosfiesta(fiesta, [
      { categoria: 'bebida', tipo: 'sobro', elemento: 'vino', cantidad: 2, unidad: 'cajas' },
    ], 'x');
    expect(sugerenciasPosfiesta(hechos, { fiestaId: 'futura', tipoEvento: 'BODA', invitadosReales: 120 })).toMatchObject([
      { diferenciaInvitados: 115, requiereRevision: true, procedencia: 'Observación registrada en fiesta fiesta-1, 2026-10-01' },
    ]);
    expect(sugerenciasPosfiesta(hechos, { fiestaId: 'futura', tipoEvento: 'cumpleanos', invitadosReales: 120 })).toEqual([]);
    expect(sugerenciasPosfiesta(hechos, { fiestaId: 'futura', tipoEvento: 'boda' })).toEqual([]);
  });

  it('usa invitados estimados explícitamente y limita a cinco fiestas más cercanas', () => {
    const hechos = Array.from({ length: 8 }, (_, indice) => ({
      id: `f${indice}`, fiestaId: `f${indice}`, fechaEvento: `2026-10-${String(indice + 1).padStart(2, '0')}`,
      tipoEvento: 'boda', invitadosReales: null, invitadosEstimados: 100 + indice * 10,
      categoria: 'comida' as const, tipo: 'falto' as const, elemento: 'postre', cantidad: 1, unidad: 'bandeja', actualizadoEn: 'x',
    }));
    const resultado = sugerenciasPosfiesta(hechos, { fiestaId: 'nueva', tipoEvento: 'boda', invitadosEstimados: 132 });
    expect(resultado).toHaveLength(5);
    expect(resultado[0]).toMatchObject({ invitadosActuales: 132, baseInvitadosActuales: 'estimados', invitadosReferencia: 130, baseInvitados: 'estimados' });
  });
});
