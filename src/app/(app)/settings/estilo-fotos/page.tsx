'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, Upload, RefreshCw, FileText, Camera, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  guardarEstiloFotosAK,
  obtenerEstadoEstiloFotosAK,
  type EstiloFotosAKNumerico,
} from '@/app/actions/estilo-fotos';

interface EjemploFoto {
  id: string;
  titulo: string;
  descripcion: string;
  gradienteAntes: string;
  gradienteDespues: string;
  badge: string;
}

const EJEMPLOS: EjemploFoto[] = [
  {
    id: 'salon',
    titulo: '1. Retrato en Salón de Noche',
    descripcion: 'Piel suavizada con textura natural y luz cálida envolvente.',
    gradienteAntes: 'from-slate-700 via-slate-600 to-zinc-800',
    gradienteDespues: 'from-amber-700 via-orange-600 to-rose-900',
    badge: 'Salón noche',
  },
  {
    id: 'torta',
    titulo: '2. Torta y Velas',
    descripcion: 'Medios tonos cálidos, sombras protegidas y altas luces sedosas.',
    gradienteAntes: 'from-zinc-700 via-neutral-700 to-stone-800',
    gradienteDespues: 'from-amber-600 via-amber-700 to-red-950',
    badge: 'Torta / Brindis',
  },
  {
    id: 'exterior',
    titulo: '3. Exterior de Día',
    descripcion: 'Contraste limpio, saturación moderada y tonos piel balanceados.',
    gradienteAntes: 'from-slate-600 via-gray-600 to-zinc-700',
    gradienteDespues: 'from-sky-700 via-amber-600 to-emerald-900',
    badge: 'Exterior día',
  },
];

