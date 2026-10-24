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

export type PasoPortal = 'mi-fiesta' | 'mis-invitados' | 'musica-fotos-video' | 'menu-y-barra' | 'contrato-y-pagos';
export type PortalPaso = PasoPortal | 1 | 2 | 3 | 4 | 5;

export type PortalModule = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  paso: PortalPaso;
  href?: (fiestaId: string) => string;
};

export const PASOS_PORTAL: { paso: PortalPaso; titulo: string; descripcion: string }[] = [
  { paso: 'mi-fiesta', titulo: '1. Mi fiesta', descripcion: 'Todo lo básico y los detalles de tu gran día' },
  { paso: 'mis-invitados', titulo: '2. Mis invitados', descripcion: 'Gestión de asistencias, simulador y regalos' },
  { paso: 'musica-fotos-video', titulo: '3. Música, fotos y video', descripcion: 'Tus canciones favoritas y recuerdos' },
  { paso: 'menu-y-barra', titulo: '4. Menú y barra', descripcion: 'Gastronomía, bebidas y tragos especiales' },
  { paso: 'contrato-y-pagos', titulo: '5. Contrato y pagos', descripcion: 'Documentación oficial y estado de cuenta' },
];

export const portalModules: PortalModule[] = [
  // Paso 1: Mi fiesta (itinerario, ubicacion, dressCode, notasCliente, checklist, faq)
  { id: 'itinerario', label: 'Cronograma', icon: Clock3, paso: 'mi-fiesta' },
  { id: 'ubicacion', label: 'Ubicación del Evento', icon: MapPin, paso: 'mi-fiesta' },
  { id: 'dressCode', label: 'Dress Code', icon: Shirt, paso: 'mi-fiesta' },
  { id: 'notasCliente', label: 'Notas', icon: NotebookText, paso: 'mi-fiesta' },
  { id: 'checklist', label: 'Mis Tareas', icon: CheckSquare, paso: 'mi-fiesta' },
  { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle, paso: 'mi-fiesta' },

  // Paso 2: Mis invitados (invitados, simuladorInvitados, paginaPublica, listaRegalos)
  { id: 'invitados', label: 'Lista de Invitados', icon: Users, paso: 'mis-invitados', href: (id) => `/portal-cliente/${id}/confirmar-invitados` },
  { id: 'simuladorInvitados', label: 'Cambiar cantidad de invitados', icon: Users, paso: 'mis-invitados' },
  { id: 'paginaPublica', label: 'Invitación Web', icon: Globe, paso: 'mis-invitados', href: (id) => `/invitacion/${id}` },
  { id: 'listaRegalos', label: 'Regalos', icon: Gift, paso: 'mis-invitados', href: (id) => `/invitacion/${id}#regalos` },

  // Paso 3: Música, fotos y video (musica, videoVida, moodboard)
  { id: 'musica', label: 'Sugerencias Musicales', icon: Music, paso: 'musica-fotos-video', href: (id) => `/portal-cliente/${id}/musica` },
  { id: 'videoVida', label: 'Video de Vida', icon: Video, paso: 'musica-fotos-video', href: (id) => `/portal-cliente/${id}/fotos-video` },
  { id: 'moodboard', label: 'Propuesta de Decoración', icon: Palette, paso: 'musica-fotos-video', href: (id) => `/portal/${id}/decoracion` },

  // Paso 4: Menú y barra (menu, cartaTragos, calculadoraBebidas)
  { id: 'menu', label: 'Menú del Evento', icon: UtensilsCrossed, paso: 'menu-y-barra', href: (id) => `/portal-cliente/${id}/menu` },
  { id: 'cartaTragos', label: 'Carta de Tragos', icon: GlassWater, paso: 'menu-y-barra' },
  { id: 'calculadoraBebidas', label: 'Calculadora de Bebidas y Extras', icon: GlassWater, paso: 'menu-y-barra' },

  // Paso 5: Contrato y pagos (contrato, pagos, informarPago, serviciosContratados)
  { id: 'contrato', label: 'Contrato', icon: FileSignature, paso: 'contrato-y-pagos', href: (id) => `/portal/${id}/contrato` },
  { id: 'pagos', label: 'Estado de Pagos', icon: CreditCard, paso: 'contrato-y-pagos' },
  { id: 'informarPago', label: 'Informar Pago', icon: CreditCard, paso: 'contrato-y-pagos' },
  { id: 'serviciosContratados', label: 'Servicios Contratados', icon: Package, paso: 'contrato-y-pagos' },
];

/** Módulos legacy mantenidos para redirección histórica y pruebas */
export const PORTAL_LEGACY_MODULES = [
  { id: 'documentos', label: 'Documentos', icon: FileText, href: (id: string) => `/portal/${id}/contrato` },
  { id: 'fotografiaYFilmacion', label: 'Fotografía', icon: Sparkles, href: (id: string) => `/portal-cliente/${id}/fotos-video` },
];
