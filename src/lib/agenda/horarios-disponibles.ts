import type { CrmAppointment } from '@/types/crm';

export interface TimeSlot {
  time: string; // "10:00", "11:00", etc.
  datetimeIso: string; // ISO string for the specific slot
  label: string; // "10:00 hs"
}

export interface DayAvailableSlots {
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Martes", "Miércoles", etc.
  formattedDate: string; // "Martes 18 de agosto"
  slots: TimeSlot[];
}

// Horarios de atención comercial estándar de AK Producciones:
// Martes a Viernes: 10:00, 11:00, 16:00, 17:00, 18:00
// Sábados: 10:00, 11:00, 12:00
// Domingo y Lunes: Cerrado / Descanso técnico
const HORARIOS_POR_DIA: Record<number, string[]> = {
  2: ['10:00', '11:00', '16:00', '17:00', '18:00'], // Martes
  3: ['10:00', '11:00', '16:00', '17:00', '18:00'], // Miércoles
  4: ['10:00', '11:00', '16:00', '17:00', '18:00'], // Jueves
  5: ['10:00', '11:00', '16:00', '17:00', '18:00'], // Viernes
  6: ['10:00', '11:00', '12:00'],                   // Sábado
};

const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const NOMBRES_MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Calcula los días y horarios disponibles para citas presenciales o virtuales en AK.
 * Excluye automáticamente domingos, lunes, horas pasadas y citas ya reservadas.
 */
export function calcularHorariosDisponibles(
  citasExistentes: CrmAppointment[],
  diasHaciaAdelante = 14,
  fechaBase = new Date()
): DayAvailableSlots[] {
  const resultado: DayAvailableSlots[] = [];

  // Conjunto de fechas/horas ISO ocupadas (redondeadas al minuto)
  const slotsOcupados = new Set<string>();
  for (const cita of citasExistentes) {
    if (cita.estado !== 'Cancelada' && cita.fechaHora) {
      try {
        const d = new Date(cita.fechaHora);
        if (!isNaN(d.getTime())) {
          // Guardamos en formato YYYY-MM-DDTHH:mm
          const isoKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          slotsOcupados.add(isoKey);
        }
      } catch {
        // Ignorar citas con fecha corrupta
      }
    }
  }

  const ahora = fechaBase.getTime();

  for (let i = 0; i <= diasHaciaAdelante; i++) {
    const diaCursor = new Date(fechaBase);
    diaCursor.setDate(fechaBase.getDate() + i);

    const diaSemana = diaCursor.getDay();
    const franjas = HORARIOS_POR_DIA[diaSemana];

    if (!franjas || franjas.length === 0) {
      continue; // Domingo o Lunes
    }

    const anio = diaCursor.getFullYear();
    const mes = diaCursor.getMonth();
    const diaMes = diaCursor.getDate();
    const dateStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(diaMes).padStart(2, '0')}`;

    const slotsDelDia: TimeSlot[] = [];

    for (const horaStr of franjas) {
      const [hh, mm] = horaStr.split(':').map(Number);
      const slotDate = new Date(anio, mes, diaMes, hh, mm, 0, 0);

      // Si el slot ya pasó, no se ofrece
      if (slotDate.getTime() <= ahora) {
        continue;
      }

      const isoKey = `${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      if (!slotsOcupados.has(isoKey)) {
        slotsDelDia.push({
          time: horaStr,
          datetimeIso: slotDate.toISOString(),
          label: `${horaStr} hs`,
        });
      }
    }

    if (slotsDelDia.length > 0) {
      resultado.push({
        date: dateStr,
        dayName: NOMBRES_DIAS[diaSemana],
        formattedDate: `${NOMBRES_DIAS[diaSemana]} ${diaMes} de ${NOMBRES_MESES[mes]}`,
        slots: slotsDelDia,
      });
    }

    // Limitamos a los primeros 6 días disponibles para no abrumar al cliente
    if (resultado.length >= 6) {
      break;
    }
  }

  return resultado;
}
