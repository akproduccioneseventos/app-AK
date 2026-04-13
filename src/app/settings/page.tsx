'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bot,
  MessageCircle,
  FileText,
  FileSignature,
  Building,
  Globe,
  HardDriveDownload,
  ChevronRight,
  Settings as SettingsIcon,
} from 'lucide-react';

// ─── Section definitions ────────────────────────────────────────────────────

interface SettingsItem {
  title: string;
  description: string;
  href: string;
  badge?: string;
}

interface Section {
  id: string;
  label: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  items: SettingsItem[];
}

const SECTIONS: Section[] = [
  {
    id: 'asistente',
    label: 'Asistente IA',
    emoji: '🤖',
    icon: Bot,
    color: 'text-violet-600',
    items: [
      {
        title: 'Personalidad e Instrucciones',
        description: 'Configurá las reglas, tono y comportamiento personalizado del Asistente AK. Tus instrucciones se aplican en cada conversación.',
        href: '/settings/ai-assistant',
        badge: 'Nuevo',
      },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp & Automatizaciones',
    emoji: '💬',
    icon: MessageCircle,
    color: 'text-green-600',
    items: [
      {
        title: 'Integración WhatsApp',
        description: 'Activá o pausá la integración, elegí entre modo automático o manual y configurá reglas de automatización.',
        href: '/settings/whatsapp',
      },
      {
        title: 'Plantillas de Mensajes',
        description: 'Editá los mensajes predefinidos para presupuestos, contratos, bienvenidas y confirmaciones.',
        href: '/settings/whatsapp-templates',
      },
      {
        title: 'WhatsApp Business Bot',
        description: 'Chatbot automático para atender clientes. Integrado con el CRM y Marketing.',
        href: '/settings/whatsapp-business',
      },
    ],
  },
  {
    id: 'presupuestos',
    label: 'Presupuestos y Ventas',
    emoji: '📄',
    icon: FileText,
    color: 'text-amber-600',
    items: [
      {
        title: 'Configuración de Presupuestos y Simulador',
        description: 'Ajustá las opciones de presentación, mensajes de éxito, paquetes automáticos y el simulador.',
        href: '/settings/budget-display',
      },
      {
        title: 'Ajuste Anual de Precios',
        description: 'Aplicá ajustes porcentuales masivos a precios y costos de tu catálogo.',
        href: '/settings/ajuste-precios',
      },
      {
        title: 'Cupones y Descuentos',
        description: 'Creá cupones promocionales con código, vigencia y límite de usos.',
        href: '/settings/cupones',
      },
    ],
  },
  {
    id: 'contratos',
    label: 'Plantillas de Contratos',
    emoji: '📝',
    icon: FileSignature,
    color: 'text-blue-600',
    items: [
      {
        title: 'Contrato Legal de Servicios',
        description: 'Editá el texto base del contrato con etiquetas dinámicas ({{CLIENTE_NOMBRE}}, {{SENIA}}, etc.). Se completa automáticamente desde cada evento.',
        href: '/settings/contratos',
      },
      {
        title: 'Contrato para Salón',
        description: 'Plantilla específica para contratos de alquiler o uso de salón. Se autocompleta con los datos del evento.',
        href: '/settings/templates/contrato',
      },
      {
        title: 'Gestión de Plantillas',
        description: 'Administrá plantillas reutilizables para tareas, diseños, invitaciones y más.',
        href: '/settings/templates',
      },
    ],
  },
  {
    id: 'empresa',
    label: 'Empresa',
    emoji: '🏢',
    icon: Building,
    color: 'text-indigo-600',
    items: [
      {
        title: 'Información de la Empresa',
        description: 'Actualizá los datos fiscales, de contacto, logo y redes sociales.',
        href: '/settings/company',
      },
      {
        title: 'Cuentas Sociales Vinculadas',
        description: 'Conectá tus redes sociales y gestioná los enlaces de tus perfiles.',
        href: '/settings/social-connections',
      },
      {
        title: 'Accesos para Colaboradores',
        description: 'Creá y gestioná enlaces de acceso para tu equipo (secretaria, DJ, etc.).',
        href: '/settings/accesos-personal',
      },
    ],
  },
  {
    id: 'landing',
    label: 'Página Web / Landing',
    emoji: '🌐',
    icon: Globe,
    color: 'text-cyan-600',
    items: [
      {
        title: 'Editor de Landing Page',
        description: 'Editá los textos, imágenes y colores de tu página web pública directamente desde acá.',
        href: '/empresa/landing-editor',
      },
      {
        title: 'Galería Pública',
        description: 'Subí fotos y videos que aparecerán en tu página web.',
        href: '/empresa/galeria',
      },
    ],
  },
  {
    id: 'backup',
    label: 'Backup & Restauración',
    emoji: '💾',
    icon: HardDriveDownload,
    color: 'text-slate-600',
    items: [
      {
        title: 'Backup y Restauración',
        description: 'Descargá un respaldo completo de todos tus datos en formato ZIP. También podés restaurar desde un archivo ZIP previamente descargado.',
        href: '/settings/backup',
        badge: 'Restaurar ZIP',
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    emoji: '⚙️',
    icon: SettingsIcon,
    color: 'text-slate-500',
    items: [
      {
        title: 'Feature Flags & Tiers de Servicio',
        description: 'Activá o desactivá módulos según el tier de cada cliente.',
        href: '/settings/feature-flags',
      },
      {
        title: 'Notificaciones',
        description: 'Configurá cómo y cuándo recibir alertas y avisos.',
        href: '/settings/notifications',
      },
      {
        title: 'Seguridad y Cuenta',
        description: 'Gestioná tu contraseña y opciones de seguridad.',
        href: '/settings/account',
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  const currentSection = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Centro de Control</h1>
          <p className="text-muted-foreground">Toda la configuración de tu app en un solo lugar, bien organizada.</p>
        </div>
      </div>

      {/* Two-column layout: tabs + content */}
      <div className="flex gap-6 min-h-[600px]">
        {/* Vertical tabs */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-1 sticky top-6">
            {SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left',
                  activeSection === section.id
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span className="text-lg leading-none">{section.emoji}</span>
                <span className="flex-1">{section.label}</span>
                {activeSection === section.id && (
                  <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <currentSection.icon className={cn('w-6 h-6', currentSection.color)} />
              <div>
                <h2 className="text-xl font-bold font-headline">{currentSection.emoji} {currentSection.label}</h2>
              </div>
            </div>

            {/* Settings items */}
            <div className="space-y-3">
              {currentSection.items.map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="group flex items-center gap-4 p-5 border border-slate-100 rounded-2xl bg-white hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 shadow-sm cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
