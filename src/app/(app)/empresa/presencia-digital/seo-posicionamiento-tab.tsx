'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getSeoPosicionamientoData,
  type ResumenSeoPosicionamiento,
} from '@/app/actions/seo-posicionamiento';

export function SeoPosicionamientoTab() {
  const [data, setData] = useState<ResumenSeoPosicionamiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarGuiaGsc, setMostrarGuiaGsc] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await getSeoPosicionamientoData();
      setData(res);
    } catch (err) {
      console.error('Error al cargar datos de posicionamiento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
        <p className="text-sm font-medium">Auditando páginas de venta y mapa del sitio para Google...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
        <p>No se pudieron cargar los datos de posicionamiento.</p>
        <Button onClick={cargarDatos} variant="outline" size="sm" className="mt-3">
          Reintentar
        </Button>
      </div>
    );
  }

  const {
    paginasDeVentaTotal,
    notasDelBlogTotal,
    totalUrlsEnSitemap,
    ultimaNotaPublicada,
    ultimaPublicacionGoogle,
    auditoriaMetadatos,
    googleSearchConsole,
  } = data;

  return (
    <div className="space-y-6">
      {/* Encabezado del bloque */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            ¿Cómo nos ve Google hoy?
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Estado real del posicionamiento de AK Producciones: mapa del sitio, páginas preparadas y qué busca la gente.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={cargarDatos}
            disabled={loading}
            className="text-xs gap-1.5 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            Ver Mapa (sitemap.xml) <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 1. Qué tiene la app para Google */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Páginas de venta</span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white">{paginasDeVentaTotal}</div>
          <p className="text-xs text-slate-400">
            Bodas, 15 años, cumpleaños, catálogo y simulador listos para Google.
          </p>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Notas en el Blog</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{notasDelBlogTotal}</div>
          <p className="text-xs text-slate-400">
            Artículos con consejos y palabras clave sobre eventos en Salto.
          </p>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total en el Mapa</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalUrlsEnSitemap}</div>
          <p className="text-xs text-slate-400">
            Direcciones públicas que Google lee y actualiza solo.
          </p>
        </div>
      </div>

      {/* Perfil de Empresa en Google (Google Business) */}
      <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Perfil de Empresa en Google (Google Business):</span>
            <p className="font-bold text-white text-sm">
              {ultimaPublicacionGoogle
                ? `Última publicación: ${new Date(ultimaPublicacionGoogle.fecha).toLocaleDateString('es-UY')}`
                : 'Sin publicaciones en Google Business todavía'}
            </p>
            <p className="text-xs text-slate-400">
              Publicar novedades y fotos de eventos ayuda a aparecer en los primeros resultados locales y Google Maps en Salto.
            </p>
          </div>
        </div>
        <a
          href="/empresa/redes-sociales"
          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition"
        >
          Planificador de Redes <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Última nota publicada */}
      {ultimaNotaPublicada && (
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Última nota publicada:</span>
              <p className="font-bold text-white text-sm">{ultimaNotaPublicada.titulo}</p>
              <p className="text-xs text-slate-400">Publicada: {ultimaNotaPublicada.fecha}</p>
            </div>
          </div>
          <a
            href={`/public/blog/${ultimaNotaPublicada.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition"
          >
            Leer nota <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* 2. Control de Salud de Metadatos (Títulos y Descripciones) */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Salud de títulos y descripciones</h3>
          </div>
          {auditoriaMetadatos.estadoSalud === 'optimo' ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Todo completo
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Requiere revisión
            </span>
          )}
        </div>

        {auditoriaMetadatos.estadoSalud === 'optimo' ? (
          <p className="text-xs text-slate-300 leading-relaxed">
            ✅ Las <strong>{auditoriaMetadatos.paginasAuditadas} páginas de venta</strong> tienen título y descripción optimizados para que los clientes vean de qué se trata antes de hacer clic en Google.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            <p className="text-amber-300 font-semibold">
              Se detectaron páginas que necesitan título o descripción:
            </p>
            {auditoriaMetadatos.paginasSinTitulo.length > 0 && (
              <p className="text-slate-400">
                • Sin título: {auditoriaMetadatos.paginasSinTitulo.join(', ')}
              </p>
            )}
            {auditoriaMetadatos.paginasSinDescripcion.length > 0 && (
              <p className="text-slate-400">
                • Sin descripción: {auditoriaMetadatos.paginasSinDescripcion.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Google Search Console & Consultas Reales */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Google Search Console</h3>
              <p className="text-xs text-slate-400">Mide qué busca la gente en Google para llegar a AK Producciones.</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1 ${
              googleSearchConsole.conectada
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {googleSearchConsole.conectada ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectada
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" /> Falta vincular
              </>
            )}
          </span>
        </div>

        {/* Resumen explicativo sin números falsos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gente que vio la web en Google
            </span>
            <p className="text-lg font-black text-white mt-0.5">{googleSearchConsole.metricaVistas}</p>
            <p className="text-xs text-slate-500 mt-0.5">Veces que aparecimos en resultados de búsqueda.</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Visitas que entraron a la web
            </span>
            <p className="text-lg font-black text-white mt-0.5">{googleSearchConsole.metricaClics}</p>
            <p className="text-xs text-slate-500 mt-0.5">Personas que tocaron el enlace y visitaron el sitio.</p>
          </div>
        </div>

        {/* Términos objetivo que apunta el sitio */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-300">
              Búsquedas objetivo para las que está preparado el contenido en Salto:
            </span>
            <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 self-start sm:self-auto">
              Palabras clave objetivo
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Son los términos para los cuales se optimizan las páginas y notas del blog. Las mediciones de clics y consultas reales de Google Search Console se verán reflejadas una vez vinculada la propiedad.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {googleSearchConsole.terminosBuscados.map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
              >
                🎯 &ldquo;{t}&rdquo;
              </span>
            ))}
          </div>
        </div>

        {/* Guía paso a paso */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setMostrarGuiaGsc(!mostrarGuiaGsc)}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {mostrarGuiaGsc ? 'Ocultar paso a paso de Google Search Console' : '¿Cómo conectar Google Search Console gratis?'}
          </button>

          {mostrarGuiaGsc && (
            <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white text-sm mb-1">Pasos para vincular tu dominio:</p>
              <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                {googleSearchConsole.guiaPasoAPaso.map((paso, index) => (
                  <li key={index}>{paso}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
