import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Share2,
  MessageSquare,
  Globe,
  Tv,
  Camera,
  Target,
  FileText,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Star,
  Layers,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Marketing y Difusión - AK Producciones',
  description: 'Centro unificado de redes, WhatsApp, blog, anuncios, páginas de venta y catálogo.',
};

interface MarketingSection {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  href: string;
  badge?: string;
  external?: boolean;
}

const marketingTools: MarketingSection[] = [
  {
    title: 'Redes Sociales',
    description: 'Instagram, TikTok, Facebook y planificador de publicaciones automáticas.',
    icon: Share2,
    color: 'text-purple-600 bg-purple-100',
    href: '/empresa/redes-sociales',
    badge: 'Contenido',
  },
  {
    title: 'Moderación y Comentarios',
    description: 'Bandeja unificada de mensajes e interacción social.',
    icon: MessageSquare,
    color: 'text-pink-600 bg-pink-100',
    href: '/empresa/social-moderation',
    badge: 'Comunidad',
  },
  {
    title: 'WhatsApp Comercial',
    description: 'Bandeja de mensajes preparados y seguimiento comercial con clientes.',
    icon: MessageCircle,
    color: 'text-emerald-600 bg-emerald-100',
    href: '/contabilidad/crm/outbox',
    badge: 'Ventas',
  },
  {
    title: 'Blog de Eventos',
    description: 'Artículos de posicionamiento web (SEO) y notas semanales automáticas.',
    icon: BookOpen,
    color: 'text-blue-600 bg-blue-100',
    href: '/public/blog',
    badge: 'SEO',
  },
  {
    title: 'Páginas de Aterrizaje',
    description: 'Landing pages de bodas, 15 años, cumpleaños infantiles y experiencia AK.',
    icon: Globe,
    color: 'text-indigo-600 bg-indigo-100',
    href: '/experiencia-ak',
    badge: 'Conversión',
  },
  {
    title: 'Editor Web y Portada',
    description: 'Configuración visual de la portada pública y bloques de promoción.',
    icon: Layers,
    color: 'text-teal-600 bg-teal-100',
    href: '/empresa/landing-builder',
    badge: 'Diseño',
  },
  {
    title: 'Rendimiento de Anuncios',
    description: 'Métricas de campañas publicitarias en Meta Ads y Google Ads.',
    icon: Target,
    color: 'text-amber-600 bg-amber-100',
    href: '/contabilidad/crm/marketing-ads',
    badge: 'Inversión',
  },
  {
    title: 'Ficha de Google y Reseñas',
    description: 'Conexión con Google Business, testimonios de clientes y encuestas NPS.',
    icon: Star,
    color: 'text-yellow-600 bg-yellow-100',
    href: '/settings/social-connections',
    badge: 'Reputación',
  },
  {
    title: 'Galería y Catálogo',
    description: 'Muestrario fotográfico y servicios disponibles para clientes e invitados.',
    icon: Camera,
    color: 'text-rose-600 bg-rose-100',
    href: '/galeria',
    badge: 'Portafolio',
  },
  {
    title: 'Presentación LED',
    description: 'Presentación comercial en pantalla gigante para reuniones con novios y quinceañeras.',
    icon: Tv,
    color: 'text-violet-600 bg-violet-100',
    href: '/presentacion-led',
    badge: 'Showroom',
    external: true,
  },
];

export default function MarketingHubPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Módulo Unificado</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Marketing y Difusión</h1>
          <p className="text-sm text-slate-500 mt-1">
            Redes, WhatsApp, blog, anuncios, páginas de venta, catálogo y presentación LED en un solo lugar.
          </p>
        </div>
      </div>

      {/* Grid de herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {marketingTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.title}
              className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-white flex flex-col justify-between group overflow-hidden"
            >
              <CardHeader className="p-5 pb-3 space-y-3">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl ${tool.color} group-hover:scale-105 transition-transform shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {tool.badge && (
                    <Badge variant="secondary" className="rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 group-hover:text-primary transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between rounded-xl font-bold text-xs text-primary group-hover:bg-primary/5 transition-colors"
                >
                  <Link href={tool.href} target={tool.external ? '_blank' : undefined}>
                    <span>Abrir herramienta</span>
                    {tool.external ? (
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
