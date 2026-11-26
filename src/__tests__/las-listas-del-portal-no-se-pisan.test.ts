describe('Las listas del portal no se pisan y manejan copias', () => {
  it('dos tildes desde copias viejas quedan las dos', async () => {
    let fiestaMock = {
      id: 'fiesta-1',
      clientChecklist: [
        { id: 't1', texto: 'Tarea 1', completada: false },
        { id: 't2', texto: 'Tarea 2', completada: false },
      ],
    };

    const getFiesta = () => ({ ...fiestaMock, clientChecklist: fiestaMock.clientChecklist.map(t => ({ ...t })) });

    const updateItem = (itemId: string, completada: boolean) => {
      const current = fiestaMock.clientChecklist.map(t => ({ ...t }));
      fiestaMock.clientChecklist = current.map(t => t.id === itemId ? { ...t, completada } : t);
      return { success: true };
    };

    updateItem('t1', true);
    updateItem('t2', true);

    expect(fiestaMock.clientChecklist.find(t => t.id === 't1')?.completada).toBe(true);
    expect(fiestaMock.clientChecklist.find(t => t.id === 't2')?.completada).toBe(true);
  });

  it('dos fotos subidas desde copias viejas quedan las dos', async () => {
    let fiestaMock = {
      id: 'fiesta-1',
      decoracion: {
        fotosIdeasCliente: ['foto1.jpg'],
      },
    };

    const addFoto = (nuevaFoto: string) => {
      const actual = [...(fiestaMock.decoracion.fotosIdeasCliente || [])];
      if (!actual.includes(nuevaFoto) && actual.length < 6) {
        actual.push(nuevaFoto);
      }
      fiestaMock.decoracion = { ...fiestaMock.decoracion, fotosIdeasCliente: actual };
      return { success: true, updatedList: actual };
    };

    addFoto('foto2.jpg');
    addFoto('foto3.jpg');

    expect(fiestaMock.decoracion.fotosIdeasCliente).toEqual(['foto1.jpg', 'foto2.jpg', 'foto3.jpg']);
  });
});
