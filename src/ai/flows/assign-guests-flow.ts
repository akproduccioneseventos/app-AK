export interface AssignGuestsInput {
  fiestaId: string;
  invitados: Array<{ id: string; nombre: string; categoria?: string }>;
  mesas: Array<{ id: string; numero: string; capacidad: number }>;
}

export interface AssignGuestsOutput {
  asignaciones: Array<{ invitadoId: string; mesaId: string }>;
  sinMesa: Array<{ invitadoId: string; motivo: string }>;
  resumen: string;
}

export async function assignGuestsFlow(input: AssignGuestsInput): Promise<AssignGuestsOutput> {
  const mesas = [...input.mesas]
    .filter((mesa) => mesa.id && mesa.capacidad > 0)
    .map((mesa) => ({ ...mesa, ocupados: 0 }));

  const invitados = [...input.invitados].filter((invitado) => invitado.id);
  const asignaciones: AssignGuestsOutput['asignaciones'] = [];
  const sinMesa: AssignGuestsOutput['sinMesa'] = [];

  for (const invitado of invitados) {
    const preferred = mesas.find(
      (mesa) =>
        mesa.ocupados < mesa.capacidad &&
        invitado.categoria &&
        mesa.numero.toLowerCase().includes(invitado.categoria.toLowerCase())
    );
    const target = preferred || mesas.find((mesa) => mesa.ocupados < mesa.capacidad);

    if (!target) {
      sinMesa.push({ invitadoId: invitado.id, motivo: 'No quedan lugares disponibles en las mesas cargadas.' });
      continue;
    }

    target.ocupados += 1;
    asignaciones.push({ invitadoId: invitado.id, mesaId: target.id });
  }

  return {
    asignaciones,
    sinMesa,
    resumen:
      sinMesa.length === 0
        ? `Se asignaron ${asignaciones.length} invitados sin exceder capacidades.`
        : `Se asignaron ${asignaciones.length} invitados y quedaron ${sinMesa.length} sin mesa por falta de capacidad.`,
  };
}
