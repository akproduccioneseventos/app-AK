'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Check, Loader2, Camera, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import { getPresentacionLedSettings, savePresentacionLedSettings } from '@/app/actions/contenido-publico';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { PresentacionLedSettings } from '@/types/contenido-publico';
import { cn } from '@/lib/utils';

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

interface PhotoUploadRowProps {
  id: string;
  label: string;
  currentUrl?: string;
  onUploaded: (id: string, url: string) => void;
}

function PhotoUploadRow({ id, label, currentUrl, onUploaded }: PhotoUploadRowProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(currentUrl || null);
    setImgError(false);
  }, [currentUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'presentacion-led');
      const result = await uploadPublicPageAsset(formData);
      if (result.success && result.url) {
        setPreviewUrl(result.url);
        onUploaded(id, result.url);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5">
      {/* Preview */}
      <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-slate-800/60 border border-white/10 flex items-center justify-center">
        {previewUrl && !imgError && isSafeUrl(previewUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Camera className="h-6 w-6 text-white/30" />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-sm font-medium truncate">{label}</p>
        {previewUrl && !imgError && (
          <p className="text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
            <Check className="h-3 w-3" /> Foto cargada
          </p>
        )}
      </div>

      {/* Upload button */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Subiendo...' : 'Subir foto'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function PresentacionLedConfiguracionPage() {
  const { toast } = useToast();
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [menus, setMenus] = useState<FullMenu[]>([]);
  const [settings, setSettings] = useState<PresentacionLedSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local maps being edited
  const [fotosServicios, setFotosServicios] = useState<Record<string, string>>({});
  const [fotosMenuItems, setFotosMenuItems] = useState<Record<string, string>>({});
  const [planPagosUrl, setPlanPagosUrl] = useState('');
  const [uploadingPlanPagos, setUploadingPlanPagos] = useState(false);
  const planPagosRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [srvs, mnss, cfg] = await Promise.all([
          getServiciosEmpresa(),
          getMenus().catch(() => [] as FullMenu[]),
          getPresentacionLedSettings(),
        ]);
        setServicios(srvs.filter(s => s.tipoItem === 'Servicio' || !s.tipoItem));
        setMenus(mnss);
        setSettings(cfg);
        setFotosServicios(cfg.ledFotosServicios || {});
        setFotosMenuItems(cfg.ledFotosMenuItems || {});
        setPlanPagosUrl(cfg.planPagosImagenUrl || '');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await savePresentacionLedSettings({
        ...settings,
        ledFotosServicios: fotosServicios,
        ledFotosMenuItems: fotosMenuItems,
        planPagosImagenUrl: planPagosUrl,
      });
      toast({ title: 'Guardado', description: 'La configuración fue guardada correctamente.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar. Intentá de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePlanPagosFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadingPlanPagos(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'presentacion-led');
      const result = await uploadPublicPageAsset(formData);
      if (result.success && result.url) {
        setPlanPagosUrl(result.url);
      }
    } finally {
      setUploadingPlanPagos(false);
    }
  };

  // Collect all unique menu items
  const allMenuItems = React.useMemo<MenuItem[]>(() => {
    const seen = new Set<string>();
    const result: MenuItem[] = [];
    for (const menu of menus) {
      for (const item of menu.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      }
    }
    return result;
  }, [menus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/empresa" className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-white font-black text-xl">Fotos del Presentador LED</h1>
            <p className="text-white/40 text-sm">Subí fotos directamente desde tu PC para cada servicio y menú</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Info banner */}
        <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-indigo-300 shrink-0 mt-0.5" />
          <p className="text-indigo-200 text-sm">
            Estas fotos se muestran en el Presentador LED durante la presentación con el cliente.
            Las fotos se suben directamente desde tu computadora y quedan guardadas permanentemente.
          </p>
        </div>

        {/* Plan de pagos image */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4 pb-2 border-b border-white/10">
            Imagen — Slide Plan de Pagos
          </h2>
          <div className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5">
            <div className="h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-slate-800/60 border border-white/10 flex items-center justify-center">
              {planPagosUrl && isSafeUrl(planPagosUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={planPagosUrl} alt="Plan de pagos" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-white/30" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium">Foto de fondo para el slide "Plan de Pagos"</p>
              {planPagosUrl && <p className="text-emerald-400 text-xs flex items-center gap-1 mt-0.5"><Check className="h-3 w-3" /> Cargada</p>}
            </div>
            <button
              type="button"
              disabled={uploadingPlanPagos}
              onClick={() => planPagosRef.current?.click()}
              className="shrink-0 flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {uploadingPlanPagos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadingPlanPagos ? 'Subiendo...' : 'Subir foto'}
            </button>
            <input
              ref={planPagosRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePlanPagosFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </section>

        {/* Services photos */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4 pb-2 border-b border-white/10">
            Fotos por Servicio ({servicios.length})
          </h2>
          {servicios.length === 0 ? (
            <p className="text-white/50 text-sm">No hay servicios configurados.</p>
          ) : (
            <div className="space-y-2">
              {servicios.map(srv => (
                <PhotoUploadRow
                  key={srv.id}
                  id={srv.id}
                  label={`${srv.nombre}${srv.categoria ? ` (${srv.categoria})` : ''}`}
                  currentUrl={fotosServicios[srv.id]}
                  onUploaded={(id, url) => setFotosServicios(prev => ({ ...prev, [id]: url }))}
                />
              ))}
            </div>
          )}
        </section>

        {/* Menu items photos */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4 pb-2 border-b border-white/10">
            Fotos por Ítem de Menú ({allMenuItems.length})
          </h2>
          {allMenuItems.length === 0 ? (
            <p className="text-white/50 text-sm">No hay ítems de menú configurados.</p>
          ) : (
            <div className="space-y-2">
              {allMenuItems.map(item => (
                <PhotoUploadRow
                  key={item.id}
                  id={item.id}
                  label={`${item.name}${item.type ? ` (${item.type})` : ''}`}
                  currentUrl={fotosMenuItems[item.id]}
                  onUploaded={(id, url) => setFotosMenuItems(prev => ({ ...prev, [id]: url }))}
                />
              ))}
            </div>
          )}
        </section>

        {/* Save button at bottom */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 px-8 py-3 text-base"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? 'Guardando...' : 'Guardar todos los cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
