'use server';

import type { Invitado, LayoutElement } from '@/types/fiesta';

export async function autoAssignTables(
  invitados: Invitado[],
  tables: LayoutElement[]
): Promise<{ success: boolean; updatedInvitados: Invitado[]; logs: string[] }> {
  try {
    const logs: string[] = [];
    logs.push(`Iniciando IA Auto-Acomodador: ${invitados.length} invitados, ${tables.length} mesas.`);

    // 1. Clonar lista para no mutar original
    const newInvitados = [...invitados].map(i => ({ ...i }));
    
    // 2. Extraer mesas y su capacidad
    const availableTables = tables.filter(t => t.category?.toLowerCase().includes('mesa')).map(t => ({
      name: t.name,
      capacity: (t.width / 40) * 2 + (t.height / 40) * 2, // Estimación básica: perímetro. Asumimos maxCapacity viene en props o la calculamos
      seatsOccupied: 0,
      tags: new Set<string>()
    }));

    // Mejorar la capacidad: si el elemento tiene maxCapacity, usarlo, si no, asumir 8 o 10.
    // Como el tipo LayoutElement en este proyecto tiene width/height pero capaz no 'capacity' explicita, fijaremos 10 genéricamente
    const tableSeats = availableTables.map(t => ({
      ...t,
      capacity: 10 // Mock capacity for now
    }));

    // 3. Contar ocupación actual (para mantener a los que YA tienen mesa)
    newInvitados.forEach(inv => {
      if (inv.tableNumber) {
        const t = tableSeats.find(tbl => tbl.name === inv.tableNumber);
        if (t) {
          t.seatsOccupied += (inv.partySize || 1);
          if (inv.tag) t.tags.add(inv.tag);
        }
      }
    });

    // 4. Obtener los que NO tienen mesa, ordenados por grupo más grande primero para optimizar Tetris
    const unassigned = newInvitados
      .filter(i => !i.tableNumber && i.rsvp === 'Confirmado')
      .sort((a, b) => (b.partySize || 1) - (a.partySize || 1));

    logs.push(`${unassigned.length} invitados confirmados sin mesa.`);

    // 5. Algoritmo de asignación
    unassigned.forEach(inv => {
      const size = inv.partySize || 1;
      let assigned = false;

      // Intento A: Buscar mesa que ya tenga el mismo tag y tenga espacio
      if (inv.tag) {
        const tableWithTag = tableSeats.find(t => 
          t.tags.has(inv.tag!) && (t.capacity - t.seatsOccupied) >= size
        );
        if (tableWithTag) {
          inv.tableNumber = tableWithTag.name;
          tableWithTag.seatsOccupied += size;
          assigned = true;
          logs.push(`Asignado [${inv.nombre}] a ${tableWithTag.name} por afinidad (${inv.tag}).`);
        }
      }

      // Intento B: Si no se pudo por tag, buscar cualquier mesa vacía o con espacio suficiente
      if (!assigned) {
        // Preferir mesas completamente vacías primero para no mezclar si no es necesario, o las más llenas para compactar
        // Compactaremos: buscar la mesa con MENOS espacio disponible pero que igual entre
        const fitTables = tableSeats
          .filter(t => (t.capacity - t.seatsOccupied) >= size)
          .sort((a, b) => (a.capacity - a.seatsOccupied) - (b.capacity - b.seatsOccupied));

        if (fitTables.length > 0) {
          const chosen = fitTables[0];
          inv.tableNumber = chosen.name;
          chosen.seatsOccupied += size;
          if (inv.tag) chosen.tags.add(inv.tag);
          assigned = true;
          logs.push(`Asignado [${inv.nombre}] a ${chosen.name} por espacio.`);
        }
      }

      if (!assigned) {
        logs.push(`ATENCIÓN: No hay espacio en ninguna mesa para [${inv.nombre}] (grupo de ${size}).`);
      }
    });

    return { success: true, updatedInvitados: newInvitados, logs };
  } catch (error: any) {
    return { success: false, updatedInvitados: invitados, logs: [error.message] };
  }
}
