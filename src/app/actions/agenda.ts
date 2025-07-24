
'use server';

import { getFiestaActual, getHistorialFiestas } from './fiesta-actual';

export async function getOcupiedDates(): Promise<string[]> {
  try {
    const [fiestaActual, historialFiestas] = await Promise.all([
      getFiestaActual(),
      getHistorialFiestas(),
    ]);

    const occupiedDates: string[] = [];

    if (fiestaActual?.configuracion?.fechaEvento) {
      occupiedDates.push(new Date(fiestaActual.configuracion.fechaEvento).toISOString().split('T')[0]);
    }

    historialFiestas.forEach(fiesta => {
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
