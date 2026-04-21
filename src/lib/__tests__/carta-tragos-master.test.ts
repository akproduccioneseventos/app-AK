import type { Trago } from '@/types/fiesta';
import { mergeMasterTragosWithFiesta } from '../carta-tragos-master';

describe('mergeMasterTragosWithFiesta', () => {
  it('preserves fiesta custom fields while keeping the master base list', () => {
    const master: Trago[] = [
      { id: 'a', nombre: 'Caipi', ingredientes: ['Cachaça'], stockDisponible: 10 },
      { id: 'b', nombre: 'Fernet', ingredientes: ['Fernet'], stockDisponible: 8 },
    ];
    const fiesta: Trago[] = [
      { id: 'a', nombre: 'Caipi Premium', ingredientes: ['Cachaça', 'Lima'], stockDisponible: 20 },
    ];

    expect(mergeMasterTragosWithFiesta(master, fiesta)).toEqual([
      { id: 'a', nombre: 'Caipi Premium', ingredientes: ['Cachaça', 'Lima'], stockDisponible: 20 },
      { id: 'b', nombre: 'Fernet', ingredientes: ['Fernet'], stockDisponible: 8 },
    ]);
  });
});