export default function EstiloFotosAKPage() {
  const [isPending, startTransition] = useTransition();
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState<{
    configurado: boolean;
    actualizadoEn?: string;
    estilo: EstiloFotosAKNumerico | null;
  }>({ configurado: false, estilo: null });

  const [jsonTexto, setJsonTexto] = useState<string>('');
  const [vistaPreviaModo, setVistaPreviaModo] = useState<Record<string, 'antes' | 'despues'>>({
    salon: 'despues',
    torta: 'despues',
    exterior: 'despues',
  });

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const res = await obtenerEstadoEstiloFotosAK();
      setEstado(res);
      if (res.estilo) {
        setJsonTexto(JSON.stringify(res.estilo, null, 2));
      } else {
        // Plantilla sugerida por defecto
        setJsonTexto(
          JSON.stringify(
            {
              intensidad: 1.0,
              temperatura: 15,
              contraste: 5,
              exposicion: 0,
              suavizadoPiel: 0.8,
              sombras: { r: 2, g: 1, b: -2 },
              medios: { r: 12, g: 5, b: -8 },
              altas: { r: 6, g: 3, b: -2 },
            },
            null,
            2,
          ),
        );
      }
    } catch {
      toast({
        title: 'Error al cargar estado',
        description: 'No se pudo leer la configuración actual de estilo AK.',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const handleCargarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const contenido = evt.target?.result as string;
        const parseado = JSON.parse(contenido);
        setJsonTexto(JSON.stringify(parseado, null, 2));
        toast({
          title: 'Archivo cargado',
          description: `Se leyó "${file.name}" correctamente. Recordá presionar Guardar.`,
        });
      } catch {
        toast({
          title: 'Error de archivo',
          description: 'El archivo seleccionado no es un JSON válido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleGuardar = () => {
    startTransition(async () => {
      try {
        let datos: any;
        try {
          datos = JSON.parse(jsonTexto);
        } catch {
          toast({
            title: 'JSON inválido',
            description: 'Revisá la sintaxis del JSON antes de guardar.',
            variant: 'destructive',
          });
          return;
        }

        const res = await guardarEstiloFotosAK(datos);
        if (res.success) {
          toast({
            title: 'Estilo AK guardado',
            description: 'El ajuste se sincronizó y ya rige para fotocabina, Vogue, Touchpix, espejo mágico y muro.',
          });
          void cargarDatos();
        } else {
          toast({
            title: 'No se pudo guardar',
            description: res.error || 'Ocurrió un error al guardar el estilo.',
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        toast({
          title: 'Error inesperado',
          description: err?.message || 'Fallo de conexión.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/settings"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Ajustes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Estilo de fotos AK
            </h1>
            <Badge
              variant="outline"
              className={
                estado.configurado
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              }
            >
              {estado.configurado ? 'Activo' : 'Sin configurar'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Ajuste tonal, luz y suavizado de piel automático para fotocabina, Vogue, Touchpix, espejo mágico y muro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            disabled={cargando}
            className="border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={isPending || cargando}
            className="bg-amber-600 font-semibold text-white hover:bg-amber-500"
          >
            {isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Guardar Estilo AK
          </Button>
        </div>
      </div>

      {/* Estado y última actualización */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-zinc-200">
              Estado del Estilo en Estaciones
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Solo administradores</span>
            </div>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            {estado.actualizadoEn ? (
              <>
                Última actualización sincronizada:{' '}
                <strong className="text-zinc-200">
                  {new Date(estado.actualizadoEn).toLocaleString('es-UY', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
              </>
            ) : (
              'Aún no se cargó ningún estilo. Se aplicará el perfil cálido por defecto.'
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 3 Fotos de ejemplo Antes / Después */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Fotos de ejemplo Antes / Después</h2>
            <p className="text-xs text-zinc-400">
              Compará cómo el ajuste cálido y el retoque de piel elevan la foto del invitado sin deformar rasgos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {EJEMPLOS.map((ej) => {
            const modo = vistaPreviaModo[ej.id] || 'despues';
            const esDespues = modo === 'despues';

            return (
              <Card key={ej.id} className="overflow-hidden border-zinc-800 bg-zinc-900/40">
                <div
                  className={`relative flex aspect-[4/3] w-full flex-col justify-between p-4 bg-gradient-to-br transition-all duration-300 ${
                    esDespues ? ej.gradienteDespues : ej.gradienteAntes
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur">
                      {ej.badge}
                    </Badge>
                    <Badge
                      className={
                        esDespues
                          ? 'bg-amber-500/90 text-black font-bold'
                          : 'bg-zinc-800 text-zinc-300'
                      }
                    >
                      {esDespues ? 'Con Estilo AK' : 'Original (Crudo)'}
                    </Badge>
                  </div>

                  <div className="rounded-lg bg-black/50 p-2.5 backdrop-blur">
                    <p className="text-xs font-semibold text-white">{ej.titulo}</p>
                    <p className="text-[11px] text-zinc-300">{ej.descripcion}</p>
                  </div>
                </div>

                <CardContent className="p-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={!esDespues ? 'default' : 'outline'}
                      className={`flex-1 text-xs ${
                        !esDespues ? 'bg-zinc-700 text-white' : 'border-zinc-800 text-zinc-400'
                      }`}
                      onClick={() =>
                        setVistaPreviaModo((prev) => ({ ...prev, [ej.id]: 'antes' }))
                      }
                    >
                      Antes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={esDespues ? 'default' : 'outline'}
                      className={`flex-1 text-xs ${
                        esDespues ? 'bg-amber-600 text-white font-semibold' : 'border-zinc-800 text-zinc-400'
                      }`}
                      onClick={() =>
                        setVistaPreviaModo((prev) => ({ ...prev, [ej.id]: 'despues' }))
                      }
                    >
                      <Sparkles className="mr-1 h-3 w-3" /> Después (AK)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Formulario para cargar o actualizar estilo-ak.json */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg font-bold text-white">
                Cargar o actualizar estilo-ak.json
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Podés subir el archivo exportado desde el <strong>AK Editor</strong> (&quot;Aprender mi estilo&quot;) o pegar / editar los valores numéricos de ajuste.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label
              htmlFor="archivo-estilo"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-center transition hover:border-amber-500/60 hover:bg-zinc-900/60"
            >
              <Upload className="mb-2 h-8 w-8 text-amber-500" />
              <span className="text-sm font-semibold text-zinc-200">
                Seleccionar o soltar archivo estilo-ak.json
              </span>
              <span className="mt-1 text-xs text-zinc-400">
                Solo valores de calibración numérica (costo cero, sin librerías externas)
              </span>
              <input
                id="archivo-estilo"
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleCargarArchivo}
              />
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="editor-json" className="text-xs font-semibold text-zinc-300">
                Parámetros JSON de calibración
              </Label>
              <span className="text-[11px] text-zinc-400">
                Acepta: temperatura, suavizadoPiel, sombras, medios, altas
              </span>
            </div>
            <Textarea
              id="editor-json"
              rows={12}
              value={jsonTexto}
              onChange={(e) => setJsonTexto(e.target.value)}
              className="font-mono text-xs border-zinc-800 bg-zinc-950 text-zinc-200"
              placeholder="{ ... }"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleGuardar}
              disabled={isPending || cargando}
              className="bg-amber-600 font-semibold text-white hover:bg-amber-500"
            >
              {isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Guardar Estilo AK
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
