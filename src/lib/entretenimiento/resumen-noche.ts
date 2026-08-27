/**
 * Generador automático del resumen de entretenimiento de la noche (Bloque 10).
 *
 * Consolida cuántas capturas hizo cada estación, cuál fue la más usada,
 * y en qué horario se produjo el pico de la fiesta, listo para presentar al cliente.
 */

export interface CapturaRegistrada {
  id: string;
  estacionId: string;
  estacionNombre?: string;
  timestamp: string; // ISO string
  guestId?: string;
  formato?: 'foto' | 'gif' | 'video' | 'boomerang' | 'avatar_ia';
}

export interface ResumenNocheEntretenimiento {
  totalCapturas: number;
  estacionMasUsada: {
    id: string;
    nombre: string;
    total: number;
  };
  picoHorario: {
    hora: string; // ej: "02:00 - 03:00"
    capturas: number;
  };
  desglosePorEstacion: Array<{
    id: string;
    nombre: string;
    total: number;
    porcentaje: number;
  }>;
  invitadosParticipantes: number;
  textoParaCliente: string;
}

const NOMBRES_ESTACIONES: Record<string, string> = {
  fotocabina: 'Fotocabina',
  plataforma360: 'Plataforma 360',
  bogue: 'Bogue Boomerang',
  espejoMagicoFoto: 'Espejo Mágico (Foto)',
  espejoMagicoFirma: 'Espejo Mágico (Firma)',
  espejoMagicoIA: 'Espejo Mágico IA',
  totems: 'Tótems Interactivos',
  capsulaTiempo: 'Cápsula del Tiempo',
};

export function calcularResumenNoche(
  capturas: CapturaRegistrada[],
  nombreEvento: string = 'Evento'
): ResumenNocheEntretenimiento {
  if (!capturas || capturas.length === 0) {
    return {
      totalCapturas: 0,
      estacionMasUsada: { id: '', nombre: 'Sin registros', total: 0 },
      picoHorario: { hora: 'Sin datos', capturas: 0 },
      desglosePorEstacion: [],
      invitadosParticipantes: 0,
      textoParaCliente: `En ${nombreEvento} las estaciones están listas para comenzar a capturar recuerdos.`,
    };
  }

  const conteoPorEstacion: Record<string, number> = {};
  const conteoPorHora: Record<string, number> = {};
  const invitadosUnicos = new Set<string>();

  for (const cap of capturas) {
    // Por estación
    const estId = cap.estacionId || 'desconocida';
    conteoPorEstacion[estId] = (conteoPorEstacion[estId] || 0) + 1;

    // Por hora
    const fecha = new Date(cap.timestamp);
    if (!isNaN(fecha.getTime())) {
      const horaStr = `${String(fecha.getHours()).padStart(2, '0')}:00`;
      conteoPorHora[horaStr] = (conteoPorHora[horaStr] || 0) + 1;
    }

    if (cap.guestId) {
      invitadosUnicos.add(cap.guestId);
    }
  }

  const total = capturas.length;

  // Desglose
  const desglose = Object.entries(conteoPorEstacion).map(([id, cant]) => ({
    id,
    nombre: NOMBRES_ESTACIONES[id] || id,
    total: cant,
    porcentaje: Math.round((cant / total) * 100),
  })).sort((a, b) => b.total - a.total);

  const masUsada = desglose[0] || { id: '', nombre: 'Sin datos', total: 0 };

  // Pico horario
  let maxHora = '00:00';
  let maxEnHora = 0;
  for (const [hora, cant] of Object.entries(conteoPorHora)) {
    if (cant > maxEnHora) {
      maxEnHora = cant;
      maxHora = hora;
    }
  }

  const horaFin = `${String((parseInt(maxHora.split(':')[0], 10) + 1) % 24).padStart(2, '0')}:00`;
  const rangoPico = maxEnHora > 0 ? `${maxHora} - ${horaFin}` : 'Sin datos';

  const textoCliente = `¡Gran fiesta en ${nombreEvento}! Se registraron ${total} recuerdos en vivo. La estación favorita fue ${masUsada.nombre} con ${masUsada.total} capturas, y el pico de mayor diversión ocurrió entre ${rangoPico}.`;

  return {
    totalCapturas: total,
    estacionMasUsada: {
      id: masUsada.id,
      nombre: masUsada.nombre,
      total: masUsada.total,
    },
    picoHorario: {
      hora: rangoPico,
      capturas: maxEnHora,
    },
    desglosePorEstacion: desglose,
    invitadosParticipantes: invitadosUnicos.size,
    textoParaCliente: textoCliente,
  };
}
