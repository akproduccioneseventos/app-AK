import type {
  TipoEvento,
  ObjetivoMarketing,
  EstiloMarketing,
  ContenidoCanales,
} from '@/types/marketing';

export function renderVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function detectarFaltante(text: string): string | null {
  if (!text) return null;
  const matchLlaves = text.match(/\{\{([A-Z0-9_]+)\}\}/);
  if (matchLlaves) return matchLlaves[1];
  const matchCorchetes = text.match(/\[([A-Z0-9_/\s-]+)\]/);
  if (matchCorchetes) return matchCorchetes[1];
  return null;
}

export type TemplateKey = `${TipoEvento}-${ObjetivoMarketing}-${EstiloMarketing}`;

export const ESTILOS_POR_OBJETIVO: Record<ObjetivoMarketing, Array<{ id: EstiloMarketing; label: string }>> = {
  captacion: [
    { id: 'elegante', label: 'Elegante' },
    { id: 'neon', label: 'Neón' },
    { id: 'princesa', label: 'Princesa' },
  ],
  mostrar: [
    { id: 'elegante', label: 'Elegante' },
  ],
  cerrar: [
    { id: 'elegante', label: 'Elegante' },
  ],
  reactivar: [
    { id: 'elegante', label: 'Elegante' },
  ],
};

