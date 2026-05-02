export type InvitationProTemplateId =
  | 'luxury_dark'
  | 'editorial_white'
  | 'romantic_glass'
  | 'neon_party'
  | 'botanical_soft'
  | 'cinematic_story';

export type InvitationProEventStage = 'previa' | 'en_vivo' | 'post_evento';

export type InvitationProSectionId =
  | 'hero'
  | 'countdown'
  | 'rsvp'
  | 'event_details'
  | 'location'
  | 'dress_code'
  | 'gift_account'
  | 'social_fiesta'
  | 'music_poll'
  | 'guest_messages'
  | 'photo_album'
  | 'ak_soft_selling'
  | 'footer';

export type InvitationProTemplate = {
  id: InvitationProTemplateId;
  name: string;
  description: string;
  mood: string;
  bestFor: string[];
  visualStyle: {
    background: 'dark' | 'light' | 'photo' | 'gradient' | 'video';
    cardStyle: 'glass' | 'editorial' | 'minimal' | 'neon' | 'classic';
    motion: 'soft' | 'cinematic' | 'party' | 'minimal';
    typography: 'serif_luxury' | 'sans_modern' | 'script_romantic' | 'bold_party';
  };
  defaultPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  sections: InvitationProSectionId[];
};

export type InvitationProPersonalization = {
  templateId: InvitationProTemplateId;
  eventName: string;
  protagonistNames: string[];
  coverImageUrl?: string;
  coverVideoUrl?: string;
  musicUrl?: string;
  customColors?: Partial<InvitationProTemplate['defaultPalette']>;
  fontOverride?: string;
  showAkBranding: boolean;
  akBrandingMode: 'discreto' | 'premium' | 'oculto_cliente';
  stage: InvitationProEventStage;
};

