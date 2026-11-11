'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Download,
  ExternalLink,
  ShieldAlert,
  Loader2,
  FolderDown,
  Wrench,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getMisPermisos } from '@/app/actions/sesion';
import { PERMISOS } from '@/lib/auth/perfiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EdicionVideosPage() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let montado = true;

    async function verificarPermisos() {
      try {
        const misPerms = await getMisPermisos();
        const tieneAdmin = misPerms.permisos.includes(PERMISOS.ADMINISTRACION);
        if (!montado) return;
        setAutorizado(tieneAdmin);
      } catch (err) {
        console.error('[Edición de Videos] Error verificando permisos:', err);
        if (montado) setAutorizado(false);
      } finally {
        if (montado) setCargando(false);
      }
    }

    verificarPermisos();
    return () => {
      montado = false;
    };
  }, []);

  if (cargando) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">Cargando Edición de Videos...</h2>
        <p className="text-sm text-slate-500">Verificando accesos de administración.</p>
      </div>
    );
  }

  if (autorizado === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-slate-600 text-sm">
          La sección de Edición de Videos está reservada para el dueño y administradores generales de AK Producciones.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#d71920] flex items-center justify-center text-white shadow-md shadow-red-200">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                AK Editor Inteligente
              </h1>
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs font-semibold">
                Local
              </Badge>
            </div>
            <p className="text-slate-600 text-sm mt-1">
              Edición de videos de fiestas y eventos, preparada automáticamente para terminar en Filmora 16.
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="bg-[#d71920] hover:bg-[#b0141a] text-white gap-2 shadow-sm font-semibold">
            <a href="/descargas/ak-editor.zip" download="ak-editor.zip">
              <Download className="w-4 h-4" />
              Bajar AK Editor
            </a>
          </Button>

          <Button asChild variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50 gap-2 font-semibold">
            <a href="http://localhost:8765" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 text-red-600" />
              Abrir AK Editor
            </a>
          </Button>
        </div>
      </div>

      {/* Aviso de funcionamiento local */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-sm text-slate-700">
        <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">¿No abre el editor?</span>{' '}
          Abrí AK Editor en tu computadora (doble clic en el ícono del escritorio). El programa corre 100% en tu máquina para cuidar tus archivos originales y no saturar tu conexión a internet.
        </div>
      </div>

      {/* Los 3 pasos en criollo */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-600" />
          Cómo empezar en 3 pasos simples
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paso 1 */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 text-[#d71920] font-bold flex items-center justify-center text-sm mb-2">
                1
              </div>
              <CardTitle className="text-base text-slate-900">Bajar el programa</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Paso inicial en tu máquina
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <p>
                Hacé clic en el botón <strong>&quot;Bajar AK Editor&quot;</strong> arriba para descargar el archivo comprimido con el programa listo para usar.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" variant="secondary" className="w-full text-xs font-medium">
                  <a href="/descargas/ak-editor.zip" download="ak-editor.zip">
                    <FolderDown className="w-3.5 h-3.5 mr-1 text-[#d71920]" />
                    Descargar .zip
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Paso 2 */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 text-[#d71920] font-bold flex items-center justify-center text-sm mb-2">
                2
              </div>
              <CardTitle className="text-base text-slate-900">Instalar en un clic</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Configuración automática
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <p>
                Descomprimí el archivo descargado y hacé doble clic en <strong>instalar.bat</strong>. Configura todo solo y te deja el acceso directo en el escritorio.
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-md w-full justify-center">
                  <Wrench className="w-3.5 h-3.5 text-slate-600" />
                  Doble clic en instalar.bat
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paso 3 */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 text-[#d71920] font-bold flex items-center justify-center text-sm mb-2">
                3
              </div>
              <CardTitle className="text-base text-slate-900">Abrir y editar</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                A editar la fiesta
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <p>
                Abrí <strong>AK Editor</strong> desde el escritorio o tocando <strong>&quot;Abrir AK Editor&quot;</strong>. Elegí la carpeta del evento y exportá directo a Filmora 16.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="w-full text-xs font-medium border-red-200 text-[#d71920] hover:bg-red-50">
                  <a href="http://localhost:8765" target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="w-3.5 h-3.5 mr-1" />
                    Abrir en localhost:8765
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Características principales */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">¿Qué hace AK Editor en tu computadora?</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Diseñado especialmente para el flujo de trabajo de AK Producciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Tus archivos intactos:</strong> Nunca renombra, mueve ni borra los videos originales.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Sincronización multicámara:</strong> Sincroniza cámara principal y Osmo mediante correlación de audio.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Música del vals continua:</strong> Edita cortes manteniendo la pista de música en una sola pieza sin baches.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Respeto de discursos y velas:</strong> No corta mientras hablan por micrófono y arma las poses de vela.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Exportación a Filmora 16:</strong> Genera la línea de tiempo XML (XMEML) con las 4 pistas organizadas.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Reanudación automática:</strong> Si pausás o apagás la PC, sigue exactamente donde quedó.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
