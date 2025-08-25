
'use server';

import { getFiestas } from './fiesta-actual';

export async function getOcupiedDates(): Promise<string[]> {
  try {
    const fiestas = await getFiestas();
    const occupiedDates: string[] = [];

    fiestas.forEach(fiesta => {
      if (fiesta.configuracion.fechaEvento) {
        occupiedDates.push(new Date(fiesta.configuracion.fechaEvento).toISOString().split('T')[0]);
      }
    });
    
    // Return unique dates
    return [...new Set(occupiedDates)];
  } catch (error) {
    console.error("Error fetching occupied dates:", error);
    return [];
  }
}
