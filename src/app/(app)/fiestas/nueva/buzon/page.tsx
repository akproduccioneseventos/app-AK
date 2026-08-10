'use client';

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Mic, Video, Play, Pause, Trash2, Download, Upload, Loader2,
  Volume2, ShieldCheck, Info, FileAudio, ExternalLink, Calendar, Users, Square,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { getBuzonMessages, deleteBuzonMessage, uploadWelcomeAudio, deleteWelcomeAudio } from '@/app/actions/buzon';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { BuzonMessage } from '@/app/actions/buzon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { VideoFrameOverlay, FRAME_TEMPLATES } from '@/components/buzon/VideoFrameOverlay';
import { cn } from '@/lib/utils';
import { EmptyStateModulo } from '@/components/ui/empty-state-modulo';

function BuzonAdminContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [messages, setMessages] = useState<BuzonMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWelcomeSaving, setIsWelcomeSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Welcome Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Players State
  const [isWelcomePlaying, setIsWelcomePlaying] = useState(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const msgAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load Data
  const loadData = useCallback(async (silent = false) => {
    if (!fiestaId) return;
    if (!silent) setIsLoading(true);
    try {
      const [fData, mData] = await Promise.all([
        getFiestaById(fiestaId),
        getBuzonMessages(fiestaId)
      ]);
      setFiesta(fData);
      setMessages(mData);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fiestaId]);

  const handleRefresh = async () => {
    if (!fiestaId) return;
    setIsRefreshing(true);
    try {
      const mData = await getBuzonMessages(fiestaId);
      setMessages(mData);
      toast({
        title: "Sincronizado",
        description: "Se actualizaron los mensajes del buzón.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al actualizar",
        description: "No se pudieron traer los últimos saludos.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Polling automático cada 15 segundos para mantenerlo sincronizado sin recargar
    const interval = setInterval(() => {
      if (fiestaId) {
        getBuzonMessages(fiestaId)
          .then(mData => setMessages(mData))
          .catch(err => console.error('Error in buzon polling:', err));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fiestaId, loadData]);

  // Clean up recording preview URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [audioUrl]);

  // Welcome Audio Control
  const toggleWelcomePlay = () => {
    if (!fiesta?.buzonConfig?.welcomeAudioUrl) return;
    if (!welcomeAudioRef.current) {
      welcomeAudioRef.current = new Audio(fiesta.buzonConfig.welcomeAudioUrl);
      welcomeAudioRef.current.onended = () => setIsWelcomePlaying(false);
    }
    if (isWelcomePlaying) {
      welcomeAudioRef.current.pause();
      setIsWelcomePlaying(false);
    } else {
      if (playingMsgId && msgAudioRef.current) {
        msgAudioRef.current.pause();
        setPlayingMsgId(null);
      }
      welcomeAudioRef.current.play();
      setIsWelcomePlaying(true);
    }
  };

  // Recording Welcome
  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (e) {
      toast({
        title: 'Error de micrófono',
        description: 'Permite el acceso al micrófono para grabar tu saludo.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const saveRecordedWelcome = async () => {
    if (!audioBlob || !fiestaId) return;
    setIsWelcomeSaving(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('file', audioBlob, 'welcome.webm');
    try {
      const res = await uploadWelcomeAudio(formData);
      if (res.success) {
        toast({ title: 'Bienvenida guardada', description: 'El audio se cargó con éxito.' });
        setAudioBlob(null);
        setAudioUrl(null);
        welcomeAudioRef.current = null; // force reload
        await loadData();
      } else {
        toast({ title: 'Error al subir', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsWelcomeSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsWelcomeSaving(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('file', file);
    try {
      const res = await uploadWelcomeAudio(formData);
      if (res.success) {
        toast({ title: 'Bienvenida guardada', description: 'El archivo de audio se cargó con éxito.' });
        welcomeAudioRef.current = null;
        await loadData();
      } else {
        toast({ title: 'Error al subir', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsWelcomeSaving(false);
    }
  };

  const handleDeleteWelcome = async () => {
    if (!fiestaId) return;
    if (!confirm('¿Seguro que deseas eliminar el audio de bienvenida?')) return;
    setIsWelcomeSaving(true);
    try {
      const res = await deleteWelcomeAudio(fiestaId);
      if (res.success) {
        toast({ title: 'Bienvenida eliminada' });
        welcomeAudioRef.current = null;
        setIsWelcomePlaying(false);
        await loadData();
      } else {
        toast({ title: 'Error al eliminar', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsWelcomeSaving(false);
    }
  };

  const [frameTemplate, setFrameTemplate] = useState<string>('default');
  const [customFrameText, setCustomFrameText] = useState<string>('');
  const [isFrameSaving, setIsFrameSaving] = useState(false);

  useEffect(() => {
    setFrameTemplate(fiesta?.buzonConfig?.videoFrameTemplate || 'default');
    setCustomFrameText(fiesta?.buzonConfig?.customText || '');
  }, [fiesta]);

  const handleSaveFrameTemplate = async () => {
    if (!fiestaId) return;
    setIsFrameSaving(true);
    try {
      const { updateBuzonFrameTemplate } = await import('@/app/actions/buzon');
      const res = await updateBuzonFrameTemplate(fiestaId, frameTemplate, customFrameText);
      if (res.success) {
        toast({ title: 'Plantilla y marco de video guardados' });
        await loadData(true);
      } else {
        toast({ title: 'Error al actualizar marco', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsFrameSaving(false);
    }
  };

  // Guest Messages Playback
  const handlePlayMessage = (msg: BuzonMessage) => {
    if (playingMsgId === msg.id) {
      msgAudioRef.current?.pause();
      setPlayingMsgId(null);
    } else {
      if (msgAudioRef.current) {
        msgAudioRef.current.pause();
      }
      if (isWelcomePlaying && welcomeAudioRef.current) {
        welcomeAudioRef.current.pause();
        setIsWelcomePlaying(false);
      }
      msgAudioRef.current = new Audio(msg.mediaUrl);
      msgAudioRef.current.onended = () => setPlayingMsgId(null);
      msgAudioRef.current.play();
      setPlayingMsgId(msg.id);
    }
  };

  // Delete Guest Message
  const handleDeleteMessage = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este saludo del buzón? Esta acción no se puede deshacer.')) return;
    setIsDeleting(id);
    try {
      const res = await deleteBuzonMessage(id);
      if (res.success) {
        setMessages(prev => prev.filter(m => m.id !== id));
        toast({ title: 'Mensaje eliminado' });
      } else {
        toast({ title: 'Error al eliminar', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsDeleting(null);
    }
  };

  // Trigger Bulk Download ZIP
  const handleDownloadZip = () => {
    if (!fiestaId) return;
    window.location.href = `/api/buzon/${fiestaId}/download`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (!fiestaId || !fiesta) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="text-2xl font-black">No se encontró la fiesta</h1>
        <Button asChild className="mt-4"><Link href="/eventos">Volver a eventos</Link></Button>
      </div>
    );
  }

  if (fiesta.modulosContratados && !fiesta.modulosContratados.buzon) {
    return (
      <EmptyStateModulo
        titulo="Buzón Telefónico"
        descripcion="El servicio de buzón de voz y video no está activo para este evento. Habilitalo desde la configuración o tienda."
        fiestaId={fiestaId}
      />
    );
  }

  const hasWelcome = !!fiesta.buzonConfig?.welcomeAudioUrl;
  const audios = messages.filter(m => m.mediaType === 'audio');
  const videos = messages.filter(m => m.mediaType === 'video');

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.08),transparent_35%),linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div>
          <Button asChild variant="ghost" className="mb-3 -ml-3">
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Badge className="mb-3 border-purple-200 bg-purple-50 text-purple-700">Multimedia</Badge>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Buzón de Recuerdos
              </h1>
              <p className="mt-2 text-slate-600">
                Audios y videos de felicitaciones grabados por tus invitados desde sus celulares.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="hidden sm:flex bg-white hover:bg-slate-50 text-slate-700">
                <Link href={`/evento/buzon/${fiestaId}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2 text-indigo-500" />
                  Previsualizar
                </Link>
              </Button>
              <Button onClick={handleRefresh} disabled={isRefreshing} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} /> Refrescar
              </Button>
              {messages.length > 0 && (
                <Button onClick={handleDownloadZip} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full hidden sm:flex">
                  <Download className="mr-2 h-4 w-4" /> Descargar Todos
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          {/* COLUMN 1: RECEIVED GREETINGS */}
          <Card className="border-none shadow-xl flex flex-col min-h-[500px]">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center justify-between text-xl font-bold">
                <div className="flex items-center gap-2">
                  <span>Saludos Recibidos ({messages.length})</span>
                  <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                    title="Actualizar buzón"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  </Button>
                </div>
                <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                  Total: {messages.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Hacé click para escuchar audios o visualizar videos de los invitados.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6">

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400 gap-3">
                  <Info className="w-12 h-12 text-slate-300" />
                  <div>
                    <p className="font-bold text-slate-600">Aún no hay saludos grabados</p>
                    <p className="text-sm">Comparte el código QR o el link de la Zona Digital para que los invitados dejen su recuerdo.</p>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="todos" className="w-full">
                  <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl mb-6">
                    <TabsTrigger value="todos" className="rounded-lg">Todos ({messages.length})</TabsTrigger>
                    <TabsTrigger value="audios" className="rounded-lg">Audios ({audios.length})</TabsTrigger>
                    <TabsTrigger value="videos" className="rounded-lg">Videos ({videos.length})</TabsTrigger>
                  </TabsList>

                  {/* TAB TODOS */}
                  <TabsContent value="todos" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {messages.map(msg => <MessageCard key={msg.id} msg={msg} />)}
                    </div>
                  </TabsContent>

                  {/* TAB AUDIOS */}
                  <TabsContent value="audios" className="space-y-4">
                    {audios.length === 0 ? (
                      <p className="text-center text-slate-400 py-6 text-sm">No hay mensajes de audio.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {audios.map(msg => <MessageCard key={msg.id} msg={msg} />)}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB VIDEOS */}
                  <TabsContent value="videos" className="space-y-4">
                    {videos.length === 0 ? (
                      <p className="text-center text-slate-400 py-6 text-sm">No hay mensajes de video.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {videos.map(msg => <MessageCard key={msg.id} msg={msg} />)}
                      </div>
                    )}
                  </TabsContent>

                </Tabs>
              )}

            </CardContent>
          </Card>

          {/* COLUMN 2: WELCOME AUDIO MANAGEMENT */}
          <div className="space-y-6">

            {/* FRAME SETTINGS */}
            <Card className="border-none shadow-xl mb-6 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Square className="h-5 w-5 text-indigo-600" />
                  Marco de Video (Overlay)
                </CardTitle>
                <CardDescription>
                  Elegí la plantilla y personalizá el texto superpuesto para los videos de los invitados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                {/* VISTA PREVIA EN VIVO DEL MARCO */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vista Previa en Vivo</label>
                  <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] rounded-2xl bg-zinc-950 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                    <div className="text-center p-4">
                      <p className="text-xs text-zinc-500 font-mono">CÁMARA DEL INVITADO</p>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono">Simulación de video 15s</p>
                    </div>
                    <VideoFrameOverlay
                      template={frameTemplate}
                      customText={customFrameText}
                      eventName={fiesta?.configuracion?.nombreEvento}
                    />
                  </div>
                </div>

                {/* CAMPO DE TEXTO PERSONALIZADO */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Texto Personalizado del Marco</label>
                  <Input
                    type="text"
                    placeholder="Ej: Boda Sofía & Lucas 2026"
                    value={customFrameText}
                    onChange={(e) => setCustomFrameText(e.target.value)}
                    className="rounded-xl border-slate-200"
                    maxLength={35}
                  />
                  <p className="text-[10px] text-slate-400">Este texto aparecerá estampado dentro de los marcos Neón, Boda Elegante, Mis 15, etc.</p>
                </div>

                {/* GRILLA DE PLANTILLAS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Elegir Plantilla de Diseño</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {FRAME_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setFrameTemplate(t.id)}
                        className={cn(
                          "p-3 text-left rounded-xl border-2 transition-all flex flex-col justify-between h-20",
                          frameTemplate === t.id
                            ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm ring-1 ring-indigo-500"
                            : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div>
                          <p className="font-bold text-xs">{t.label}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                        </div>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider self-start px-1.5 py-0.5 rounded-full mt-1",
                          frameTemplate === t.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                        )}>
                          {t.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSaveFrameTemplate}
                  disabled={isFrameSaving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 font-bold"
                >
                  {isFrameSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Guardar Plantilla y Personalización
                </Button>
              </CardContent>
            </Card>

            {/* WELCOME SETTINGS */}
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Volume2 className="h-5 w-5 text-purple-600" />
                  Audio de Bienvenida
                </CardTitle>
                <CardDescription>
                  Este audio se reproducirá en el teléfono de los invitados cuando entren a dejar un saludo.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                {hasWelcome ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          <FileAudio className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-700">Audio Activo</p>
                          <p className="text-xs text-slate-500">Subido/Grabado exitosamente</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={toggleWelcomePlay}
                          className="w-9 h-9 rounded-full border-slate-300"
                        >
                          {isWelcomePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-700 ml-0.5" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleDeleteWelcome}
                          disabled={isWelcomeSaving}
                          className="w-9 h-9 rounded-full border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {isWelcomeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-500 text-xs py-6">
                    No hay ningún audio de bienvenida activo. El sistema de grabación funcionará directamente sin saludo previo.
                  </div>
                )}

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-700">Establecer nuevo mensaje de bienvenida</h3>

                  {/* Option 1: Record from Web */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opción A: Grabar con micrófono</p>

                    {!audioUrl ? (
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          variant={isRecording ? 'destructive' : 'outline'}
                          className="rounded-full px-5 flex items-center gap-2"
                        >
                          {isRecording ? (
                            <>
                              <Square className="w-4 h-4 text-white fill-white" /> Detener ({recordingSeconds}s)
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4" /> Grabar Mensaje
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border p-2 bg-slate-50">
                        <span className="text-xs font-bold text-slate-600 pl-2">Grabación de prueba</span>
                        <div className="ml-auto flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={saveRecordedWelcome}
                            disabled={isWelcomeSaving}
                          >
                            {isWelcomeSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar y Activar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                          >
                            Descartar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Upload File */}
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opción B: Subir archivo de audio</p>

                    <input
                      type="file"
                      accept="audio/*"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isWelcomeSaving}
                      className="flex items-center gap-2 rounded-full"
                    >
                      {isWelcomeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Seleccionar Archivo
                    </Button>
                    <p className="text-[10px] text-slate-400">Soporta formatos comunes como .mp3, .wav, .m4a o .webm</p>
                  </div>

                </div>

              </CardContent>
            </Card>

            {/* QUICK LINK CARD */}
            <Card className="border-none bg-slate-900 text-white shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Acceso Seguro del Invitado</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Para probar la experiencia del invitado, asegúrate de activar el toggle de "Buzón de Mensajes" en la sección de **Portal Invitado**. Esto mostrará el acceso directo a sus celulares.
                </p>
                <Button asChild variant="ghost" className="border border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full w-full justify-between">
                  <Link href={`/evento/buzon/${fiestaId}`} target="_blank">
                    <span>Probar como Invitado</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </main>
  );

  // Mini Card component inside page
  function MessageCard({ msg }: { msg: BuzonMessage }) {
    const isAudio = msg.mediaType === 'audio';
    const isPlaying = playingMsgId === msg.id;

    return (
      <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-4 flex flex-col justify-between h-full min-h-[160px]">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-slate-900 line-clamp-1">{msg.authorName}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {new Date(msg.timestamp).toLocaleString('es-UY', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 shrink-0">
                {isAudio ? '🎙️ Voz' : '📹 Video'}
              </Badge>
            </div>

            {/* Media Area */}
            <div className="mt-4">
              {isAudio ? (
                <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handlePlayMessage(msg)}
                    className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Mensaje de voz</p>
                    <p className="text-[10px] text-slate-500 font-medium">Duración: {msg.durationSeconds > 0 ? `${msg.durationSeconds}s` : 'Audio corto'}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden bg-black aspect-[4/3] relative border border-slate-200 group">
                  <video
                    src={msg.mediaUrl}
                    controls
                    className="w-full h-full object-cover"
                    preload="none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
            <a
              href={`/api/buzon/${encodeURIComponent(fiestaId || '')}/download?messageId=${encodeURIComponent(msg.id)}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Descargar
            </a>
            <Button
              size="sm"
              variant="ghost"
              disabled={isDeleting === msg.id}
              onClick={() => handleDeleteMessage(msg.id)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 h-8 text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              {isDeleting === msg.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}

export default function BuzonAdminPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    }>
      <BuzonAdminContent />
    </Suspense>
  );
}
