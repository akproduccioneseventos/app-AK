import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';

export interface ConciergeQuestion {
  fiestaId: string;
  question: string;
  guestId?: string;
}

export interface ConciergeAnswer {
  answer: string;
  dataPoints?: { label: string; value: string }[];
  suggestedFollowUps?: string[];
}

export const QUICK_SUGGESTIONS = [
  '¿A qué hora empieza?',
  '¿Dónde es la fiesta?',
  '¿Qué menú se servirá?',
  '¿Cuál es el programa?',
];

function listDefined(values: Array<string | undefined>): string {
  return values.map((value) => value?.trim()).filter(Boolean).join(', ');
}

export function buildConciergeContext(fiesta: PublicGuestEvent): string {
  return `Fiesta: ${fiesta.configuracion?.nombreEvento || 'Sin nombre'}, Lugar: ${fiesta.configuracion?.nombreLugar || 'A definir'}, Fecha: ${fiesta.configuracion?.fechaEvento || 'A definir'}, Hora: ${fiesta.configuracion?.horaInicio || 'A definir'}`;
}

export function answerConciergeQuestion(fiesta: PublicGuestEvent, question: string): ConciergeAnswer {
  const q = question.toLowerCase();

  if (
    q.includes('pagar') || q.includes('saldo') || q.includes('deuda') ||
    q.includes('pagos') || q.includes('invitados') || q.includes('confirmados')
  ) {
    return {
      answer: 'Esa información es privada de la organización. Puedo ayudarte con el horario, el lugar, el menú o el programa del evento.',
      suggestedFollowUps: QUICK_SUGGESTIONS.slice(0, 3),
    };
  }

  if (q.includes('itinerario') || q.includes('programa') || q.includes('mesa dulce')) {
    const program = fiesta.programa || [];
    if (program.length === 0) return { answer: 'El programa todavía no fue publicado.' };

    const requestedItem = q.includes('mesa dulce')
      ? program.find((item) => item.titulo.toLowerCase().includes('mesa dulce'))
      : undefined;
    if (requestedItem) {
      return { answer: `${requestedItem.titulo} está prevista para las ${requestedItem.hora}.` };
    }
    return {
      answer: program.map((item) => `${item.hora}: ${item.titulo}`).join(' · '),
      suggestedFollowUps: ['¿Dónde es la fiesta?'],
    };
  }

  if (q.includes('hora') || q.includes('empieza') || q.includes('comienza')) {
    const hora = fiesta.configuracion?.horaInicio || 'a definir';
    return {
      answer: `El evento comienza a las ${hora}.`,
      suggestedFollowUps: ['¿Dónde es la fiesta?', '¿Cuál es el programa?'],
    };
  }

  if (q.includes('menu') || q.includes('menú') || q.includes('comida')) {
    const menu = fiesta.menuSeleccionPortal;
    const legacyMenu = fiesta.menuMesa;
    const description = listDefined([
      menu?.entrada || legacyMenu?.entrada,
      menu?.principal || legacyMenu?.platoPrincipal,
      menu?.postre || legacyMenu?.postres,
      menu?.bebidas || legacyMenu?.bebidas,
    ]);
    return {
      answer: description ? `El menú publicado incluye: ${description}.` : 'El menú todavía no fue publicado.',
    };
  }

  if (
    q.includes('lugar') || q.includes('salon') || q.includes('salón') ||
    q.includes('direccion') || q.includes('dirección') || q.includes('donde') || q.includes('dónde')
  ) {
    const lugar = fiesta.configuracion?.nombreLugar || 'A definir';
    const direccion = fiesta.configuracion?.direccionLugar;
    return {
      answer: `La fiesta se realizará en ${lugar}${direccion ? `, ${direccion}` : ''}.`,
    };
  }

  return {
    answer: 'Puedo ayudarte con el horario, el lugar, el menú y el programa publicado del evento.',
    suggestedFollowUps: QUICK_SUGGESTIONS.slice(0, 3),
  };
}
