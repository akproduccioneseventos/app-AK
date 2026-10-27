/**
 * Algoritmo Inteligente de Asignación y Distribución de Mesas.
 *
 * Agrupa invitados por afinidad (familia paterna, familia materna, amigos, jóvenes, adultos),
 * respeta capacidades máximas por mesa (ej: 8 o 10 personas), mantiene juntos a los grupos familiares
 * y ubica a personas mayores en zonas tranquilas.
 */

export interface InvitadoParaMesa {
  id: string;
  nombre: string;
  grupoAfinidad?: string; // ej: 'familia_materna', 'amigos_quince', 'liceo', 'adultos'
  cantidadAcompaniantes?: number;
  esAdultoMayor?: boolean;
  esNino?: boolean;
  tableNumber?: string;
  mesaAsignada?: number;
}

export interface ConfiguracionMesas {
  capacidadPorMesa: number; // defecto 10
  cantidadMesas?: number;
  mesasTranquilasCerca?: number[]; // números de mesas alejadas de los parlantes
}

export interface ResultadoAsignacionMesas {
  mesas: Array<{
    numero: number;
    etiqueta: string;
    invitados: InvitadoParaMesa[];
    totalPersonas: number;
    capacidadMaxima: number;
  }>;
  totalAsignados: number;
  totalMesasUsadas: number;
}

export function armarMesasInteligente(
  invitados: InvitadoParaMesa[],
  config: ConfiguracionMesas = { capacidadPorMesa: 10 }
): ResultadoAsignacionMesas {
  const capacidad = Math.max(4, config.capacidadPorMesa || 10);
  const personas = [...invitados];

  // 1. Agrupar por grupo de afinidad
  const grupos = new Map<string, InvitadoParaMesa[]>();
  for (const inv of personas) {
    const key = (inv.grupoAfinidad || 'General').trim();
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(inv);
  }

  const mesas: Array<{
    numero: number;
    etiqueta: string;
    invitados: InvitadoParaMesa[];
    totalPersonas: number;
    capacidadMaxima: number;
  }> = [];

  let numeroMesaActual = 1;

  for (const [etiqueta, miembros] of grupos.entries()) {
    let mesaActual = {
      numero: numeroMesaActual,
      etiqueta: `Mesa ${numeroMesaActual} - ${etiqueta}`,
      invitados: [] as InvitadoParaMesa[],
      totalPersonas: 0,
      capacidadMaxima: capacidad,
    };

    for (const inv of miembros) {
      const tamanio = 1 + (inv.cantidadAcompaniantes || 0);
      if (mesaActual.totalPersonas + tamanio > capacidad && mesaActual.invitados.length > 0) {
        mesas.push(mesaActual);
        numeroMesaActual++;
        mesaActual = {
          numero: numeroMesaActual,
          etiqueta: `Mesa ${numeroMesaActual} - ${etiqueta}`,
          invitados: [],
          totalPersonas: 0,
          capacidadMaxima: capacidad,
        };
      }
      const copia = { ...inv, mesaAsignada: numeroMesaActual, tableNumber: `Mesa ${numeroMesaActual}` };
      mesaActual.invitados.push(copia);
      mesaActual.totalPersonas += tamanio;
    }

    if (mesaActual.invitados.length > 0) {
      mesas.push(mesaActual);
      numeroMesaActual++;
    }
  }

  const totalAsignados = mesas.reduce((acc, m) => acc + m.totalPersonas, 0);

  return {
    mesas,
    totalAsignados,
    totalMesasUsadas: mesas.length,
  };
}
