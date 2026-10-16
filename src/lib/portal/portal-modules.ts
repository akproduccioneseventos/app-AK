import type { LucideIcon } from 'lucide-react';
import {
  Clock3, MapPin, Shirt, NotebookText, CheckSquare, HelpCircle, Users, Globe, Gift,
  Music, Video, Palette, UtensilsCrossed, GlassWater, FileSignature, CreditCard, Package
} from 'lucide-react';
import type { ClientPortalSettings } from '@/types/fiesta';

export type ModuleId = keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey' | 'accessPhase' | 'liveAccessDaysBefore' | 'cuentasBancarias' | 'simuladorInvitadosConfig' | 'clientServiceChangeRequests'>;

export type PasoPortal =
  | 'mi-fiesta'
  | 'mis-invitados'
  | 'musica-fotos-video'
  | 'menu-y-barra'
  | 'contrato-y-pagos';

export type PortalModule = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  paso: PasoPortal;
  href?: (fiestaId: string) => string;
};

export const portalModules: PortalModule[] = [
  // 1. Mi fiesta
  { id: 'itinerario', label: 'Cronograma', icon: Clock3, paso: 'mi-fiesta' },
  { id: 'ubicacion', label: 'Ubicación del Evento', icon: MapPin, paso: 'mi-fiesta' },
  { id: 'dressCode', label: 'Dress Code', icon: Shirt, paso: 'mi-fiesta' },
  { id: 'notasCliente', label: 'Notas', icon: NotebookText, paso: 'mi-fiesta' },
  { id: 'checklist', label: 'Mis Tareas', icon: CheckSquare, paso: 'mi-fiesta' },
  { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle, paso: 'mi-fiesta' },

  // 2. Mis invitados
  { id: 'invitados', label: 'Lista de Invitados', icon: Users, paso: 'mis-invitados', href: (id) => `/portal-cliente/${id}/confirmar-invitados` },
  { id: 'simuladorInvitados', label: 'Cambiar cantidad de invitados', icon: Users, paso: 'mis-invitados' },
  { id: 'paginaPublica', label: 'Invitación Web', icon: Globe, paso: 'mis-invitados', href: (id) => `/invitacion/${id}` },
  { id: 'listaRegalos', label: 'Regalos', icon: Gift, paso: 'mis-invitados', href: (id) => `/invitacion/${id}#regalos` },

  // 3. Música, fotos y video
  { id: 'musica', label: 'Sugerencias Musicales', icon: Music, paso: 'musica-fotos-video', href: (id) => `/portal-cliente/${id}/musica` },
  { id: 'videoVida', label: 'Fotos y Video de Vida', icon: Video, paso: 'musica-fotos-video', href: (id) => `/portal-cliente/${id}/fotos-video` },
  { id: 'moodboard', label: 'Propuesta de Decoración', icon: Palette, paso: 'musica-fotos-video', href: (id) => `/portal/${id}/decoracion` },

  // 4. Menú y barra
  { id: 'menu', label: 'Menú del Evento', icon: UtensilsCrossed, paso: 'menu-y-barra', href: (id) => `/portal-cliente/${id}/menu` },
  { id: 'cartaTragos', label: 'Carta de Tragos', icon: GlassWater, paso: 'menu-y-barra' },
  { id: 'calculadoraBebidas', label: 'Calculadora de Bebidas y Extras', icon: GlassWater, paso: 'menu-y-barra' },

  // 5. Contrato y pagos
  { id: 'contrato', label: 'Contrato', icon: FileSignature, paso: 'contrato-y-pagos', href: (id) => `/portal/${id}/contrato` },
  { id: 'pagos', label: 'Estado de Pagos', icon: CreditCard, paso: 'contrato-y-pagos' },
  { id: 'informarPago', label: 'Informar Pago', icon: CreditCard, paso: 'contrato-y-pagos' },
  { id: 'serviciosContratados', label: 'Servicios Contratados', icon: Package, paso: 'contrato-y-pagos' },
];
