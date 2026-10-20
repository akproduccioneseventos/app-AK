import type { ClientPortalSettings } from '@/types/fiesta';
import {
  CheckSquare,
  Clock3,
  CreditCard,
  FileSignature,
  FileText,
  Gift,
  GlassWater,
  Globe,
  HelpCircle,
  LucideIcon,
  MapPin,
  Music,
  NotebookText,
  Package,
  Palette,
  Shirt,
  Sparkles,
  Users,
  UtensilsCrossed,
  Video,
} from 'lucide-react';

export type ModuleId = keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey' | 'accessPhase' | 'liveAccessDaysBefore' | 'cuentasBancarias' | 'simuladorInvitadosConfig' | 'clientServiceChangeRequests'>;

export type PortalPaso = 1 | 2 | 3 | 4 | 5;

export type PortalModule = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  paso: PortalPaso;
  href?: (fiestaId: string) => string;
};

export const PASOS_PORTAL: { paso: PortalPaso; titulo: string; descripcion: string }[] = [
  { paso: 1, titulo: '1. Mi fiesta', descripcion: 'Todo lo básico y los detalles de tu gran día' },
  { paso: 2, titulo: '2. Mis invitados', descripcion: 'Gestión de asistencias, simulador y regalos' },
  { paso: 3, titulo: '3. Música, fotos y video', descripcion: 'Tus canciones favoritas y recuerdos' },
  { paso: 4, titulo: '4. Menú y barra', descripcion: 'Gastronomía, bebidas y tragos especiales' },
  { paso: 5, titulo: '5. Contrato y pagos', descripcion: 'Documentación oficial y estado de cuenta' },
];

export const portalModules: PortalModule[] = [
  // Paso 1: Mi fiesta (itinerario, ubicacion, dressCode, notasCliente, checklist, faq)
  { id: 'itinerario', label: 'Cronograma', icon: Clock3, paso: 1 },
  { id: 'ubicacion', label: 'Ubicación del Evento', icon: MapPin, paso: 1 },
  { id: 'dressCode', label: 'Dress Code', icon: Shirt, paso: 1 },
  { id: 'notasCliente', label: 'Notas', icon: NotebookText, paso: 1 },
  { id: 'checklist', label: 'Mis Tareas', icon: CheckSquare, paso: 1 },
  { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle, paso: 1 },

  // Paso 2: Mis invitados (invitados, simuladorInvitados, paginaPublica, listaRegalos)
  { id: 'invitados', label: 'Lista de Invitados', icon: Users, paso: 2, href: (id) => `/portal-cliente/${id}/confirmar-invitados` },
  { id: 'simuladorInvitados', label: 'Cambiar cantidad de invitados', icon: Users, paso: 2 },
  { id: 'paginaPublica', label: 'Invitación Web', icon: Globe, paso: 2, href: (id) => `/invitacion/${id}` },
  { id: 'listaRegalos', label: 'Regalos', icon: Gift, paso: 2, href: (id) => `/invitacion/${id}#regalos` },

  // Paso 3: Música, fotos y video (musica, videoVida, moodboard)
  { id: 'musica', label: 'Sugerencias Musicales', icon: Music, paso: 3, href: (id) => `/portal-cliente/${id}/musica` },
  { id: 'videoVida', label: 'Video de Vida', icon: Video, paso: 3, href: (id) => `/portal-cliente/${id}/fotos-video` },
  { id: 'moodboard', label: 'Propuesta de Decoración', icon: Palette, paso: 3, href: (id) => `/portal/${id}/decoracion` },

  // Paso 4: Menú y barra (menu, cartaTragos, calculadoraBebidas)
  { id: 'menu', label: 'Menú del Evento', icon: UtensilsCrossed, paso: 4, href: (id) => `/portal-cliente/${id}/menu` },
  { id: 'cartaTragos', label: 'Carta de Tragos', icon: GlassWater, paso: 4 },
  { id: 'calculadoraBebidas', label: 'Calculadora de Bebidas y Extras', icon: GlassWater, paso: 4 },

  // Paso 5: Contrato y pagos (contrato, pagos, informarPago, serviciosContratados)
  { id: 'contrato', label: 'Contrato', icon: FileSignature, paso: 5, href: (id) => `/portal/${id}/contrato` },
  { id: 'pagos', label: 'Estado de Pagos', icon: CreditCard, paso: 5 },
  { id: 'informarPago', label: 'Informar Pago', icon: CreditCard, paso: 5 },
  { id: 'serviciosContratados', label: 'Servicios Contratados', icon: Package, paso: 5 },
];

/** Módulos legacy mantenidos para redirección histórica y pruebas */
export const PORTAL_LEGACY_MODULES = [
  { id: 'documentos', label: 'Documentos', icon: FileText, href: (id: string) => `/portal/${id}/contrato` },
  { id: 'fotografiaYFilmacion', label: 'Fotografía', icon: Sparkles, href: (id: string) => `/portal-cliente/${id}/fotos-video` },
];
