'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Building, Bell, ShieldCheck, Settings as SettingsIcon, Link as LinkIcon,
  HardDriveDownload, Wand2, UserCog, Palette, TrendingUp, Ticket,
  FileSignature, MessageCircle, Bot, ToggleRight, Globe, Image as ImageIcon,
  ChevronRight,
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
    id: 'company',
    label: 'Empresa',
    emoji: '🏢',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
    items: [
      {
        title: 'Información de la Empresa',
        description: 'Actualizá los datos fiscales, de contacto y el logo de tu empresa.',
        href: '/settings/company',
        icon: Building,
      },
      {
        title: 'Cuentas Sociales Vinculadas',
        description: 'Conectá tus redes sociales y gestioná los enlaces de tus perfiles.',
        href: '/settings/social-connections',
        icon: LinkIcon,
      },
      {
        title: 'Accesos para Colaboradores',
        description: 'Creá y gestioná enlaces de acceso para tu equipo (secretaria, DJ, etc.).',
        href: '/settings/accesos-personal',
        icon: UserCog,
      },
    ],
  },
  {
    id: 'web',
    label: 'Página Web / Landing',
    emoji: '🌐',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
    items: [
      {
        title: 'Editor de Landing Page',
        description: 'Modificá textos, colores, imágenes y estadísticas de tu página pública.',
        href: '/empresa/landing-editor',
        icon: Globe,
      },
      {
        title: 'Galería Pública',
        description: 'Subí fotos y videos directamente desde la app para que aparezcan en tu web.',
        href: '/empresa/galeria',
        icon: ImageIcon,
      },
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
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Centro de Control</h1>
          <p className="text-muted-foreground">
            Todas las configuraciones de tu plataforma, ordenadas por sección.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
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
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

