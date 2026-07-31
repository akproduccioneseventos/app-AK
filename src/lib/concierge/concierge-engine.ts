import { FiestaEnPlanificacion } from '@/types/fiesta';

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
  '¿Cuántos invitados confirmaron?',
  '¿Cuánto falta pagar?',
  '¿A qué hora es la mesa dulce?',
  '¿Qué menú se eligió?',
  '¿Cuántos vegetarianos hay?',
  '¿Dónde es la fiesta?'
];

export function buildConciergeContext(fiesta: FiestaEnPlanificacion): string {
  const totalInvitados = fiesta.invitados?.length || 0;
  const confirmados = fiesta.invitados?.filter(i => i.rsvp === 'confirmado').length || 0;
  return `Fiesta: ${fiesta.configuracion?.nombre || 'Sin nombre'}, Lugar: ${fiesta.configuracion?.nombreLugar || 'A definir'}, Fecha: ${fiesta.configuracion?.fecha || 'A definir'}, Invitados: ${confirmados}/${totalInvitados}`;
}

export function answerConciergeQuestion(fiesta: FiestaEnPlanificacion, question: string): ConciergeAnswer {
  const q = question.toLowerCase();

  if (q.includes('invitados') || q.includes('confirmados') || q.includes('cuántos') || q.includes('cuantos')) {
    const total = fiesta.invitados?.length || 0;
    const confirmados = fiesta.invitados?.filter(i => i.rsvp === 'confirmado').length || 0;
    const pendientes = fiesta.invitados?.filter(i => i.rsvp === 'pendiente').length || 0;
    const rechazados = fiesta.invitados?.filter(i => i.rsvp === 'rechazado').length || 0;
    return {
      answer: `Tienen ${confirmados} invitados confirmados de un total de ${total}.`,
      dataPoints: [
        { label: 'Total', value: total.toString() },
        { label: 'Confirmados', value: confirmados.toString() },
        { label: 'Pendientes', value: pendientes.toString() },
        { label: 'Rechazados', value: rechazados.toString() }
      ],
      suggestedFollowUps: ['¿Cuántos vegetarianos hay?']
    };
  }

  if (q.includes('pagar') || q.includes('saldo') || q.includes('deuda') || q.includes('pagos')) {
    const pagos = fiesta.pagos || [];
    const totalPagado = pagos.reduce((acc, curr) => acc + curr.monto, 0);
    return {
      answer: `Han pagado un total de $${totalPagado}.`,
      suggestedFollowUps: ['¿Cuándo es el próximo pago?']
    };
  }

  if (q.includes('hora') || q.includes('itinerario') || q.includes('mesa dulce')) {
    return {
      answer: 'El itinerario detallado se puede ver en la sección de Programa del Evento.',
      suggestedFollowUps: ['¿Dónde es la fiesta?']
    };
  }

  if (q.includes('menu') || q.includes('menú')) {
    return {
      answer: 'El menú elegido está configurado en la sección de Catering.',
      suggestedFollowUps: ['¿Cuántos vegetarianos hay?']
    };
  }

  if (q.includes('vegetariano') || q.includes('celiaco') || q.includes('dieta')) {
    const veggies = fiesta.invitados?.filter(i => i.dietaryRestriction?.toLowerCase().includes('vegetariano')).length || 0;
    const celiacos = fiesta.invitados?.filter(i => i.dietaryRestriction?.toLowerCase().includes('celiaco')).length || 0;
    return {
      answer: `Tienen ${veggies} vegetarianos y ${celiacos} celíacos.`,
      dataPoints: [
        { label: 'Vegetarianos', value: veggies.toString() },
        { label: 'Celíacos', value: celiacos.toString() }
      ]
    };
  }

  if (q.includes('lugar') || q.includes('salon') || q.includes('dirección') || q.includes('donde') || q.includes('dónde')) {
    const lugar = fiesta.configuracion?.nombreLugar || 'A definir';
    return {
      answer: `La fiesta se realizará en ${lugar}.`
    };
  }

  return {
    answer: 'No estoy seguro, pero puedes revisar las diferentes secciones de la planificación para encontrar la respuesta.',
    suggestedFollowUps: QUICK_SUGGESTIONS.slice(0, 3)
  };
}
