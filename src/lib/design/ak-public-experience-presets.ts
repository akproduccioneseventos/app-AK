import type { AkPremiumSurface, AkPremiumTone } from './ak-premium-design-system';
import { buildAkPremiumTheme, buildAkPremiumStyleVars } from './ak-premium-design-system';

export type AkPublicExperienceId = 'eventInvitation' | 'guestPortal' | 'clientPortal' | 'socialWall' | 'albumDelivery';

export type AkPublicExperienceAction = {
  id: string;
  label: string;
  description: string;
  icon: string;
  priority: number;
  tone: 'primary' | 'secondary' | 'soft' | 'danger';
};

export type AkPublicExperienceSection = {
  id: string;
  title: string;
  description: string;
  priority: number;
  visibleByDefault: boolean;
  mobilePriority: number;
};

export type AkPublicExperiencePreset = {
  id: AkPublicExperienceId;
  surface: AkPremiumSurface;
  tone: AkPremiumTone;
  name: string;
  headline: string;
  description: string;
  heroLabel: string;
  primaryGoal: string;
  actions: AkPublicExperienceAction[];
  sections: AkPublicExperienceSection[];
};

export const AK_PUBLIC_EXPERIENCE_PRESETS: Record<AkPublicExperienceId, AkPublicExperiencePreset> = {
  eventInvitation: {
    id: 'eventInvitation', surface: 'public', tone: 'luxury', name: 'Invitación Premium',
    headline: 'Una invitación que ya se siente como fiesta',
    description: 'Portada emocional, confirmación simple, cuenta regresiva, ubicación, música y entrada a la red social del evento.',
    heroLabel: 'Invitación digital', primaryGoal: 'Confirmar asistencia y despertar emoción antes del evento.',
    actions: [
      { id: 'confirm', label: 'Confirmar asistencia', description: 'Acción principal visible y clara.', icon: 'check', priority: 1, tone: 'primary' },
      { id: 'location', label: 'Ver ubicación', description: 'Google Maps directo, sin buscar datos.', icon: 'map-pin', priority: 2, tone: 'secondary' },
      { id: 'social', label: 'Entrar a la red social', description: 'Activar la previa y participación.', icon: 'camera', priority: 3, tone: 'soft' },
    ],
    sections: [
      { id: 'hero', title: 'Portada cinematográfica', description: 'Foto o video del protagonista, fecha, lugar y cuenta regresiva.', priority: 1, visibleByDefault: true, mobilePriority: 1 },
      { id: 'rsvp', title: 'RSVP controlado', description: 'Confirmación individual sin acompañantes libres.', priority: 2, visibleByDefault: true, mobilePriority: 2 },
      { id: 'details', title: 'Datos de la fiesta', description: 'Hora, dirección, dress code, cuenta regalo y notas importantes.', priority: 3, visibleByDefault: true, mobilePriority: 3 },
      { id: 'social', title: 'Red social de la fiesta', description: 'Fotos, mensajes, juegos, pedidos de música y muro.', priority: 4, visibleByDefault: true, mobilePriority: 4 },
    ],
  },
  guestPortal: {
    id: 'guestPortal', surface: 'guest', tone: 'neon', name: 'Portal del Invitado',
    headline: 'Todo lo que el invitado necesita en una sola pantalla',
    description: 'Diseñado para que nadie se pierda: confirmar, llegar, mostrar QR, participar y compartir recuerdos.',
    heroLabel: 'Pase del invitado', primaryGoal: 'Reducir dudas y aumentar participación.',
    actions: [
      { id: 'qr', label: 'Ver mi QR', description: 'Entrada clara al evento.', icon: 'qr-code', priority: 1, tone: 'primary' },
      { id: 'map', label: 'Cómo llegar', description: 'Ubicación inmediata.', icon: 'map-pin', priority: 2, tone: 'secondary' },
      { id: 'wall', label: 'Subir foto', description: 'Participar del muro social.', icon: 'camera', priority: 3, tone: 'soft' },
      { id: 'music', label: 'Pedir canción', description: 'Interacción simple con la fiesta.', icon: 'music', priority: 4, tone: 'soft' },
    ],
    sections: [
      { id: 'pass', title: 'Pase de entrada', description: 'QR, nombre, mesa y estado de asistencia.', priority: 1, visibleByDefault: true, mobilePriority: 1 },
      { id: 'eventInfo', title: 'Datos esenciales', description: 'Fecha, hora, lugar, vestimenta y mapa.', priority: 2, visibleByDefault: true, mobilePriority: 2 },
      { id: 'participation', title: 'Participación', description: 'Muro social, fotos, música, juegos y mensajes.', priority: 3, visibleByDefault: true, mobilePriority: 3 },
      { id: 'akBranding', title: 'Experiencia AK', description: 'Marca sutil y venta invisible sin molestar al invitado.', priority: 4, visibleByDefault: true, mobilePriority: 4 },
    ],
  },
  clientPortal: {
    id: 'clientPortal', surface: 'client', tone: 'celebration', name: 'Portal Cliente VIP',
    headline: 'Un panel VIP para vivir la organización sin estrés',
    description: 'Portada personalizada, pagos, documentos, reuniones, tareas, cronograma, fotos y álbum final.',
    heroLabel: 'Portal VIP del cliente', primaryGoal: 'Mostrar control, tranquilidad y organización integral.',
    actions: [
      { id: 'pay', label: 'Realizar pago', description: 'CTA financiero claro.', icon: 'credit-card', priority: 1, tone: 'primary' },
      { id: 'documents', label: 'Ver documentos', description: 'Contrato, presupuesto y comprobantes.', icon: 'file-text', priority: 2, tone: 'secondary' },
      { id: 'tasks', label: 'Ver pendientes', description: 'Lo que falta resolver.', icon: 'list-checks', priority: 3, tone: 'soft' },
      { id: 'messages', label: 'Escribir a AK', description: 'Comunicación directa.', icon: 'message-circle', priority: 4, tone: 'soft' },
    ],
    sections: [
      { id: 'summary', title: 'Resumen VIP', description: 'Foto, color del evento, fecha y próximo paso.', priority: 1, visibleByDefault: true, mobilePriority: 1 },
      { id: 'finance', title: 'Finanzas y documentos', description: 'Pagos, saldo, plan de pagos, contrato y presupuesto.', priority: 2, visibleByDefault: true, mobilePriority: 2 },
      { id: 'organization', title: 'Organización', description: 'Tareas del cliente, reuniones, música, decoración y cronograma.', priority: 3, visibleByDefault: true, mobilePriority: 3 },
      { id: 'postEvent', title: 'Después del evento', description: 'Fotos, filmación, álbum, entregas y recuerdos.', priority: 4, visibleByDefault: true, mobilePriority: 4 },
    ],
  },
  socialWall: {
    id: 'socialWall', surface: 'liveWall', tone: 'neon', name: 'Muro Social Pro',
    headline: 'La pantalla gigante como experiencia vendible',
    description: 'Mosaico, carrusel, QR, ranking, sorteos, mensajes y marca AK sutil.',
    heroLabel: 'Muro social en vivo', primaryGoal: 'Convertir la participación en espectáculo y prueba de valor.',
    actions: [
      { id: 'upload', label: 'Subir foto', description: 'Participar desde QR.', icon: 'camera', priority: 1, tone: 'primary' },
      { id: 'vote', label: 'Votar', description: 'Reacciones y ranking.', icon: 'heart', priority: 2, tone: 'soft' },
      { id: 'raffle', label: 'Participar del sorteo', description: 'Entretenimiento en vivo.', icon: 'gift', priority: 3, tone: 'secondary' },
    ],
    sections: [
      { id: 'screen', title: 'Pantalla premium', description: 'Mosaico, carrusel y foto destacada.', priority: 1, visibleByDefault: true, mobilePriority: 1 },
      { id: 'games', title: 'Juegos y sorteos', description: 'Ranking por mesa, desafíos y ganadores.', priority: 2, visibleByDefault: true, mobilePriority: 2 },
      { id: 'moderation', title: 'Contenido seguro', description: 'Solo aprobado aparece en pantalla.', priority: 3, visibleByDefault: true, mobilePriority: 3 },
      { id: 'branding', title: 'Marca AK sutil', description: 'Venta invisible en pantalla.', priority: 4, visibleByDefault: true, mobilePriority: 4 },
    ],
  },
  albumDelivery: {
    id: 'albumDelivery', surface: 'client', tone: 'romantic', name: 'Entrega de recuerdos',
    headline: 'El recuerdo sigue después de la fiesta',
    description: 'Álbum digital, contraseña, vencimiento, aviso de descarga y entrega profesional.',
    heroLabel: 'Álbum digital', primaryGoal: 'Cuidar la experiencia post-evento y evitar costos innecesarios de Storage.',
    actions: [
      { id: 'openAlbum', label: 'Abrir álbum', description: 'Ir al álbum final.', icon: 'image', priority: 1, tone: 'primary' },
      { id: 'download', label: 'Descargar fotos', description: 'Recordatorio para conservar recuerdos.', icon: 'download', priority: 2, tone: 'secondary' },
    ],
    sections: [
      { id: 'album', title: 'Álbum final', description: 'Link, contraseña, fecha de vencimiento y portada.', priority: 1, visibleByDefault: true, mobilePriority: 1 },
      { id: 'warning', title: 'Aviso de descarga', description: 'Mensaje claro para que el cliente guarde sus fotos.', priority: 2, visibleByDefault: true, mobilePriority: 2 },
      { id: 'delivery', title: 'Estado de entrega', description: 'Pendiente, listo, vence pronto o vencido.', priority: 3, visibleByDefault: true, mobilePriority: 3 },
    ],
  },
};

