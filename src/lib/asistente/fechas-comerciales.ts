/**
 * @fileOverview Fechas comerciales y efemérides de Uruguay para anticipación proactiva.
 * Fijas y móviles con cálculo dinámico para el año corriente.
 */

export interface FechaComercialUruguay {
  id: string;
  nombre: string;
  descripcion: string;
  dia: number;
  mes: number; // 1-12
  esMovil?: boolean;
  calcularFecha?: (anio: number) => Date;
}

/**
 * Calcula el n-ésimo domingo de un mes dado para un año dado.
 */
function getNthSunday(anio: number, mesIndex0: number, n: number): Date {
  const date = new Date(anio, mesIndex0, 1);
  let sundaysFound = 0;
  while (date.getMonth() === mesIndex0) {
    if (date.getDay() === 0) {
      sundaysFound++;
      if (sundaysFound === n) {
        return new Date(date);
      }
    }
    date.setDate(date.getDate() + 1);
  }
  return new Date(anio, mesIndex0, 14); // Fallback aproximado
}

export const FECHAS_COMERCIALES_URUGUAY: FechaComercialUruguay[] = [
  {
    id: 'san-valentin',
    nombre: 'San Valentín / Día de los Enamorados',
    descripcion: 'Oportunidad de promociones románticas, bodas, aniversarios y cenas.',
    dia: 14,
    mes: 2,
  },
  {
    id: 'dia-de-la-madre',
    nombre: 'Día de la Madre',
    descripcion: 'Segundo domingo de mayo. Campaña de almuerzos, eventos familiares y agasajos.',
    dia: 10,
    mes: 5,
    esMovil: true,
    calcularFecha: (anio) => getNthSunday(anio, 4, 2),
  },
  {
    id: 'dia-del-padre',
    nombre: 'Día del Padre',
    descripcion: 'Segundo domingo de julio. Festejos y promociones.',
    dia: 12,
    mes: 7,
    esMovil: true,
    calcularFecha: (anio) => getNthSunday(anio, 6, 2),
  },
  {
    id: 'dia-del-nino',
    nombre: 'Día de la Niñez / Día del Niño',
    descripcion: 'Segundo domingo de agosto. Cumpleaños infantiles y animaciones.',
    dia: 9,
    mes: 8,
    esMovil: true,
    calcularFecha: (anio) => getNthSunday(anio, 7, 2),
  },
  {
    id: 'noche-de-la-nostalgia',
    nombre: 'Noche de la Nostalgia',
    descripcion: '24 de agosto. El evento nocturno bailable más grande de Uruguay.',
    dia: 24,
    mes: 8,
  },
  {
    id: 'primavera-quince',
    nombre: 'Llegada de la Primavera / Temporada Alta de 15',
    descripcion: '21 de septiembre. Explosión de fiestas de 15 años e inauguración de temporada de quintas.',
    dia: 21,
    mes: 9,
  },
  {
    id: 'halloween',
    nombre: 'Halloween',
    descripcion: '31 de octubre. Fiestas temáticas para adolescentes y jóvenes.',
    dia: 31,
    mes: 10,
  },
  {
    id: 'egresos-fin-de-cursos',
    nombre: 'Egresos escolares y liceales / Fin de cursos',
    descripcion: 'Cierre de ciclo educativo en noviembre y diciembre.',
    dia: 20,
    mes: 11,
  },
  {
    id: 'despedidas-empresas',
    nombre: 'Despedidas de fin de año de empresas',
    descripcion: 'Diciembre. Eventos corporativos, fiestas de empresas y agasajos de fin de año.',
    dia: 10,
    mes: 12,
  },
  {
    id: 'navidad-fin-de-anio',
    nombre: 'Navidad y Fin de Año',
    descripcion: '24 y 31 de diciembre. Fiestas de cierre de año.',
    dia: 25,
    mes: 12,
  },
];

export interface FechaProximaDetectada {
  fechaComercial: FechaComercialUruguay;
  fechaEvento: Date;
  diasFaltantes: number;
}

/**
 * Detecta fechas comerciales uruguayas que ocurrirán dentro de los próximos `diasVentana` días
 * (por defecto 28 días / 4 semanas).
 */
export function obtenerProximasFechasComerciales(
  fechaBase: Date = new Date(),
  diasVentana: number = 28
): FechaProximaDetectada[] {
  const anioActual = fechaBase.getFullYear();
  const resultados: FechaProximaDetectada[] = [];

  for (const anio of [anioActual, anioActual + 1]) {
    for (const fc of FECHAS_COMERCIALES_URUGUAY) {
      let fechaEv: Date;
      if (fc.esMovil && fc.calcularFecha) {
        fechaEv = fc.calcularFecha(anio);
      } else {
        fechaEv = new Date(anio, fc.mes - 1, fc.dia);
      }

      // Diferencia en días
      const diffMs = fechaEv.getTime() - fechaBase.getTime();
      const diasFaltantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diasFaltantes >= 0 && diasFaltantes <= diasVentana) {
        resultados.push({
          fechaComercial: fc,
          fechaEvento: fechaEv,
          diasFaltantes,
        });
      }
    }
  }

  return resultados.sort((a, b) => a.diasFaltantes - b.diasFaltantes);
}
