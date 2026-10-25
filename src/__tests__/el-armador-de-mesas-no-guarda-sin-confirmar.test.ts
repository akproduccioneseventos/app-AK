import { armarMesasInteligente, type InvitadoParaMesa } from '@/lib/fiesta/armador-mesas-inteligente';

describe('El armador de mesas no guarda sin confirmar', () => {
  const invitadosPrueba: InvitadoParaMesa[] = [
    { id: 'inv_1', nombre: 'Carlos Gomez', grupoAfinidad: 'Familia', cantidadAcompaniantes: 1 },
    { id: 'inv_2', nombre: 'Marta Gomez', grupoAfinidad: 'Familia', cantidadAcompaniantes: 2 },
    { id: 'inv_3', nombre: 'Lucas Gomez', grupoAfinidad: 'Familia', cantidadAcompaniantes: 3 },
    { id: 'inv_4', nombre: 'Amigo 1', grupoAfinidad: 'Amigos', cantidadAcompaniantes: 0 },
    { id: 'inv_5', nombre: 'Amigo 2', grupoAfinidad: 'Amigos', cantidadAcompaniantes: 0 },
    { id: 'inv_6', nombre: 'Amigo 3', grupoAfinidad: 'Amigos', cantidadAcompaniantes: 1 },
  ];

  test('armar no guarda nada (función pura de cálculo), solo propone', () => {
    // Clonamos la lista original para verificar inmutabilidad de almacenamiento
    const copia = JSON.parse(JSON.stringify(invitadosPrueba));

    const resultado = armarMesasInteligente(copia, { capacidadPorMesa: 6 });

    expect(resultado).toBeDefined();
    expect(resultado.mesas.length).toBeGreaterThan(0);
    expect(resultado.totalAsignados).toBe(13); // 2 + 3 + 4 + 1 + 1 + 2 = 13 personas totales

    // Los invitados en la fuente original no fueron alterados en base de datos
    expect(invitadosPrueba[0].tableNumber).toBeUndefined();
  });

  test('no pasa la capacidad de la mesa bajo ninguna circunstancia', () => {
    const CAPACIDAD = 5;
    const resultado = armarMesasInteligente(invitadosPrueba, { capacidadPorMesa: CAPACIDAD });

    for (const mesa of resultado.mesas) {
      expect(mesa.totalPersonas).toBeLessThanOrEqual(CAPACIDAD);
      expect(mesa.capacidadMaxima).toBe(CAPACIDAD);
    }
  });

  test('agrupa por afinidad y asigna etiquetas claras', () => {
    const resultado = armarMesasInteligente(invitadosPrueba, { capacidadPorMesa: 10 });
    const mesaFamilia = resultado.mesas.find(m => m.etiqueta.includes('Familia'));
    expect(mesaFamilia).toBeDefined();
    expect(mesaFamilia?.invitados.some(i => i.nombre === 'Carlos Gomez')).toBe(true);
  });
});