export function getAkPublicExperiencePreset(id: AkPublicExperienceId): AkPublicExperiencePreset {
  return AK_PUBLIC_EXPERIENCE_PRESETS[id];
}

export function getAkPublicExperienceStyle(id: AkPublicExperienceId, overrides?: { primary?: string; accent?: string }) {
  const preset = getAkPublicExperiencePreset(id);
  const theme = buildAkPremiumTheme({ surface: preset.surface, tone: preset.tone, primaryOverride: overrides?.primary, accentOverride: overrides?.accent });
  return { theme, style: buildAkPremiumStyleVars(theme), className: theme.className };
}

export function getAkPublicExperienceActions(id: AkPublicExperienceId): AkPublicExperienceAction[] {
  return [...getAkPublicExperiencePreset(id).actions].sort((a, b) => a.priority - b.priority);
}

export function getAkPublicExperienceSections(id: AkPublicExperienceId): AkPublicExperienceSection[] {
  return [...getAkPublicExperiencePreset(id).sections].sort((a, b) => a.mobilePriority - b.mobilePriority || a.priority - b.priority);
}

export function buildAkPublicExperienceChecklist(id: AkPublicExperienceId): string[] {
  const preset = getAkPublicExperiencePreset(id);
  return getAkPublicExperienceSections(id).map(section => `${preset.name}: ${section.title} · ${section.description}`);
}
