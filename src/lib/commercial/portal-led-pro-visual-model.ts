import { getPortalLedVisibleTechnologyItems } from './portal-led-technology-showcase';

export type PortalLedProVisualSectionId =
  | 'hero'
  | 'trust'
  | 'pain_solution'
  | 'technology'
  | 'tech_zone'
  | 'services'
  | 'menus'
  | 'gallery'
  | 'selection'
  | 'closing';

export type PortalLedProVisualSection = {
  id: PortalLedProVisualSectionId;
  title: string;
  subtitle: string;
  layout: 'hero' | 'split' | 'cards' | 'gallery' | 'summary' | 'closing';
  priority: number;
  screenRule: string;
};

export type PortalLedProVisualModel = {
  title: string;
  subtitle: string;
  sections: PortalLedProVisualSection[];
  technologyHighlights: { title: string; benefit: string }[];
  designRules: string[];
};

export const PORTAL_LED_PRO_VISUAL_SECTIONS: PortalLedProVisualSection[] = [
  {
    id: 'hero',
    title: 'Portada comercial AK',
    subtitle: 'Marca, foto/video fuerte, tipo de fiesta y promesa principal.',
    layout: 'hero',
    priority: 1,
    screenRule: 'Poco texto, imagen grande y una frase fuerte: organizamos todo para que disfrutes como invitado.',
  },
  {
    id: 'trust',
    title: 'Confianza y trayectoria',
    subtitle: 'Experiencia, eventos, clientes, Club Uruguay y equipo AK.',
    layout: 'cards',
    priority: 2,
    screenRule: 'Mostrar prueba visual y social antes de hablar de precios.',
  },
  {
    id: 'pain_solution',
    title: 'Problema y solucion',
    subtitle: 'Organizar separado genera estres; AK centraliza y coordina.',
    layout: 'split',
    priority: 3,
    screenRule: 'Izquierda dolor del cliente, derecha solucion AK.',
  },
  {
    id: 'technology',
    title: 'Tecnologia AK',
    subtitle: 'Portal cliente, invitado, invitacion, RSVP, red social, muro, album y seguimiento.',
    layout: 'cards',
    priority: 4,
    screenRule: 'Explicar beneficios en tarjetas grandes, no tecnicismos, antes de entrar al precio.',
  },
  {
    id: 'tech_zone',
    title: 'Zona tecnologica para fiestas',
    subtitle: 'Zona digital adolescente, fotocabina, 360, Bogue, espejo, barra tactil, totems y modo audiorritmico.',
    layout: 'cards',
    priority: 4.5,
    screenRule: 'Venderlo como paquetes activables: incluido, opcional o apagado segun lo contratado.',
  },
  {
    id: 'services',
    title: 'Servicios por experiencia',
    subtitle: 'Salon, gastronomia, decoracion, musica, foto, video, personal y extras.',
    layout: 'cards',
    priority: 5,
    screenRule: 'Cada servicio debe tener foto, beneficio y boton para marcar interes.',
  },
  {
    id: 'menus',
    title: 'Menus con fotos',
    subtitle: 'Entradas, platos, ninos, adolescentes, postres y opciones por presupuesto.',
    layout: 'gallery',
    priority: 6,
    screenRule: 'La comida se vende con imagen grande y descripcion corta.',
  },
  {
    id: 'gallery',
    title: 'Galeria comercial',
    subtitle: 'Fotos por tipo de fiesta, servicio y subservicio.',
    layout: 'gallery',
    priority: 7,
    screenRule: 'Filtrar por tipo de fiesta antes de mostrar fotos.',
  },
  {
    id: 'selection',
    title: 'Seleccion de entrevista',
    subtitle: 'Lo que interesa, lo pendiente, lo incluido y lo marcado como regalo.',
    layout: 'summary',
    priority: 8,
    screenRule: 'Mantener una bandeja lateral visible con lo seleccionado.',
  },
  {
    id: 'closing',
    title: 'Cierre comercial',
    subtitle: 'Resumen, valor comercial, bonificacion visual, regalos, sena y proximos pasos.',
    layout: 'closing',
    priority: 9,
    screenRule: 'Cerrar con proximos pasos claros: presupuesto, entrevista, sena y contrato.',
  },
];

export function buildPortalLedProVisualModel(): PortalLedProVisualModel {
  return {
    title: 'Portal Comercial LED AK',
    subtitle: 'Una presentacion interactiva para vender la fiesta completa en entrevista.',
    sections: [...PORTAL_LED_PRO_VISUAL_SECTIONS].sort((a, b) => a.priority - b.priority),
    technologyHighlights: getPortalLedVisibleTechnologyItems().map(item => ({
      title: item.title,
      benefit: item.benefit,
    })),
    designRules: [
      'Pensar para pantalla grande: textos cortos, fotos grandes y alto contraste.',
      'No mostrar una lista larga de servicios sin contexto comercial.',
      'Cada seccion debe ayudar a avanzar hacia presupuesto o cierre.',
      'La tecnologia AK debe venderse como experiencia y producto, no como detalle tecnico.',
      'La zona digital debe mostrar entretenimiento real para adolescentes, pantallas y participacion en vivo.',
      'La seleccion del cliente debe estar siempre cerca para armar presupuesto en vivo.',
    ],
  };
}

export function getPortalLedProVisualSection(id: PortalLedProVisualSectionId): PortalLedProVisualSection | undefined {
  return PORTAL_LED_PRO_VISUAL_SECTIONS.find(section => section.id === id);
}

export function buildPortalLedProNavigation(): { id: PortalLedProVisualSectionId; label: string }[] {
  return buildPortalLedProVisualModel().sections.map(section => ({
    id: section.id,
    label: section.title,
  }));
}

export function buildPortalLedProImplementationChecklist(): string[] {
  const model = buildPortalLedProVisualModel();
  return [
    ...model.sections.map(section => `${section.priority}. ${section.title}: ${section.screenRule}`),
    ...model.designRules.map(rule => `Regla visual: ${rule}`),
  ];
}
