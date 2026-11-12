import { verifySession } from '@/lib/auth/session-token';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { puede, PERMISOS, type Permiso } from '@/lib/auth/perfiles';
import {
  ChefHat,
  ShoppingCart,
  DoorOpen,
  Package,
  Building2,
  Briefcase,
  Target,
  Send,
  Tv,
  AlertTriangle,
  ClipboardList,
  Wheat,
  HardHat,
  Users2,
  Video,
  Wand2,
  FileText,
  CheckSquare,
  TrendingUp,
  Settings,
  Zap,
  Link as LinkIcon,
  MessageCircle,
  Scale,
  ShieldCheck,
  Tag,
  Bot,
  Cpu,
  Palette,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Más herramientas - AK Producciones',
  description: 'Accesos agrupados a Recursos, Marketing, Herramientas y Ajustes.',
};

interface MasCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  permiso?: Permiso | Permiso[];
}

interface MasGroup {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  cards: MasCard[];
}

const GRUPOS_MAS: MasGroup[] = [
  {
    id: 'recursos',
    label: 'Recursos',
    emoji: '📦',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    cards: [
      {
        title: 'Comida / Menús',
        description: 'Planificador gastronómico, catálogo de platos y costos.',
        href: '/empresa/menus',
        icon: ChefHat,
        permiso: PERMISOS.INSUMOS,
      },
      {
        title: 'Lista de Compras',
        description: 'Insumos calculados y compras requeridas por evento.',
        href: '/compras',
        icon: ShoppingCart,
        permiso: PERMISOS.INSUMOS,
      },
      {
        title: 'Salones',
        description: 'Gestor de salones de fiestas, medidas y ubicaciones.',
        href: '/empresa/salones',
        icon: DoorOpen,
      },
      {
        title: 'Catálogo de Servicios',
        description: 'Servicios, paquetes, precios y opciones de armado.',
        href: '/empresa/servicios',
        icon: Package,
      },
      {
        title: 'Proveedores',
        description: 'Directorio de proveedores de insumos y servicios.',
        href: '/proveedores',
        icon: Building2,
        permiso: PERMISOS.INSUMOS,
      },
      {
        title: 'Empleados',
        description: 'Gestión de colaboradores, roles y liquidaciones.',
        href: '/empleados',
        icon: Briefcase,
        permiso: PERMISOS.ADMINISTRACION,
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    emoji: '🎯',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    cards: [
      {
        title: 'Marketing y Redes',
        description: 'Campañas, planificador de contenido y asesor de difusión.',
        href: '/marketing',
        icon: Target,
        permiso: PERMISOS.CRM,
      },
      {
        title: 'WhatsApp del Día',
        description: 'Bandeja de salida y mensajes programados para prospectos.',
        href: '/contabilidad/crm/outbox',
        icon: Send,
        permiso: PERMISOS.CRM,
      },
      {
        title: 'Presentación LED',
        description: 'Configuración visual para la pantalla LED en reuniones.',
        href: '/empresa/presentacion-led/configuracion',
        icon: Tv,
      },
    ],
  },
  {
    id: 'herramientas',
    label: 'Herramientas',
    emoji: '🛠️',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-200',
    cards: [
      {
        title: 'Incidentes',
        description: 'Registro operativo de eventualidades y resolución en fiestas.',
        href: '/incidentes',
        icon: AlertTriangle,
      },
      {
        title: 'Guias de Armado',
        description: 'Playbooks técnicos y orden de montaje por puesto.',
        href: '/playbooks',
        icon: ClipboardList,
      },
      {
        title: 'Alergias y Dietas',
        description: 'Menús especiales y restricciones alimentarias de invitados.',
        href: '/fiestas/nueva/alergias',
        icon: Wheat,
      },
      {
        title: 'Portal de Proveedores',
        description: 'Control de accesos y requerimientos para externos.',
        href: '/fiestas/nueva/proveedores-portal',
        icon: HardHat,
      },
      {
        title: 'Personal en dos fiestas',
        description: 'Reasignación y optimización de staff simultáneo.',
        href: '/recursos-multi-evento',
        icon: Users2,
        permiso: PERMISOS.ORGANIZACION,
      },
      {
        title: 'Edición de Videos',
        description: 'Control y estado del material audiovisual de eventos.',
        href: '/edicion-videos',
        icon: Video,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Simulador IA',
        description: 'Cotizador inteligente interactivo de presupuestos.',
        href: '/simulador-ak',
        icon: Wand2,
      },
      {
        title: 'Facturas',
        description: 'Gestión formal de facturación electrónica y recibos.',
        href: '/invoices',
        icon: FileText,
        permiso: PERMISOS.CONTABILIDAD,
      },
      {
        title: 'Cambios a Aprobar',
        description: 'Solicitudes y modificaciones que requieren autorización.',
        href: '/aprobaciones',
        icon: CheckSquare,
        permiso: PERMISOS.CONTABILIDAD,
      },
      {
        title: 'Métricas del Negocio',
        description: 'Dashboard integral de ganancias, costos y rentabilidad.',
        href: '/empresa/dashboard',
        icon: TrendingUp,
        permiso: PERMISOS.GANANCIAS,
      },
      {
        title: 'Gestión de Empresa',
        description: 'Panel de control de la empresa y módulos maestros.',
        href: '/empresa',
        icon: Building2,
      },
    ],
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    emoji: '⚙️',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 border-slate-300',
    cards: [
      {
        title: 'Ajustes Generales',
        description: 'Configuración global del sistema organizada en una pantalla.',
        href: '/settings',
        icon: Settings,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Tareas Automáticas',
        description: 'Monitoreo de tareas programadas que corren solas.',
        href: '/settings/tareas-automaticas',
        icon: Zap,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Conexiones',
        description: 'Estado de conexión con Google, Meta, MP y WhatsApp.',
        href: '/settings/sincronizaciones',
        icon: LinkIcon,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'WhatsApp',
        description: 'Configuración del robot y envíos automáticos de WhatsApp.',
        href: '/settings/whatsapp',
        icon: MessageCircle,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Cláusulas de Contrato',
        description: 'Condiciones legales y cláusulas del contrato formal.',
        href: '/settings/contratos/clausulas',
        icon: Scale,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Seguridad',
        description: 'Gestión de contraseña y seguridad de tu usuario.',
        href: '/settings/account',
        icon: ShieldCheck,
      },
      {
        title: 'Promociones',
        description: 'Descuentos, señas promocionales y cupones.',
        href: '/settings/promos',
        icon: Tag,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Asistente IA',
        description: 'Instrucciones y personalidad del asistente del sistema.',
        href: '/settings/ai-assistant',
        icon: Bot,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Mapa Tecnológico',
        description: 'Diagrama visual de componentes y dependencias.',
        href: '/settings/mapa-tecnologico-ak',
        icon: Cpu,
        permiso: PERMISOS.ADMINISTRACION,
      },
      {
        title: 'Laboratorio Experimental',
        description: 'Activación de módulos experimentales (feature flags).',
        href: '/settings/feature-flags',
        icon: Wand2,
        permiso: PERMISOS.ADMINISTRACION,
      },
    ],
  },
];

export default async function MasPage() {
  const session = await verifySession();
  if (!session.success || !session.user) {
    redirect('/login');
  }

  const user = session.user;

  // Filtrar tarjetas según los permisos reales del usuario
  const gruposVisibles = GRUPOS_MAS.map((grupo) => {
    const cards = grupo.cards.filter((card) => {
      if (!card.permiso) return true;
      const requeridos = Array.isArray(card.permiso) ? card.permiso : [card.permiso];
      return requeridos.some((p) => puede(user, p));
    });
    return { ...grupo, cards };
  }).filter((grupo) => grupo.cards.length > 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Centro de Módulos</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Más</h1>
          <p className="text-sm text-slate-500 mt-1">
            Todos los recursos, herramientas de campo, marketing y configuraciones de la productora.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Acceso rápido a todo</span>
        </div>
      </div>

      <div className="space-y-10">
        {gruposVisibles.map((grupo) => (
          <section key={grupo.id} className="space-y-4">
            <div className={cn('inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-black tracking-wide', grupo.bgColor, grupo.color)}>
              <span>{grupo.emoji}</span>
              <span>{grupo.label}</span>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {grupo.cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link key={card.href} href={card.href} className="group block h-full">
                    <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all duration-200 h-full min-h-[80px]">
                      <div className={cn('p-3 rounded-xl shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105', grupo.bgColor)}>
                        <Icon className={cn('w-5 h-5', grupo.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {card.title}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
