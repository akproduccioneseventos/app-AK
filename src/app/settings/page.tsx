'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Database,
  DollarSign,
  FileSignature,
  FileText,
  Files,
  Globe,
  HardDriveDownload,
  Image,
  Layers,
  Link as LinkIcon,
  ListChecks,
  MessageCircle,
  MessageSquare,
  Monitor,
  Package,
  PackagePlus,
  Palette,
  Play,
  Printer,
  Search,
  Send,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Ticket,
  ToggleRight,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wand2,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

interface SettingSection {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  items: SettingItem[];
}

const SECTIONS: SettingSection[] = [
  {
    id: 'modulos',
    label: 'Módulos Principales',
    emoji: '🎯',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    items: [
      { title: 'Eventos Activos', description: 'Planificación y seguimiento de todos los eventos.', href: '/eventos', icon: CalendarClock },
      { title: 'Calendario', description: 'Vista agenda con todas las fechas importantes.', href: '/calendario', icon: CalendarDays },
      { title: 'Presupuestos', description: 'Ver todos los presupuestos generados.', href: '/presupuestos', icon: Files },
      { title: 'Nuevo Presupuesto', description: 'Crear una cotización manual.', href: '/presupuestos/nuevo/crear', icon: FileText },
      { title: 'CRM / Seguimiento', description: 'Prospectos, leads y pipeline de ventas.', href: '/contabilidad/crm', icon: ListChecks },
      { title: 'Base de Clientes', description: 'Directorio completo de clientes.', href: '/customers', icon: Users },
      { title: 'Pagos Rápidos', description: 'Registrar cobros y enviar recibos.', href: '/pagos-rapidos', icon: Wallet },
      { title: 'Historial de Eventos', description: 'Eventos archivados y fiestas pasadas.', href: '/fiestas', icon: Archive },
    ],
  },
  {
    id: 'ai',
    label: 'Asistente IA',
    emoji: '🤖',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50 border-violet-200',
    items: [
      {
        title: 'Configurar Asistente AK',
        description: 'Escribí instrucciones personalizadas para que el Asistente hable como vos: descuentos, estilo, reglas de negocio.',
        href: '/settings/ai-assistant',
        icon: Bot,
      },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catálogo & Facturación',
    emoji: '📦',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-200',
    items: [
      {
        title: 'Catálogo de Servicios',
        description: 'Ver, agregar, editar y eliminar los +60 servicios con precios de venta y costos. Ajuste masivo de precios.',
        href: '/empresa/servicios',
        icon: Package,
      },
      {
        title: 'Catálogo de Servicios & Paquetes',
        description: 'Ver todos los servicios con precios y los 3 paquetes configurados. Acceso directo al catálogo completo.',
        href: '/settings/catalogo-servicios',
        icon: Package,
      },
      {
        title: 'Paquetes de Armado Rápido',
        description: 'Configurá los 3 paquetes (Básico, Intermedio, Premium) con sus servicios incluidos y precios. Se usan en el simulador y presupuestos.',
        href: '/settings/budget-display',
        icon: Layers,
      },
      {
        title: 'Nuevo Servicio',
        description: 'Agregar un nuevo servicio al catálogo con precio, costo y método de cálculo.',
        href: '/empresa/servicios/nuevo',
        icon: PackagePlus,
      },
      {
        title: 'Facturas',
        description: 'Ver y gestionar todas las facturas emitidas.',
        href: '/invoices',
        icon: FileText,
      },
      {
        title: 'Reporte de Servicios',
        description: 'Ver el reporte imprimible del catálogo de servicios.',
        href: '/empresa/reporte-servicios',
        icon: Printer,
      },
    ],
  },
  {
    id: 'sales',
    label: 'Presupuestos y Ventas',
    emoji: '📄',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    items: [
      {
        title: 'Configuración de Presupuestos y Simulador',
        description: 'Ajustá opciones de presentación, mensajes, características de venta y paquetes automáticos.',
        href: '/settings/budget-display',
        icon: Wand2,
      },
      {
        title: 'Ajuste Anual de Precios',
        description: 'Aplicá ajustes porcentuales masivos a precios y costos de tu catálogo de servicios.',
        href: '/settings/ajuste-precios',
        icon: TrendingUp,
      },
      {
        title: 'Cupones y Descuentos',
        description: 'Creá cupones promocionales con código, vigencia y límite de usos.',
        href: '/settings/cupones',
        icon: Ticket,
      },
    ],
  },
  {
    id: 'finanzas',
    label: 'Contabilidad & Finanzas',
    emoji: '📊',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    items: [
      { title: 'Panel Financiero', description: 'Dashboard financiero, flujo de caja y KPIs.', href: '/empresa/contabilidad', icon: BarChart3 },
      { title: 'Facturas', description: 'Gestión de facturas emitidas.', href: '/invoices', icon: FileText },
      { title: 'Compras', description: 'Registro de compras e insumos.', href: '/compras', icon: ShoppingCart },
      { title: 'Proveedores', description: 'Gestión de proveedores y contactos.', href: '/proveedores', icon: Truck },
      { title: 'Analíticas', description: 'Reportes avanzados y estadísticas de ventas.', href: '/analytics', icon: BarChart3 },
      { title: 'Contabilidad General', description: 'Panel contable completo.', href: '/contabilidad', icon: DollarSign },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp & Automatizaciones',
    emoji: '💬',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    items: [
      {
        title: 'Integración WhatsApp',
        description: 'Activá o pausá la integración, elegí entre modo automático o manual y configurá recordatorios.',
        href: '/settings/whatsapp',
        icon: MessageCircle,
      },
      {
        title: 'Plantillas de Mensajes',
        description: 'Editá los mensajes predefinidos para compartir presupuestos, contratos, bienvenidas y confirmaciones.',
        href: '/settings/whatsapp-templates',
        icon: MessageCircle,
      },
      {
        title: 'WhatsApp Business Bot',
        description: 'Chatbot automático para atender clientes. Integrado con CRM y Marketing.',
        href: '/settings/whatsapp-business',
        icon: Bot,
      },
      {
        title: 'Envíos de WhatsApp del Día',
        description: 'Ver mensajes programados y envíos pendientes del día.',
        href: '/contabilidad/crm/outbox',
        icon: Send,
      },
    ],
  },
  {
    id: 'contracts',
    label: 'Plantillas de Contratos',
    emoji: '📝',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    items: [
      {
        title: 'Plantilla de Contrato Legal',
        description: 'Editá el texto base del contrato (servicios y salón) con etiquetas dinámicas. Se autocompleta al generar desde cada evento.',
        href: '/settings/contratos',
        icon: FileSignature,
      },
      {
        title: 'Gestión de Plantillas',
        description: 'Creá y administrá plantillas reutilizables para tareas, diseños, invitaciones y más.',
        href: '/settings/templates',
        icon: Palette,
      },
    ],
  },
  {
    id: 'equipo',
    label: 'Empresa & Equipo',
    emoji: '👥',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    items: [
      { title: 'Información de la Empresa', description: 'Datos fiscales, contacto y logo.', href: '/settings/company', icon: Building },
      { title: 'Empleados', description: 'Gestión del equipo y personal.', href: '/empleados', icon: Users },
      { title: 'Accesos para Colaboradores', description: 'Crear accesos para secretaria, DJ, etc.', href: '/settings/accesos-personal', icon: UserCog },
      { title: 'Cuentas Sociales', description: 'Conectar y gestionar redes sociales.', href: '/settings/social-connections', icon: LinkIcon },
      { title: 'Portal de Clientes', description: 'Portal donde los clientes ven su evento.', href: '/portal-cliente', icon: Globe },
      { title: 'Portal de Proveedores', description: 'Portal para proveedores.', href: '/portal-proveedor', icon: Truck },
    ],
  },
  {
    id: 'web',
    label: 'Web & Presentación',
    emoji: '🌐',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
    items: [
      { title: 'Editor de Landing Page', description: 'Modificar textos, colores e imágenes de la página pública.', href: '/empresa/landing-editor', icon: Globe },
      { title: 'Galería Pública', description: 'Fotos y videos de la galería web.', href: '/empresa/galeria', icon: Image },
      { title: 'Modo Presentación LED', description: 'Pantalla kiosco para reuniones con clientes.', href: '/presentacion', icon: Monitor },
      { title: 'Catálogo Digital por Tipo de Fiesta', description: 'Presentación por tipo: cumpleaños, casamientos, corporativos, etc.', href: '/catalogo', icon: BookOpen },
      { title: 'Video de Vida', description: 'Generador de video memorial.', href: '/video-vida', icon: Play },
    ],
  },
  {
    id: 'backup',
    label: 'Backup & Restauración',
    emoji: '💾',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    items: [
      {
        title: 'Backup y Restauración',
        description: 'Generá y descargá un respaldo ZIP completo de tus datos, o restaurá desde un archivo ZIP previo.',
        href: '/settings/backup',
        icon: HardDriveDownload,
      },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    emoji: '⚙️',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
    items: [
      {
        title: 'Feature Flags & Tiers de Servicio',
        description: 'Activá o desactivá módulos según el tier de cada cliente. Gestioná overrides globales.',
        href: '/settings/feature-flags',
        icon: ToggleRight,
      },
      {
        title: 'Notificaciones',
        description: 'Configurá cómo y cuándo recibir alertas y avisos.',
        href: '/settings/notifications',
        icon: Bell,
      },
      {
        title: 'Seguridad y Cuenta',
        description: 'Gestioná tu contraseña y opciones de seguridad.',
        href: '/settings/account',
        icon: ShieldCheck,
      },
      {
        title: 'Administración de Datos',
        description: 'Reiniciá o eliminá permanentemente los datos de CRM, Presupuestos y Planificador directamente desde Firestore.',
        href: '/settings/datos',
        icon: Database,
      },
      {
        title: 'Auditoría',
        description: 'Registro de actividad y cambios en el sistema.',
        href: '/auditoria',
        icon: Shield,
      },
      {
        title: 'Feedback',
        description: 'Comentarios y sugerencias de mejora.',
        href: '/settings/feedback',
        icon: MessageSquare,
      },
    ],
  },
];

export default function SettingsPage() {
  const [query, setQuery] = useState('');

  const filteredSections = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return SECTIONS;

    return SECTIONS.map((section) => {
      const sectionMatches = section.label.toLowerCase().includes(term);
      const items = section.items.filter((item) => {
        if (sectionMatches) return true;
        const text = `${item.title} ${item.description} ${item.href}`.toLowerCase();
        return text.includes(term);
      });
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [query]);

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar módulos, secciones o rutas..."
          className="pl-10 pr-10 h-11"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Centro de Control</h1>
          <p className="text-muted-foreground">Todas las configuraciones de tu plataforma, ordenadas por sección.</p>
        </div>
      </div>

      {filteredSections.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No se encontraron secciones para "{query}".
        </div>
      ) : (
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <div key={section.id}>
              <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold mb-4', section.bgColor, section.color)}>
                <span>{section.emoji}</span>
                <span>{section.label}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href} className="group block">
                    <div className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all h-full">
                      <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', section.bgColor)}>
                        <item.icon className={cn('w-5 h-5', section.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{item.title}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