export const BASE_TEMPLATES: Partial<Record<TemplateKey, ContenidoCanales>> = {
  'XV-captacion-elegante': {
    ig_corto:
      'Tu fiesta de XV merece ser perfecta. En AK Producciones organizamos todo: salón, música, decoración y más. Vos venís como invitada. 💫\nPedí tu simulador de presupuesto 👇\n{{LINK_SIMULADOR}}\n#XVAños #FiestasXV #AKProducciones',
    ig_largo:
      '✨ XV años únicos, sin estrés.\n\nSabemos que organizar una fiesta puede ser agotador. Por eso en AK Producciones nos encargamos de absolutamente todo: salón, gastronomía, decoración, música, iluminación y mucho más.\n\nVos llegás como invitada y nosotros hacemos el resto.\n\n🌟 Todo en un solo lugar\n🌟 Atención personalizada\n🌟 +7 años de experiencia\n\n📲 Consultá fechas disponibles y pedí tu presupuesto en segundos:\n{{LINK_SIMULADOR}}\n\n#XVAños #FiestasDeXV #QuinceAños #AKProducciones #SalonDeEventos #OrganizaciónDeEventos',
    historias:
      '¿Soñás con tus XV perfectos? 💜 // Nosotros organizamos TODO: salón + música + deco + gastronomía 🎉 // Pedí tu presupuesto AHORA ➡️ {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "¿Todavía no reservaste tus XV? Mirá esto 👀"\nESCENA 1: Mostrar el salón ambientado (decoración, mesas, pista de baile)\nESCENA 2: "En AK Producciones organizamos ABSOLUTAMENTE TODO. Vos llegás como invitada."\nESCENA 3: Equipo trabajando, detalles de decoración, gastronomía\nCTA: "Simulá tu presupuesto en 1 minuto. Link en bio 🔗 {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! Gracias por escribirnos 😊\n¿La fiesta es para qué fecha aproximada y cuántos invitados esperan?\n\nCon eso te armo las opciones del paquete completo y te paso el simulador para que veas un presupuesto en segundos.\n\n📲 También podés verlo directamente acá: {{LINK_SIMULADOR}}',
  },
  'XV-captacion-neon': {
    ig_corto:
      '¡XV con toda la vibra! 🌈 Salón + DJ + neon + organización completa. Vos elegís el estilo, nosotros hacemos la magia. Pedí tu simulador 👉 {{LINK_SIMULADOR}}\n#XVNeon #FiestasXV #AKProducciones',
    ig_largo:
      '🌈 XV años con toda la vibra NEON.\n\nIluminación neón, DJ profesional, decoración impactante… y vos sin preocuparte por nada.\n\nEn AK Producciones organizamos tu fiesta de pies a cabeza:\n✅ Salón Club Uruguay disponible\n✅ Decoración neón personalizada\n✅ Gastronomía completa\n✅ Animación y música\n\nSimulá tu presupuesto ahora:\n{{LINK_SIMULADOR}}\n\n#XVNeon #QuinceAñosNeon #FiestasXV #AKProducciones #FiestaNeón',
    historias:
      '¡XV con toda la vibra! 🌈 // Neon + DJ + salón completo = la fiesta que soñaste // Simulá tu presupuesto 👉 {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "XV años + luces neón = esto 🤩"\nESCENA 1: Reveal del salón con iluminación neón encendida\nESCENA 2: "Paquete completo: deco, música, gastronomía. Todo en un solo lugar."\nESCENA 3: Festejante y amigas bailando, detalles del salón\nCTA: "Pedí tu presupuesto gratis. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! Qué bueno que nos escribís 😊 Para los XV con estilo neón tenemos paquetes increíbles.\n¿Para qué fecha y cuántos invitados? Así te mando opciones y el link del simulador:\n{{LINK_SIMULADOR}}',
  },
  'XV-captacion-princesa': {
    ig_corto:
      'Porque toda chica merece sentirse princesa en sus XV 👑 Organización completa, decoración de ensueño y recuerdos para toda la vida. Simulá tu presupuesto: {{LINK_SIMULADOR}}\n#XVPrincesa #FiestasXV #AKProducciones',
    ig_largo:
      '👑 El sueño de toda quinceañera hecho realidad.\n\nDecoración clásica y elegante, vestido de ensueño, vals perfectamente coordinado… y vos sin preocuparte por nada.\n\nEn AK Producciones nos encargamos de que cada detalle sea perfecto:\n✨ Salón decorado según tu visión\n✨ Gastronomía de calidad\n✨ Coordinación total del evento\n✨ Recuerdos para toda la vida\n\nSimulá tu presupuesto sin compromiso:\n{{LINK_SIMULADOR}}\n\n#XVPrincesa #QuinceAñosPrincesa #FiestasXV #AKProducciones',
    historias:
      '¿Soñás con tus XV de princesa? 👑 // Salón + decoración + organización completa // Tu presupuesto en 1 minuto: {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "XV de princesa sin el estrés de organizar todo 👑"\nESCENA 1: Decoración clásica, mesas con flores, luces cálidas\nESCENA 2: "Nosotros organizamos absolutamente todo. Vos llegás y disfrutás."\nESCENA 3: Quinceañera radiante, familia feliz\nCTA: "Consultá fechas y presupuesto. Link en bio 💫 {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! 😊 Para una fiesta de XV estilo princesa tenemos el paquete ideal.\n¿Cuál es la fecha aproximada y cuántos invitados esperan? Con eso te preparo opciones y el simulador de presupuesto:\n{{LINK_SIMULADOR}}',
  },
  'XV-mostrar-elegante': {
    ig_corto:
      'Así lucen los XV que organizamos 🤍 Cada detalle pensado para que sea inolvidable. ¿La próxima es la tuya? Simulá tu presupuesto: {{LINK_SIMULADOR}}\n#XVAños #AKProducciones',
    ig_largo:
      '🤍 Detrás de cada fiesta perfecta, hay un equipo que trabajó sin parar.\n\nEsto fue lo que creamos para {{NOMBRE}}: salón decorado, gastronomía impecable, música que hizo bailar a todos hasta las 6am.\n\nNo les faltó ni un detalle. Y lo mejor: la mamá llegó a la fiesta sin estrés, porque nosotros nos encargamos de todo.\n\n¿Querés algo así para tu hija? Empezá por el simulador de presupuesto:\n{{LINK_SIMULADOR}}\n\n#XVAños #FiestasXV #AKProducciones #EventosPremium',
    historias:
      'Así quedaron sus XV ✨ // Salón + decoración + organización completa // ¿La próxima es la tuya? 👉 {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "Mirá cómo transformamos el salón para esta fiesta de XV 🤩"\nESCENA 1: Time-lapse o before/after del salón decorado\nESCENA 2: Highlights del evento: entrada, vals, brindis\nESCENA 3: Quinceañera feliz, familia emocionada\nCTA: "¿Querés algo así? Simulá tu presupuesto ahora. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola! 😊 Acabo de ver una foto/video de sus trabajos y me encantó. ¿Pueden hacerme algo similar para los XV de mi hija?\n\n¿Tienen disponibilidad para {{FECHA}}? ¿Cómo funciona el presupuesto?',
  },
  'XV-cerrar-elegante': {
    ig_corto:
      '⏳ Quedan pocas fechas disponibles para este año. No dejes pasar los XV de tu hija. Simulá el presupuesto ahora y asegurá la fecha: {{LINK_SIMULADOR}}\n#XVAños #FechasDisponibles #AKProducciones',
    ig_largo:
      '⏳ Las fechas se llenan rápido.\n\nSi estás pensando en los XV de tu hija para este año, este es el momento de asegurar la fecha antes de que se ocupe.\n\nEn AK Producciones organizamos todo:\n✅ Salón Club Uruguay disponible\n✅ Coordinación total\n✅ Paquetes personalizables\n\nSimulá el presupuesto en menos de un minuto y guardá tu fecha:\n{{LINK_SIMULADOR}}\n\n💬 O escribinos directamente por WhatsApp.\n\n#XVAños #FiestasXV #AseguráTuFecha #AKProducciones',
    historias:
      '⚠️ Quedan pocas fechas para XV este año // ¿Cuándo es la fiesta de tu hija? // Asegurá la fecha ahora: {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "¿Todavía no reservaste la fecha para los XV? Ojo con esto 👀"\nESCENA 1: Calendario con fechas marcadas como ocupadas\nESCENA 2: "Las fechas de diciembre y enero ya casi no tienen lugar. Te recomendamos reservar con anticipación."\nESCENA 3: Equipo preparando un evento, salón impecable\nCTA: "Simulá el presupuesto y reservá ahora. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola {{NOMBRE}}! 😊 ¿Siguen evaluando opciones para los XV? Te cuento que para {{FECHA}} quedan pocas fechas disponibles.\n\nSi querés asegurar la fecha, podemos coordinar una visita al salón o mandarte el simulador de presupuesto para que veas opciones:\n{{LINK_SIMULADOR}}\n\n¿Qué fecha tenían pensada?',
  },
  'XV-reactivar-elegante': {
    ig_corto:
      '¿Seguís buscando el lugar ideal para los XV? 💜 En AK Producciones organizamos todo. Quizás podemos ayudarte. Simulá el presupuesto sin compromiso: {{LINK_SIMULADOR}}\n#XVAños #AKProducciones',
    ig_largo:
      '¿Todavía no encontraste el lugar ideal para los XV de tu hija? 💜\n\nSabemos que elegir puede ser difícil. Por eso en AK Producciones te ofrecemos transparencia total desde el primer momento: simulá el presupuesto, conocé el salón y decidís sin presión.\n\nTodo en un solo lugar, con organización completa.\n\nSimulá tu presupuesto ahora:\n{{LINK_SIMULADOR}}\n\n#XVAños #FiestasXV #OrganizaciónDeEventos #AKProducciones',
    historias:
      '¿Seguís buscando el lugar para los XV? 💜 // Sin estrés: nosotros organizamos todo // Mirá opciones sin compromiso: {{LINK_SIMULADOR}}',
    tiktok:
      'HOOK: "¿Cansada de buscar lugar para los XV sin encontrar nada que convenza? 😅"\nESCENA 1: "En AK Producciones organizamos absolutamente todo. Salón, música, comida, deco."\nESCENA 2: Tour por el salón, detalles de decoraciones anteriores\nESCENA 3: Familia contenta, quinceañera radiante\nCTA: "Simulá el presupuesto sin compromiso. Link en bio ➡️ {{LINK_SIMULADOR}}"',
    whatsapp:
      '¡Hola {{NOMBRE}}! 😊 Hace un tiempo hablamos sobre los XV de tu hija. ¿Cómo van con la organización? Si todavía no definieron lugar, seguimos con disponibilidad.\n\nTe mando el simulador para que veas opciones y precios actualizados:\n{{LINK_SIMULADOR}}\n\n¿Seguimos en contacto?',
  },
};

export function getBaseTemplate(
  tipo: TipoEvento,
  objetivo: ObjetivoMarketing,
  estilo: EstiloMarketing
): ContenidoCanales {
  const key: TemplateKey = `${tipo}-${objetivo}-${estilo}`;
  const template = BASE_TEMPLATES[key];
  if (!template) {
    throw new Error(`No existe plantilla propia para ${tipo}-${objetivo}-${estilo}`);
  }
  return template;
}
