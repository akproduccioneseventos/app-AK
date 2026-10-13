import type { CrmAppointment } from '@/types/crm';
import { getUruguayParts, hoyEnUruguay } from '@/lib/utils';

const dosDigitos = (n: number) => String(n).padStart(2, '0');

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
        // Una hora escrita SIN zona (ej. de un campo de fecha del formulario) es hora de Uruguay.
        const sinZona = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(cita.fechaHora.trim());
        const d = new Date(sinZona ? `${cita.fechaHora.trim()}-03:00` : cita.fechaHora);
        if (!isNaN(d.getTime())) {
          // Se guarda en hora de Uruguay (YYYY-MM-DDTHH:mm): el servidor corre en hora de Greenwich.
          const p = getUruguayParts(d);
          slotsOcupados.add(`${p.year}-${dosDigitos(p.month)}-${dosDigitos(p.day)}T${dosDigitos(p.hour % 24)}:${dosDigitos(p.minute)}`);
        }
      } catch {
        // Ignorar citas con fecha corrupta
      }
    }
  }

  const ahora = fechaBase.getTime();

  // El "hoy" y el día de la semana son los de Uruguay, no los del servidor.
  const [anioHoy, mesHoy, diaHoy] = hoyEnUruguay(fechaBase).split('-').map(Number);

  for (let i = 0; i <= diasHaciaAdelante; i++) {
    const diaCursor = new Date(Date.UTC(anioHoy, mesHoy - 1, diaHoy + i));

    const diaSemana = diaCursor.getUTCDay();
    const franjas = HORARIOS_POR_DIA[diaSemana];

    if (!franjas || franjas.length === 0) {
      continue; // Domingo o Lunes
    }

    const anio = diaCursor.getUTCFullYear();
    const mes = diaCursor.getUTCMonth();
    const diaMes = diaCursor.getUTCDate();
    const dateStr = `${anio}-${dosDigitos(mes + 1)}-${dosDigitos(diaMes)}`;

    const slotsDelDia: TimeSlot[] = [];

    for (const horaStr of franjas) {
      const [hh, mm] = horaStr.split(':').map(Number);
      // Uruguay es UTC-3 todo el año (sin horario de verano): 10:00 de Uruguay son las 13:00 UTC.
      const slotDate = new Date(`${dateStr}T${dosDigitos(hh)}:${dosDigitos(mm)}:00-03:00`);

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
