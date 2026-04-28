'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';
import type { InvitacionDigitalData } from '@/types/fiesta';

// ──────────────────── Types ────────────────────

type TemplateCategoryFilter = 'Todas' | 'XV Años' | 'Boda' | 'Cumpleaños' | 'Infantil' | 'General';

export interface TemplatePickerGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: InvitacionDigitalTemplate[];
  currentData: InvitacionDigitalData;
  onApply: (tpl: InvitacionDigitalTemplate) => void;
  /** Pre-selecciona un tab de categoría */
  defaultCategory?: TemplateCategoryFilter;
  /** tipoCelebracion del evento para auto-seleccionar tab */
  tipoCelebracion?: string;
  isLoading?: boolean;
}

// ──────────────────── Helpers ────────────────────

const CATEGORY_MAP: Record<string, TemplateCategoryFilter> = {
  'XV años': 'XV Años',
  'XV Años': 'XV Años',
  'xv años': 'XV Años',
  'Boda': 'Boda',
  'boda': 'Boda',
  'Cumpleaños': 'Cumpleaños',
  'cumpleaños': 'Cumpleaños',
  'Infantil': 'Infantil',
  'infantil': 'Infantil',
};

const CATEGORY_TABS: { key: TemplateCategoryFilter; label: string }[] = [
  { key: 'Todas', label: '🌐 Todas' },
  { key: 'XV Años', label: '👑 XV Años' },
  { key: 'Boda', label: '💍 Boda' },
  { key: 'Cumpleaños', label: '🎂 Cumpleaños' },
  { key: 'Infantil', label: '🎈 Infantil' },
  { key: 'General', label: '🎉 General' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  'XV Años': '👑',
  'Boda': '💍',
  'Cumpleaños': '🎂',
  'Infantil': '🎈',
  'General': '🎉',
};

// SVG texture patterns as data URIs (inline, no external requests)
const CATEGORY_TEXTURE: Record<string, string> = {
  'XV Años': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 10c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm-8 16c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2zm16 0c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2zm-8 6c-3 0-6 3-6 6s3 6 6 6 6-3 6-6-3-6-6-6z' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
  'Boda': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 20c-2-4-6-4-8 0-2 4 0 8 8 14 8-6 10-10 8-14-2-4-6-4-8 0z' fill='%23ffffff' fill-opacity='0.15'/%3E%3Ccircle cx='15' cy='42' r='5' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2' fill='none'/%3E%3Ccircle cx='45' cy='42' r='5' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2' fill='none'/%3E%3C/g%3E%3C/svg%3E")`,
  'Cumpleaños': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle cx='10' cy='10' r='3' fill='%23ffffff' fill-opacity='0.2'/%3E%3Ccircle cx='30' cy='25' r='2' fill='%23ffffff' fill-opacity='0.2'/%3E%3Ccircle cx='50' cy='15' r='3' fill='%23ffffff' fill-opacity='0.2'/%3E%3Ccircle cx='20' cy='45' r='2' fill='%23ffffff' fill-opacity='0.2'/%3E%3Ccircle cx='45' cy='50' r='3' fill='%23ffffff' fill-opacity='0.2'/%3E%3Cpath d='M15 30l3-3 3 3-3 3z' fill='%23ffffff' fill-opacity='0.15'/%3E%3Cpath d='M40 35l3-3 3 3-3 3z' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
  'Infantil': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cellipse cx='15' cy='20' rx='6' ry='9' stroke='%23ffffff' stroke-opacity='0.2' stroke-width='2' fill='none'/%3E%3Cline x1='15' y1='29' x2='15' y2='38' stroke='%23ffffff' stroke-opacity='0.2' stroke-width='1.5'/%3E%3Cellipse cx='45' cy='18' rx='5' ry='8' stroke='%23ffffff' stroke-opacity='0.2' stroke-width='2' fill='none'/%3E%3Cline x1='45' y1='26' x2='45' y2='35' stroke='%23ffffff' stroke-opacity='0.2' stroke-width='1.5'/%3E%3Cpath d='M25 42l3-3 3 3-3 3z' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
  'General': `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.12' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='4'/%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Ccircle cx='40' cy='0' r='4'/%3E%3Ccircle cx='0' cy='40' r='4'/%3E%3Ccircle cx='40' cy='40' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
};

// ──────────────────── Template Card ────────────────────

interface TemplateCardProps {
  tpl: InvitacionDigitalTemplate;
  isActive: boolean;
  onApply: (tpl: InvitacionDigitalTemplate) => void;
}

function TemplateCard({ tpl, isActive, onApply }: TemplateCardProps) {
  const palette = tpl.cabecera?.paletaColores;
  const primary = palette?.primary ?? '#8b5cf6';
  const secondary = palette?.secondary ?? '#c4b5fd';
  const accent = palette?.accent ?? '#ede9fe';
  const category = tpl.category ?? 'General';
  const emoji = CATEGORY_EMOJI[category] ?? '🎉';
  const texture = CATEGORY_TEXTURE[category] ?? CATEGORY_TEXTURE['General'];
  const protagonista = tpl.cabecera?.protagonista1 || 'Valentina';
  const subtitulo = tpl.cabecera?.subtitulo?.text || category;
  const fontFamily =
    typeof (tpl.cabecera?.subtitulo?.style as { fontFamily?: string } | undefined)?.fontFamily === 'string'
      ? (tpl.cabecera!.subtitulo!.style as { fontFamily: string }).fontFamily
      : 'Georgia, serif';

  return (
    <button
      type="button"
      onClick={() => onApply(tpl)}
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl group w-full ${
        isActive ? 'border-white shadow-2xl ring-2 ring-white/60' : 'border-white/20'
      }`}
      style={{ aspectRatio: '9/16' }}
      title={tpl.name}
    >
      {/* Gradient background using real palette colors */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${primary}ee 0%, ${secondary}cc 50%, ${accent}88 100%)`,
        }}
      />

      {/* Decorative texture overlay by category */}
      <div
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: texture, backgroundRepeat: 'repeat' }}
      />

      {/* Simulated invitation content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 text-center">
        {/* Large emoji */}
        <div className="text-4xl mb-2 drop-shadow-lg">{emoji}</div>
        {/* Protagonist name */}
        <div
          className="text-white text-base font-bold drop-shadow-md leading-tight"
          style={{ fontFamily, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        >
          {protagonista}
        </div>
        {/* Subtitle */}
        <div className="text-white/80 text-[10px] mt-1 leading-snug px-2 line-clamp-2">{subtitulo}</div>
        {/* Color palette preview bands */}
        <div className="flex gap-1 mt-3">
          <div className="w-5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: primary }} />
          <div className="w-5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: secondary }} />
          <div className="w-5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: accent }} />
        </div>
      </div>

      {/* Card footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-3 py-2">
        <p className="text-white text-[11px] font-bold truncate">{tpl.name}</p>
        <p className="text-white/60 text-[9px]">
          {tpl.plantilla === 'Grazia' ? 'Clásica' : tpl.plantilla === 'Allegria' ? 'Moderna' : tpl.plantilla}
        </p>
      </div>

      {/* "Active" badge */}
      {isActive && (
        <div className="absolute top-2 right-2 bg-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg"
          style={{ color: primary }}>
          ✓ Activa
        </div>
      )}

      {/* Hover overlay with "Aplicar" CTA */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span
          className="bg-white font-bold text-xs px-4 py-2 rounded-full shadow-xl"
          style={{ color: primary }}
        >
          Aplicar
        </span>
      </div>
    </button>
  );
}

// ──────────────────── Main Component ────────────────────

export function TemplatePickerGallery({
  open,
  onOpenChange,
  templates,
  currentData,
  onApply,
  defaultCategory,
  tipoCelebracion,
  isLoading = false,
}: TemplatePickerGalleryProps) {
  // Determine initial tab: explicit defaultCategory > mapped from tipoCelebracion > 'Todas'
  const initialCategory: TemplateCategoryFilter = useMemo(() => {
    if (defaultCategory) return defaultCategory;
    if (tipoCelebracion) return CATEGORY_MAP[tipoCelebracion] ?? 'Todas';
    return 'Todas';
  }, [defaultCategory, tipoCelebracion]);

  const [activeCategory, setActiveCategory] = useState<TemplateCategoryFilter>(initialCategory);

  // Reset active tab when the dialog opens
  React.useEffect(() => {
    if (open) {
      setActiveCategory(initialCategory);
    }
  }, [open, initialCategory]);

  const isTemplateActive = (tpl: InvitacionDigitalTemplate) => {
    const palette = tpl.cabecera?.paletaColores;
    const currentPalette = currentData.cabecera?.paletaColores;
    return (
      currentData.plantilla === tpl.plantilla &&
      !!palette &&
      !!currentPalette &&
      palette.primary === currentPalette.primary &&
      palette.secondary === currentPalette.secondary &&
      palette.accent === currentPalette.accent
    );
  };

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'Todas') return templates;
    return templates.filter(tpl => tpl.category === activeCategory);
  }, [templates, activeCategory]);

  const categoryLabel = activeCategory === 'Todas'
    ? `Todas (${templates.length} disponibles)`
    : `${activeCategory} (${filteredTemplates.length} disponibles)`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-black">
            Elegir plantilla · {categoryLabel}
          </DialogTitle>
          <DialogDescription className="flex items-start gap-1.5 text-sm">
            <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
            <span>
              Elegí una plantilla para aplicarla. Los{' '}
              <strong>cambios actuales no guardados se perderán</strong> al aplicar una
              plantilla nueva.
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Category tabs */}
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-6 py-3 border-b bg-slate-50/60 scrollbar-thin">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${
                activeCategory === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-white border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">
              No hay plantillas disponibles para esta categoría.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6">
              {filteredTemplates.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  isActive={isTemplateActive(tpl)}
                  onApply={tpl => {
                    onApply(tpl);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplatePickerGallery;
