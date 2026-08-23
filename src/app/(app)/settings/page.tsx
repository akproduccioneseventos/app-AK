'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Bot,
  Building,
  Calendar,
  ChevronRight,
  Database,
  FileSignature,
  FileText,
  Globe,
  HardDriveDownload,
  Image,
  Layers,
  Link as LinkIcon,
  MessageCircle,
  Package,
  Palette,
  Search,
  Settings as SettingsIcon,
  Share2,
  Shield,
  ShieldCheck,
  Ticket,
  ToggleRight,
  TrendingUp,
  UserCog,
  Users,
  Wand2,
  X,
  Zap,
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
    id: 'ventas',
    label: 'Ventas y presupuestos',
    emoji: '📄',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    items: [
      {
        title: 'Configuración de Presupuestos y Simulador',
        description: 'Textos, presentación, paquetes y reglas comerciales del presupuesto.',
        href: '/settings/budget-display',
        icon: Wand2,
      },
      {
        title: 'Cupones y Descuentos',
        description: 'Códigos promocionales, vigencia y límite de usos.',
        href: '/settings/cupones',
        icon: Ticket,
      },
      {
        title: 'Ajuste Anual de Precios',
        description: 'Ajuste masivo de precios y costos del catálogo.',
        href: '/settings/ajuste-precios',
        icon: TrendingUp,
      },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catálogo y servicios',
    emoji: '📦',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-200',
    items: [
      {
        title: 'Catálogo de Servicios',
        description: 'Servicios, precios, costos y método de cálculo.',
        href: '/empresa/servicios',
        icon: Package,
      },
      {
        title: 'Paquetes de Armado Rápido',
        description: 'Básico, Intermedio y Premium para simulador y presupuestos.',
        href: '/settings/catalogo-servicios',
        icon: Layers,
      },
    ],
  },
  {
    id: 'contratos',
    label: 'Contratos y documentos',
    emoji: '📝',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    items: [
      {
        title: 'Plantilla de Contrato Legal',
        description: 'Texto base del contrato con etiquetas dinámicas.',
        href: '/settings/contratos',
        icon: FileSignature,
      },
      {
        title: 'Gestión de Plantillas',
        description: 'Plantillas reutilizables de tareas, diseños e invitaciones.',
        href: '/settings/templates',
        icon: Palette,
      },
    ],
  },
  {
    id: 'comunicacion',
    label: 'WhatsApp y comunicación',
    emoji: '💬',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    items: [
      {
        title: 'Integración WhatsApp',
        description: 'Modo manual o automático, recordatorios y estado de conexión.',
        href: '/settings/whatsapp',
        icon: MessageCircle,
      },
      {
        title: 'Plantillas de Mensajes',
        description: 'Mensajes para presupuestos, contratos y confirmaciones.',
        href: '/settings/whatsapp-templates',
        icon: MessageCircle,
      },
      {
        title: 'WhatsApp Business Bot',
        description: 'Atención automática conectada a CRM y marketing.',
        href: '/settings/whatsapp-business',
        icon: Bot,
      },
    ],
  },
  {
    id: 'integraciones',
    label: 'Sincronizaciones activas',
    emoji: '🔗',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    items: [
      {
        title: 'Agentes Autónomos',
        description: 'Control, pausado y rastro de actividad de los 5 agentes autónomos.',
        href: '/settings/agentes-autonomos',
        icon: Bot,
      },
      {
        title: 'Tareas Automáticas',
        description: 'Estado real de las 4 tareas que corren solas (blog, redes, posteos, cuotas).',
        href: '/settings/tareas-automaticas',
        icon: Zap,
      },
      {
        title: 'Centro de Integraciones y Conexiones',
        description: 'Estado de conexión con Google, WhatsApp, Meta, Mercado Pago y redes.',
        href: '/settings/sincronizaciones',
        icon: Zap,
      },
      {
        title: 'Google Workspace',
        description: 'Sincronización de eventos y correos con tu cuenta Google.',
        href: '/settings/google-workspace',
        icon: Calendar,
      },
      {
        title: 'Cuentas Sociales',
        description: 'Gestionar perfiles de Instagram, TikTok y Facebook de la productora.',
        href: '/settings/social-connections',
        icon: Share2,
      },
    ],
  },
  {
    id: 'empresa',
    label: 'Empresa y equipo',
    emoji: '👥',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    items: [
      {
        title: 'Información de la Empresa',
        description: 'Datos fiscales, contacto y logo.',
        href: '/settings/company',
        icon: Building,
      },
      {
        title: 'Accesos para Colaboradores',
        description: 'Accesos para secretaria, personal y colaboradores.',
        href: '/settings/accesos-personal',
        icon: UserCog,
      },
      {
        title: 'Cuentas Staff y Permisos',
        description: 'Registrar colaboradores con email/contraseña y definir roles y permisos del sistema.',
        href: '/admin/usuarios',
        icon: Users,
      },
      {
        title: 'Cuentas Sociales',
        description: 'Conexión y gestión de redes sociales.',
        href: '/settings/social-connections',
        icon: LinkIcon,
      },
      {
        title: 'Portal de Clientes',
        description: 'Configuración del portal donde el cliente ve su evento.',
        href: '/portal-cliente',
        icon: Globe,
      },
    ],
  },
  {
    id: 'web',
    label: 'Web y presentación',
    emoji: '🌐',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
    items: [
      {
        title: 'Editor de Landing Page',
        description: 'Textos, colores e imágenes de la web pública.',
        href: '/empresa/landing-editor',
        icon: Globe,
      },
      {
        title: 'Editor de Contenido Público',
        description: 'Contenido de presentación LED y catálogo por tipo de fiesta.',
        href: '/settings/contenido-publico',
        icon: FileText,
      },
      {
        title: 'Galería Pública',
        description: 'Fotos y videos visibles en la web.',
        href: '/empresa/galeria',
        icon: Image,
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema y seguridad',
    emoji: '⚙️',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
    items: [
      {
        title: 'Seguridad y Cuenta',
        description: 'Contraseña, recuperación y opciones de seguridad.',
        href: '/settings/account',
        icon: ShieldCheck,
      },
      {
        title: 'Notificaciones',
        description: 'Alertas y avisos importantes.',
        href: '/settings/notifications',
        icon: Bell,
      },
      {
        title: 'Feature Flags',
        description: 'Activar o pausar funciones del sistema.',
        href: '/settings/feature-flags',
        icon: ToggleRight,
      },
      {
        title: 'Administración de Datos',
        description: 'Gestión delicada de datos de CRM, presupuestos y planificador.',
        href: '/settings/datos',
        icon: Database,
      },
      {
        title: 'Auditoría',
        description: 'Registro de actividad y cambios del sistema.',
        href: '/auditoria',
        icon: Shield,
      },
      {
        title: 'Backup y Restauración',
        description: 'Descargar o restaurar respaldos de datos.',
        href: '/settings/backup',
        icon: HardDriveDownload,
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
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración</h1>
          <p className="text-muted-foreground">Accesos de configuración ordenados, sin repetir módulos operativos.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar configuración..."
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
