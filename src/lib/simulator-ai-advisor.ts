export interface SimulatorAdvisorPackage {
  id: string;
  name: string;
  description?: string;
  includedServices: string[];
  price?: number;
  recommended?: boolean;
}

export interface SimulatorAdvisorInput {
  question?: string;
  eventType?: string;
  guests: number;
  durationHours: number;
  hasVenue?: boolean | null;
  selectedPackageId?: string;
  selectedMenuItems?: string[];
  packages: SimulatorAdvisorPackage[];
}

export interface SimulatorAdvisorResult {
  response: string;
  recommendedPackageId?: string;
  rationale?: string;
  source: 'ai' | 'rules';
}

function choosePackage(input: SimulatorAdvisorInput): SimulatorAdvisorPackage | undefined {
  if (input.packages.length === 0) return undefined;

  const sortedByPrice = [...input.packages].sort((a, b) => {
    if (a.price === undefined && b.price === undefined) return 0;
    if (a.price === undefined) return 1;
    if (b.price === undefined) return -1;
    return a.price - b.price;
  });

  if (input.guests >= 120 || input.durationHours > 5) {
    return sortedByPrice[sortedByPrice.length - 1];
  }

  if (input.guests <= 45 && input.durationHours <= 4) {
    return sortedByPrice[0];
  }

  return input.packages.find((pkg) => pkg.recommended)
    || sortedByPrice[Math.floor((sortedByPrice.length - 1) / 2)];
}

export function buildSimulatorAdvisorFallback(input: SimulatorAdvisorInput): SimulatorAdvisorResult {
  const selected = input.packages.find((pkg) => pkg.id === input.selectedPackageId);
  const recommended = choosePackage(input);
  const question = input.question?.trim().toLowerCase() || '';

  if (question && /(incluye|incluyen|trae|servicios)/.test(question)) {
    const target = selected || recommended;
    if (!target) {
      return {
        response: 'Todavía no hay paquetes disponibles para comparar. Elegí el tipo de evento y volvé a consultarme.',
        source: 'rules',
      };
    }
    const included = target.includedServices.length > 0
      ? target.includedServices.join(', ')
      : 'las prestaciones configuradas por AK para este paquete';
    return {
      response: `${target.name} incluye ${included}. El precio que ves en pantalla se calcula con el catálogo real y la cantidad de invitados.`,
      recommendedPackageId: recommended?.id,
      rationale: recommended ? `Es la opción más equilibrada para ${input.guests} invitados y ${input.durationHours} horas.` : undefined,
      source: 'rules',
    };
  }

  if (!recommended) {
    return {
      response: 'Completá el tipo de evento y los paquetes disponibles para que pueda comparar una propuesta real.',
      source: 'rules',
    };
  }

  const venueNote = input.hasVenue === false
    ? 'También conviene incluir una opción de salón en la propuesta.'
    : input.hasVenue === true
      ? 'Como ya tenés salón, la inversión puede concentrarse en gastronomía y experiencia.'
      : 'Cuando definas el salón voy a poder afinar un poco más la propuesta.';
  const included = recommended.includedServices.slice(0, 4).join(', ');

  return {
    response: `Para ${input.eventType || 'tu evento'} de ${input.guests} personas, te recomiendo ${recommended.name}. ${venueNote}${included ? ` Sus puntos fuertes son: ${included}.` : ''}`,
    recommendedPackageId: recommended.id,
    rationale: input.guests >= 120 || input.durationHours > 5
      ? 'La escala del evento necesita una propuesta con mayor cobertura.'
      : input.guests <= 45 && input.durationHours <= 4
        ? 'El formato es compacto y no necesita pagar una estructura sobredimensionada.'
        : 'Equilibra cobertura, experiencia y presupuesto para la configuración elegida.',
    source: 'rules',
  };
}
