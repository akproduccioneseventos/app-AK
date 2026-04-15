'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Search, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DecoElementSvg } from './deco-svg-elements';

export interface LibraryElement {
  id: string;
  tipo: string;
  label: string;
  categoria: string;
  emoji: string;
  maxColores: number;
  isCustom?: boolean;
  imageDataUri?: string;
}

const LIBRARY_ELEMENTS: LibraryElement[] = [
  // Globos
  { id: 'globo', tipo: 'globo', label: 'Globo', categoria: 'Globos', emoji: '🎈', maxColores: 1 },
  { id: 'globosMacizos', tipo: 'globosMacizos', label: 'Racimo de Globos', categoria: 'Globos', emoji: '🫧', maxColores: 3 },
  // Flores y Plantas
  { id: 'flor', tipo: 'flor', label: 'Flor', categoria: 'Flores y Plantas', emoji: '🌸', maxColores: 2 },
  { id: 'centroMesa', tipo: 'centroMesa', label: 'Centro de Mesa', categoria: 'Flores y Plantas', emoji: '💐', maxColores: 2 },
  // Arcos
  { id: 'arco', tipo: 'arco', label: 'Arco de Globos', categoria: 'Arcos', emoji: '🌈', maxColores: 3 },
  // Lazos
  { id: 'lazo', tipo: 'lazo', label: 'Lazo / Moño', categoria: 'Lazos', emoji: '🎀', maxColores: 1 },
  // Candelabros
  { id: 'candelabro', tipo: 'candelabro', label: 'Candelabro', categoria: 'Candelabros', emoji: '🕯️', maxColores: 1 },
  // Mesas
  { id: 'mesaTorta', tipo: 'mesaTorta', label: 'Mesa Torta', categoria: 'Mesas', emoji: '🎂', maxColores: 1 },
  // Telas
  { id: 'tela', tipo: 'tela', label: 'Tela / Cortina', categoria: 'Telas', emoji: '🪩', maxColores: 1 },
  // Iluminación
  { id: 'estrella', tipo: 'estrella', label: 'Estrella', categoria: 'Iluminación', emoji: '⭐', maxColores: 1 },
  // Otros
  { id: 'corazon', tipo: 'corazon', label: 'Corazón', categoria: 'Otros', emoji: '💖', maxColores: 1 },
  { id: 'mariposa', tipo: 'mariposa', label: 'Mariposa', categoria: 'Otros', emoji: '🦋', maxColores: 2 },
  { id: 'corona', tipo: 'corona', label: 'Corona', categoria: 'Otros', emoji: '👑', maxColores: 1 },
];

const CATEGORIES = ['Globos', 'Flores y Plantas', 'Arcos', 'Lazos', 'Candelabros', 'Mesas', 'Telas', 'Iluminación', 'Otros'];

const FAV_KEY_PREFIX = 'deco-favoritos-';

function getFavs(fiestaId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(FAV_KEY_PREFIX + fiestaId);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function toggleFav(fiestaId: string, elementId: string): string[] {
  const favs = getFavs(fiestaId);
  const next = favs.includes(elementId) ? favs.filter(f => f !== elementId) : [...favs, elementId];
  try { localStorage.setItem(FAV_KEY_PREFIX + fiestaId, JSON.stringify(next)); } catch {}
  return next;
}

interface DecoElementLibraryProps {
  fiestaId: string;
  onAddElement: (element: LibraryElement) => void;
  customElements?: Array<{ id: string; nombre: string; imageDataUri: string }>;
  onUploadCustom?: (file: File) => void;
}

export default function DecoElementLibrary({ fiestaId, onAddElement, customElements = [], onUploadCustom }: DecoElementLibraryProps) {
  const [search, setSearch] = useState('');
  const [favs, setFavs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavs(getFavs(fiestaId));
  }, [fiestaId]);

  const handleToggleFav = (elementId: string) => {
    setFavs(toggleFav(fiestaId, elementId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCustom) {
      onUploadCustom(file);
    }
    // Reset input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = LIBRARY_ELEMENTS.filter(el =>
    el.label.toLowerCase().includes(search.toLowerCase()) ||
    el.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const favElements = LIBRARY_ELEMENTS.filter(el => favs.includes(el.id));

  const customLibraryElements: LibraryElement[] = customElements.map(ce => ({
    id: ce.id,
    tipo: ce.id,
    label: ce.nombre,
    categoria: 'Mis elementos',
    emoji: '🖼️',
    maxColores: 0,
    isCustom: true,
    imageDataUri: ce.imageDataUri,
  }));

  function ElementCard({ el }: { el: LibraryElement }) {
    const isFav = favs.includes(el.id);
    return (
      <div className="relative group">
        <button
          type="button"
          onClick={() => onAddElement(el)}
          className="w-full flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-center"
          title={`Agregar ${el.label}`}
        >
          {el.isCustom && el.imageDataUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={el.imageDataUri.startsWith('data:image/') ? el.imageDataUri : ''} alt={el.label} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center">
              <DecoElementSvg tipo={el.tipo} colores={['#9CA3AF', '#D1D5DB']} size={40} />
            </div>
          )}
          <span className="text-[10px] font-semibold text-slate-600 leading-tight">{el.label}</span>
        </button>
        {!el.isCustom && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleToggleFav(el.id); }}
            className={cn(
              "absolute top-1.5 right-1.5 p-0.5 rounded-full transition-all opacity-0 group-hover:opacity-100",
              isFav ? "opacity-100 text-yellow-500" : "text-slate-300 hover:text-yellow-500"
            )}
            title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Star className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar elemento..."
          className="pl-9 h-9 rounded-xl bg-slate-50 border-none text-sm"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Upload */}
      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-xl gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5 text-xs h-9"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5" /> Subir elemento propio
        </Button>
      </div>

      {search ? (
        /* Search results */
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(el => <ElementCard key={el.id} el={el} />)}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-8">Sin resultados para &quot;{search}&quot;</p>
          )}
        </ScrollArea>
      ) : (
        <Tabs defaultValue="todos" className="flex-1 flex flex-col min-h-0">
          <TabsList className="h-auto flex-wrap gap-1 bg-slate-100 p-1 rounded-xl mb-3 shrink-0">
            <TabsTrigger value="todos" className="text-[10px] rounded-lg px-2 py-1 data-[state=active]:shadow-sm">Todos</TabsTrigger>
            <TabsTrigger value="favs" className="text-[10px] rounded-lg px-2 py-1 data-[state=active]:shadow-sm gap-1">
              <Star className="w-3 h-3" /> Favs
            </TabsTrigger>
            {customLibraryElements.length > 0 && (
              <TabsTrigger value="mios" className="text-[10px] rounded-lg px-2 py-1 data-[state=active]:shadow-sm">Mis elem.</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="todos" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {CATEGORIES.map(cat => {
                const catEls = LIBRARY_ELEMENTS.filter(el => el.categoria === cat);
                if (catEls.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{cat}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {catEls.map(el => <ElementCard key={el.id} el={el} />)}
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="favs" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {favElements.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-xs">Hacé click en ⭐ en cualquier elemento para agregarlo a favoritos</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {favElements.map(el => <ElementCard key={el.id} el={el} />)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {customLibraryElements.length > 0 && (
            <TabsContent value="mios" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 gap-2">
                  {customLibraryElements.map(el => <ElementCard key={el.id} el={el} />)}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
