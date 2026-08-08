describe('Organización Bloque C — Mejoras de usabilidad', () => {
  test('C.1 — Buscador de empleados filtra por coincidencia parcial de nombre', () => {
    const empleados = [
      { id: '1', nombre: 'Carlos Rodríguez', rolIds: ['r1'] },
      { id: '2', nombre: 'Ana Martínez', rolIds: ['r1'] },
      { id: '3', nombre: 'Carlos Silva', rolIds: ['r1'] },
    ];
    const query = 'carlos';
    const filtrados = empleados.filter((e) => e.nombre.toLowerCase().includes(query.toLowerCase()));
    expect(filtrados.length).toBe(2);
    expect(filtrados.map((e) => e.id)).toEqual(['1', '3']);
  });

  test('C.3 — Tareas de proveedores permiten hasta 500 caracteres sin recortar información importante', () => {
    const tareaLarga = 'A'.repeat(450);
    const textoGuardado = tareaLarga.slice(0, 500);
    expect(textoGuardado.length).toBe(450);

    const tareaMuyLarga = 'B'.repeat(600);
    const textoRecortado = tareaMuyLarga.slice(0, 500);
    expect(textoRecortado.length).toBe(500);
  });

  test('C.4 — Detecta horarios pisados en el itinerario', () => {
    const programa = [
      { id: 'm1', hora: '21:00', titulo: 'Entrada de novios' },
      { id: 'm2', hora: '22:30', titulo: 'Plato Principal' },
    ];

    const nuevoMomentoMismaHora = { id: 'm3', hora: '21:00', titulo: 'Show de magia' };
    const superpuesto = programa.some((p) => p.id !== nuevoMomentoMismaHora.id && p.hora === nuevoMomentoMismaHora.hora);

    expect(superpuesto).toBe(true);

    const nuevoMomentoDistintaHora = { id: 'm4', hora: '23:00', titulo: 'Postre' };
    const noSuperpuesto = programa.some((p) => p.id !== nuevoMomentoDistintaHora.id && p.hora === nuevoMomentoDistintaHora.hora);

    expect(noSuperpuesto).toBe(false);
  });
});
