export type TipoEvento = 'XV' | 'Boda' | 'Cumple';
export type ObjetivoMarketing = 'captacion' | 'mostrar' | 'cerrar' | 'reactivar';
export type EstiloMarketing = 'elegante' | 'neon' | 'princesa' | 'urbano' | 'boho';

export interface ContenidoCanales {
  ig_corto: string;
  ig_largo: string;
  historias: string;
  tiktok: string;
  whatsapp: string;
}

export interface MarketingTemplate {
  id: string;
  nombre: string;
  tags: string[];
  tipo: TipoEvento;
  objetivo: ObjetivoMarketing;
  estilo: EstiloMarketing;
  contenido: ContenidoCanales;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  dia: string;
  tarea: string;
  canal: string;
  estado: 'pendiente' | 'hecho';
  hechoBy?: string;
  hechoAt?: string;
  semana: string;
}

export interface MarketingData {
  templates: MarketingTemplate[];
  checklist: ChecklistItem[];
}

export const MARKETING_VARIABLES: { key: string; label: string; ejemplo: string }[] = [
  { key: '{{NOMBRE}}', label: 'Nombre cliente', ejemplo: 'María' },
  { key: '{{FECHA}}', label: 'Fecha del evento', ejemplo: '15 de agosto 2025' },
  { key: '{{INVITADOS}}', label: 'Cantidad invitados', ejemplo: '120' },
  { key: '{{PRECIO_LISTA}}', label: 'Precio de lista', ejemplo: '$150.000' },
  { key: '{{PRECIO_HOY}}', label: 'Precio hoy (promo)', ejemplo: '$130.000' },
  { key: '{{AHORRO}}', label: 'Ahorro', ejemplo: '$20.000' },
  { key: '{{LINK_SIMULADOR}}', label: 'Link simulador', ejemplo: '/simulador-de-presupuesto' },
];

export type TabMarketing = 'generador' | 'plantillas' | 'checklist' | 'respaldo';
