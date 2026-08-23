'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Layers,
  Lightbulb,
  Loader2,
  Megaphone,
  MessageSquare,
  Play,
  RotateCw,
  SearchCheck,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Video,
  Wand2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type {
  AnuncioGenerado,
  AuditoriaAnuncio,
  ObjetivoAnuncio,
  TipoEventoAnuncio,
  TonoAnuncio,
} from '@/lib/marketing/creador-anuncios-tipos';
import {
  generarNuevoAnuncio,
  auditarAnuncioAction,
  guardarAnuncio,
  getAnunciosGuardados,
  eliminarAnuncioGuardado,
} from '@/app/actions/creador-anuncios';

export default function CreadorAnunciosPage() {
  const { toast } = useToast();

  // Estados del Creador
  const [tipoEvento, setTipoEvento] = useState<TipoEventoAnuncio>('15_anos');
  const [objetivo, setObjetivo] = useState<ObjetivoAnuncio>('simulador');
  const [tono, setTono] = useState<TonoAnuncio>('emocional_familiar');
  const [beneficio, setBeneficio] = useState('');
  const [descuento, setDescuento] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [anuncioGenerado, setAnuncioGenerado] = useState<AnuncioGenerado | null>(null);

  // Estados del Auditor
  const [textoAuditoria, setTextoAuditoria] = useState('');
  const [plataformaAuditoria, setPlataformaAuditoria] = useState<'instagram' | 'facebook' | 'tiktok' | 'otra'>('instagram');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditoriaResultado, setAuditoriaResultado] = useState<AuditoriaAnuncio | null>(null);

  // Estados de Anuncios Guardados
  const [guardados, setGuardados] = useState<AnuncioGenerado[]>([]);
  const [isLoadingGuardados, setIsLoadingGuardados] = useState(false);

  const loadGuardados = useCallback(async () => {
    setIsLoadingGuardados(true);
    try {
      const data = await getAnunciosGuardados();
      setGuardados(data);
    } catch {
      // Ignorar error al cargar
    } finally {
      setIsLoadingGuardados(false);
    }
  }, []);

  useEffect(() => {
    loadGuardados();
  }, [loadGuardados]);

  // Handler Generar Anuncio
  const handleGenerar = async () => {
    setIsGenerating(true);
    try {
      const res = await generarNuevoAnuncio({
        tipoEvento,
        objetivo,
        tono,
        beneficioDestacado: beneficio || undefined,
        descuentoTexto: descuento || undefined,
      });
      if (res.success && res.anuncio) {
        setAnuncioGenerado(res.anuncio);
        toast({ title: '¡Anuncio generado!', description: 'Se creó el copy, guión para Reels y segmentación sugerida.' });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ title: 'Error al generar', description: e.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler Guardar Anuncio
  const handleGuardar = async (anuncio: AnuncioGenerado) => {
    try {
      const res = await guardarAnuncio(anuncio);
      if (res.success) {
        toast({ title: 'Guardado', description: 'El anuncio se guardó en tu biblioteca.' });
        loadGuardados();
      }
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' });
    }
  };

  // Handler Eliminar Guardado
  const handleEliminar = async (id: string) => {
    try {
      const res = await eliminarAnuncioGuardado(id);
      if (res.success) {
        toast({ title: 'Eliminado', description: 'El anuncio fue quitado de tu biblioteca.' });
        loadGuardados();
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Handler Auditar Anuncio
  const handleAuditar = async () => {
    if (!textoAuditoria.trim() || textoAuditoria.trim().length < 15) {
      toast({ title: 'Texto muy corto', description: 'Pegá el texto completo de tu anuncio para analizarlo.', variant: 'destructive' });
      return;
    }
    setIsAuditing(true);
    try {
      const res = await auditarAnuncioAction({
        textoAnuncio: textoAuditoria,
        plataforma: plataformaAuditoria,
      });
      if (res.success && res.auditoria) {
        setAuditoriaResultado(res.auditoria);
        toast({ title: 'Auditoría completada', description: 'Ya tenés el diagnóstico real y la versión reescrita.' });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ title: 'Error al auditar', description: e.message, variant: 'destructive' });
    } finally {
      setIsAuditing(false);
    }
  };

  // Copiar al portapapeles
  const copiarTexto = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast({ title: 'Copiado al portapapeles', description: label });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 rounded-2xl shadow-xl shadow-rose-100 text-white">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight font-headline text-slate-950">
              Estudio de Anuncios & Auditoría IA
            </h1>
            <p className="text-sm text-slate-500">
              Creación con neuroventas estilo Zeely y optimizador de campañas sin gastar de más.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-xl h-11">
          <Link href="/empresa/redes-sociales">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Redes
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="creador" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="creador" className="font-bold gap-2 text-xs sm:text-sm">
            <Wand2 className="w-4 h-4" /> Creador 1-Clic
          </TabsTrigger>
          <TabsTrigger value="auditor" className="font-bold gap-2 text-xs sm:text-sm">
            <SearchCheck className="w-4 h-4" /> Auditor Anti-Meta
          </TabsTrigger>
          <TabsTrigger value="guardados" className="font-bold gap-2 text-xs sm:text-sm">
            <Layers className="w-4 h-4" /> Guardados ({guardados.length})
          </TabsTrigger>
        </TabsList>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* PESTAÑA 1: CREADOR DE ANUNCIOS 1-CLIC */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <TabsContent value="creador" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario de Configuración */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-600" /> Configurar tu Campaña
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Elegí qué querés promocionar y la IA armará todo con neuroventas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Tipo de Evento o Promoción</label>
                    <Select value={tipoEvento} onValueChange={(v) => setTipoEvento(v as TipoEventoAnuncio)}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15_anos">👑 Fiesta de 15 Años (Quinceañeras)</SelectItem>
                        <SelectItem value="bodas">💍 Bodas & Casamientos</SelectItem>
                        <SelectItem value="cumpleanos">🎉 Cumpleaños & Fiestas Privadas</SelectItem>
                        <SelectItem value="empresarial">💼 Eventos Corporativos & Conferencias</SelectItem>
                        <SelectItem value="promocion_temporada">🔥 Promo Precio Congelado / Anticipada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Objetivo de la Campaña (Embudo)</label>
                    <Select value={objetivo} onValueChange={(v) => setObjetivo(v as ObjetivoAnuncio)}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simulador">⚡ Enviar directo al Simulador Interactivo</SelectItem>
                        <SelectItem value="whatsapp">💬 Enviar a WhatsApp con mensaje pre-armado</SelectItem>
                        <SelectItem value="reunion">📅 Agendar asesoría de diseño gratuita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Tono de Comunicación</label>
                    <Select value={tono} onValueChange={(v) => setTono(v as TonoAnuncio)}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emocional_familiar">💖 Emocional & Familiar (Paz mental)</SelectItem>
                        <SelectItem value="divertido_fiesta">🥳 Festivo & Enérgico (Pista llena)</SelectItem>
                        <SelectItem value="elegante_premium">✨ Elegante & Exclusivo (Alto estatus)</SelectItem>
                        <SelectItem value="urgencia_oferta">⏳ Oportunidad & Cupos Limitados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Beneficio Extra a Destacar (Opcional)</label>
                    <Input
                      placeholder="Ej: Salón climatizado con pista LED incluida"
                      value={beneficio}
                      onChange={(e) => setBeneficio(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Bonificación o Descuento (Opcional)</label>
                    <Input
                      placeholder="Ej: Barra de tragos bonificada contratando este mes"
                      value={descuento}
                      onChange={(e) => setDescuento(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  <Button
                    onClick={handleGenerar}
                    disabled={isGenerating}
                    className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 rounded-xl"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Generar Anuncio Completo con IA
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Resultado del Anuncio */}
            <div className="lg:col-span-7 space-y-4">
              {!anuncioGenerado ? (
                <div className="h-full min-h-[400px] border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50">
                  <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                    <Megaphone className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Tu anuncio optimizado aparecerá acá</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Elegí las opciones a la izquierda y tocá <strong>Generar Anuncio</strong> para obtener el gancho, el copy de neuroventas, el guión para Reels y la segmentación.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tarjeta de Copy & Gancho */}
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                      <div>
                        <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 text-[10px] uppercase font-bold">
                          Copy Publicitario (Instagram & Facebook)
                        </Badge>
                        <CardTitle className="text-base font-bold text-slate-900 mt-1">
                          {anuncioGenerado.tituloGancho}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copiarTexto(`${anuncioGenerado.tituloGancho}\n\n${anuncioGenerado.textoPrincipal}`, 'Texto del anuncio')}
                          className="h-8 text-xs font-bold gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGuardar(anuncioGenerado)}
                          className="h-8 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                        >
                          Guardar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-3 text-xs">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-line font-sans leading-relaxed">
                        {anuncioGenerado.textoPrincipal}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>Destino:</span>
                          <span className="font-mono text-[11px] text-indigo-600 truncate max-w-xs">{anuncioGenerado.enlaceDestino}</span>
                        </div>
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-indigo-600">
                          <a href={anuncioGenerado.enlaceDestino} target="_blank" rel="noopener noreferrer">
                            Probar link <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Guión para Reels / TikTok */}
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Video className="w-4 h-4 text-purple-600" /> Guión para Reel / TikTok ({anuncioGenerado.guionReelsTikTok.duracionSegundos}s)
                        </CardTitle>
                        <span className="text-[11px] text-slate-500 font-medium">
                          🎵 {anuncioGenerado.guionReelsTikTok.musicaSugerida}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-2 text-xs">
                      {anuncioGenerado.guionReelsTikTok.escenas.map((esc, i) => (
                        <div key={i} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col sm:flex-row gap-2">
                          <span className="font-bold text-purple-700 min-w-[50px]">{esc.segundo}</span>
                          <div className="space-y-1 flex-1">
                            <p className="text-slate-700"><strong>Visual:</strong> {esc.visual}</p>
                            <p className="text-slate-600"><strong>Texto en pantalla:</strong> <span className="bg-white px-1.5 py-0.5 rounded border border-purple-200">{esc.textoPantalla}</span></p>
                            <p className="text-purple-900 font-medium"><strong>Locución:</strong> "{esc.audioLocucion}"</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Segmentación Sugerida */}
                  <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-5 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-emerald-600" /> Segmentación Recomendada para Meta Ads
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                        <div><strong>Edad:</strong> {anuncioGenerado.publicoObjetivoSugerido.edad}</div>
                        <div><strong>Ubicación:</strong> {anuncioGenerado.publicoObjetivoSugerido.ubicacion}</div>
                      </div>
                      <p className="text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-[11px]">
                        💡 <strong>Consejo:</strong> {anuncioGenerado.publicoObjetivoSugerido.consejoSegmentacion}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* PESTAÑA 2: AUDITOR DE ANUNCIOS (ANTI-META "INVERTÍ MÁS") */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <TabsContent value="auditor" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input del Anuncio */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <SearchCheck className="w-4 h-4 text-indigo-600" /> Pegá tu Anuncio Activo
                  </CardTitle>
                  <CardDescription className="text-xs">
                    La IA analizará por qué no está convirtiendo y te dará la versión corregida sin pedirte más plata.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Texto / Copy del Anuncio</label>
                    <Textarea
                      rows={8}
                      placeholder="Pegá acá el texto exacto del anuncio que tenés publicado en Instagram o Facebook..."
                      value={textoAuditoria}
                      onChange={(e) => setTextoAuditoria(e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Plataforma</label>
                    <Select value={plataformaAuditoria} onValueChange={(v: any) => setPlataformaAuditoria(v)}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram (Feed / Stories / Reels)</SelectItem>
                        <SelectItem value="facebook">Facebook Ads</SelectItem>
                        <SelectItem value="tiktok">TikTok Ads</SelectItem>
                        <SelectItem value="otra">Otra red / WhatsApp Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  <Button
                    onClick={handleAuditar}
                    disabled={isAuditing}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 rounded-xl"
                  >
                    {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Auditar con IA y Obtener Versión Mejorada
                  </Button>
                </CardFooter>
              </Card>

              {/* Banner de Por Qué Falla la IA de Meta */}
              <Card className="border-amber-200 bg-amber-50/70 shadow-sm">
                <CardContent className="p-5 space-y-2 text-xs text-amber-900">
                  <h4 className="font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-600" /> La Trampa del "Invertí Más" de Meta
                  </h4>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    El algoritmo de Facebook e Instagram siempre te recomienda aumentar el presupuesto diario porque su negocio es cobrarte más.
                    Si el gancho inicial no frena el scroll o vendés "cables y parlantes" en vez de emociones, poner más plata sólo hace que más gente lo ignore más rápido.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Resultado de la Auditoría */}
            <div className="lg:col-span-7 space-y-4">
              {!auditoriaResultado ? (
                <div className="h-full min-h-[400px] border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">El diagnóstico de tu anuncio aparecerá acá</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Pegá el texto de cualquier anuncio que tengas corriendo para calificar su gancho, neuroventas y recibir la versión que sí convierte.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Puntaje y Diagnóstico */}
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 p-5 text-white flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calificación de Conversión</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-4xl font-black ${auditoriaResultado.puntajeGlobal >= 8 ? 'text-emerald-400' : auditoriaResultado.puntajeGlobal >= 6 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {auditoriaResultado.puntajeGlobal} / 10
                          </span>
                          <Badge className={`${auditoriaResultado.puntajeGlobal >= 8 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : auditoriaResultado.puntajeGlobal >= 6 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                            {auditoriaResultado.puntajeGlobal >= 8 ? 'Alta Conversión' : auditoriaResultado.puntajeGlobal >= 6 ? 'Aceptable con Fugas' : 'Quemando Presupuesto'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-4 text-xs">
                      <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        {auditoriaResultado.diagnosticoResumen}
                      </p>

                      {/* Desglose de 3 Pilares */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>Gancho (Hook)</span>
                            <span>{auditoriaResultado.evaluacionGancho.puntaje}/10</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight">{auditoriaResultado.evaluacionGancho.observaciones}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>Neuroventas</span>
                            <span>{auditoriaResultado.evaluacionNeuroventas.puntaje}/10</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight">{auditoriaResultado.evaluacionNeuroventas.observaciones}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>Embudo / CTA</span>
                            <span>{auditoriaResultado.evaluacionOfertaFriccion.puntaje}/10</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight">{auditoriaResultado.evaluacionOfertaFriccion.observaciones}</p>
                        </div>
                      </div>

                      {/* Consejos sin gastar más */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-500" /> Cómo Optimizarlo Sin Poner Más Plata:
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                          {auditoriaResultado.consejosOptimizacionSinGastarMas.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Versión Reescrita y Optimizada */}
                  <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-white shadow-sm">
                    <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                      <div>
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] uppercase font-bold">
                          ✨ Versión Reescrita Lista para Usar
                        </Badge>
                        <CardTitle className="text-base font-bold text-slate-900 mt-1">
                          {auditoriaResultado.anuncioReescritoOptimizado.tituloGancho}
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => copiarTexto(`${auditoriaResultado.anuncioReescritoOptimizado.tituloGancho}\n\n${auditoriaResultado.anuncioReescritoOptimizado.copyCompleto}`, 'Versión optimizada')}
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Versión Mejorada
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-3 text-xs">
                      <div className="p-4 rounded-xl bg-white border border-emerald-200 text-slate-800 whitespace-pre-line font-sans leading-relaxed shadow-sm">
                        {auditoriaResultado.anuncioReescritoOptimizado.copyCompleto}
                      </div>
                      <p className="text-[11px] text-emerald-800 bg-emerald-100/50 p-2.5 rounded-lg border border-emerald-200">
                        🎯 <strong>Por qué convierte mejor:</strong> {auditoriaResultado.anuncioReescritoOptimizado.porQueEstaVersionConvierteMejor}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* PESTAÑA 3: MIS ANUNCIOS GUARDADOS */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <TabsContent value="guardados" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Biblioteca de Anuncios Guardados</h2>
            <Button variant="ghost" size="sm" onClick={loadGuardados} disabled={isLoadingGuardados} className="h-8 text-xs">
              <RotateCw className={`w-3.5 h-3.5 mr-1 ${isLoadingGuardados ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {guardados.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
              No tenés anuncios guardados todavía. Generá uno en la pestaña <strong>Creador 1-Clic</strong> y guardalo para usarlo cuando quieras.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {guardados.map((anuncio) => (
                <Card key={anuncio.id} className="border-slate-200 shadow-sm flex flex-col justify-between">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {anuncio.tipoEvento.replace('_', ' ')}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEliminar(anuncio.id)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-600"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {anuncio.tituloGancho}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 text-xs">
                    <p className="text-slate-600 line-clamp-4 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {anuncio.textoPrincipal}
                    </p>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(anuncio.creadoEn).toLocaleDateString('es-UY')}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copiarTexto(`${anuncio.tituloGancho}\n\n${anuncio.textoPrincipal}`, 'Texto copiado')}
                      className="h-8 text-xs font-bold gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