export const INVITATION_PRO_TEMPLATES: InvitationProTemplate[] = [
  {
    id: 'luxury_dark',
    name: 'Luxury Dark',
    description: 'Estética elegante tipo gala, fondo oscuro, brillo suave y tarjetas premium.',
    mood: 'Elegante, moderno y nocturno',
    bestFor: ['XV años', 'Bodas', 'Eventos empresariales', 'Fiestas formales'],
    visualStyle: { background: 'gradient', cardStyle: 'glass', motion: 'soft', typography: 'serif_luxury' },
    defaultPalette: { primary: '#111827', secondary: '#7c3aed', accent: '#f5c542', background: '#030712', text: '#f9fafb' },
    sections: ['hero', 'countdown', 'rsvp', 'event_details', 'location', 'dress_code', 'gift_account', 'social_fiesta', 'ak_soft_selling', 'footer'],
  },
  {
    id: 'editorial_white',
    name: 'Editorial White',
    description: 'Diseño limpio tipo revista premium, mucho aire, fotos grandes y lectura fácil.',
    mood: 'Minimalista, fino y fotográfico',
    bestFor: ['Bodas', 'Cumpleaños elegantes', 'Eventos corporativos'],
    visualStyle: { background: 'light', cardStyle: 'editorial', motion: 'minimal', typography: 'serif_luxury' },
    defaultPalette: { primary: '#ffffff', secondary: '#111827', accent: '#c9a227', background: '#f8fafc', text: '#111827' },
    sections: ['hero', 'countdown', 'rsvp', 'event_details', 'location', 'dress_code', 'gift_account', 'social_fiesta', 'footer'],
  },
  {
    id: 'romantic_glass',
    name: 'Romantic Glass',
    description: 'Tarjetas translúcidas, colores suaves y sensación emocional.',
    mood: 'Romántico, cálido y delicado',
    bestFor: ['Bodas', 'XV años', 'Aniversarios'],
    visualStyle: { background: 'photo', cardStyle: 'glass', motion: 'soft', typography: 'script_romantic' },
    defaultPalette: { primary: '#fdf2f8', secondary: '#831843', accent: '#fb7185', background: '#fff1f2', text: '#3f0f1f' },
    sections: ['hero', 'countdown', 'rsvp', 'event_details', 'location', 'dress_code', 'gift_account', 'guest_messages', 'social_fiesta', 'footer'],
  },
  {
    id: 'neon_party',
    name: 'Neon Party',
    description: 'Estilo fiesta moderna, brillo neón, movimiento y energía visual.',
    mood: 'Divertido, nocturno y joven',
    bestFor: ['XV años', '18 años', 'Cumpleaños', 'Fiestas con discoteca'],
    visualStyle: { background: 'gradient', cardStyle: 'neon', motion: 'party', typography: 'bold_party' },
    defaultPalette: { primary: '#0f172a', secondary: '#ec4899', accent: '#22d3ee', background: '#020617', text: '#f8fafc' },
    sections: ['hero', 'countdown', 'rsvp', 'event_details', 'location', 'dress_code', 'social_fiesta', 'music_poll', 'guest_messages', 'ak_soft_selling', 'footer'],
  },
  {
    id: 'botanical_soft',
    name: 'Botanical Soft',
    description: 'Estilo natural, flores, tonos verdes y sensación artesanal premium.',
    mood: 'Natural, fresco y elegante',
    bestFor: ['Bodas', 'Bautismos', 'Cumpleaños de día', 'Eventos al aire libre'],
    visualStyle: { background: 'photo', cardStyle: 'classic', motion: 'soft', typography: 'serif_luxury' },
    defaultPalette: { primary: '#ecfdf5', secondary: '#065f46', accent: '#d97706', background: '#f7fee7', text: '#064e3b' },
    sections: ['hero', 'countdown', 'rsvp', 'event_details', 'location', 'dress_code', 'gift_account', 'social_fiesta', 'footer'],
  },
  {
    id: 'cinematic_story',
    name: 'Cinematic Story',
    description: 'Portada tipo película/reel, ideal para video, historia y entrada emocional.',
    mood: 'Emocional, visual y cinematográfico',
    bestFor: ['XV años', 'Bodas', 'Eventos con video principal'],
    visualStyle: { background: 'video', cardStyle: 'glass', motion: 'cinematic', typography: 'sans_modern' },
    defaultPalette: { primary: '#18181b', secondary: '#d4d4d8', accent: '#f97316', background: '#09090b', text: '#fafafa' },
    sections: ['hero', 'countdown', 'rsvp', 'event_details', 'location', 'social_fiesta', 'guest_messages', 'photo_album', 'ak_soft_selling', 'footer'],
  },
];

export function getInvitationProTemplate(templateId: InvitationProTemplateId): InvitationProTemplate {
  return INVITATION_PRO_TEMPLATES.find(template => template.id === templateId) ?? INVITATION_PRO_TEMPLATES[0];
}

export function buildInvitationProPalette(personalization: InvitationProPersonalization): InvitationProTemplate['defaultPalette'] {
  const template = getInvitationProTemplate(personalization.templateId);
  return {
    ...template.defaultPalette,
    ...(personalization.customColors ?? {}),
  };
}

export function getInvitationProSections(personalization: InvitationProPersonalization): InvitationProSectionId[] {
  const template = getInvitationProTemplate(personalization.templateId);
  const sections = [...template.sections];

  if (personalization.stage === 'post_evento' && !sections.includes('photo_album')) {
    sections.splice(Math.max(1, sections.length - 1), 0, 'photo_album');
  }

  if (personalization.stage === 'en_vivo' && !sections.includes('social_fiesta')) {
    sections.splice(Math.max(1, sections.length - 1), 0, 'social_fiesta');
  }

  return Array.from(new Set(sections));
}

export function buildAkInvitationBrandingLine(personalization: InvitationProPersonalization): string | undefined {
  if (!personalization.showAkBranding || personalization.akBrandingMode === 'oculto_cliente') return undefined;

  if (personalization.akBrandingMode === 'premium') {
    return 'Experiencia digital, organización integral y recuerdos conectados por AK Producciones.';
  }

  return 'Experiencia creada por AK Producciones.';
}
