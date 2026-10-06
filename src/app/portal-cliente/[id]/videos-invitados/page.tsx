'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  Camera,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFiestaForPortalSession } from '@/app/actions/fiesta/portal.actions';
import { guardarVideoParaInvitados, borrarVideoParaInvitados } from '@/app/actions/videos-invitados';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import { AvisoDeDatos } from '@/components/legales/AvisoDeDatos';

export default function VideosInvitadosPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.id as string;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selección de invitados
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  // Estado de grabación
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(30);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFiestaForPortalSession(fiestaId);
      if (!data) {
        setError('No se pudo acceder al portal o la sesión expiró.');
        return;
      }
      if (!data.clientPortalSettings?.videosParaInvitadosActivo) {
        setError('El módulo de videos para invitados no está habilitado para esta fiesta.');
        return;
      }
      setFiesta(data);
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      detenerCamara();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const detenerCamara = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const iniciarCamara = async () => {
    setError(null);
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setError('No pudimos acceder a tu cámara o micrófono. Verificá los permisos del navegador.');
    }
  };

  const iniciarGrabacion = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      detenerCamara();
      setIsRecording(false);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(1000);
    setIsRecording(true);
    setRecordingSeconds(30);

    countdownIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          recorder.stop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const detenerGrabacion = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const descartarYGrabarDeNuevo = () => {
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    iniciarCamara();
  };

  const handleGuardar = async () => {
    if (!recordedBlob || selectedGuestIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      const file = new File([recordedBlob], 'dedicatoria.webm', { type: recordedBlob.type || 'video/webm' });
      formData.append('video', file);
      formData.append('duracionSegundos', (30 - recordingSeconds).toString());

      const res = await guardarVideoParaInvitados(fiestaId, selectedGuestIds, formData);
      if (!res.success) {
        throw new Error(res.error || 'No se pudo guardar el video.');
      }

      // Limpiar y recargar
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
      setRecordedBlob(null);
      setRecordedVideoUrl(null);
      setSelectedGuestIds([]);
      await cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el video.');
    } finally {
      setSaving(false);
    }
  };

  const handleBorrar = async (videoId: string) => {
    if (!confirm('¿Seguro que querés borrar este video?')) return;
    setDeletingId(videoId);
    try {
      const res = await borrarVideoParaInvitados(fiestaId, videoId);
      if (!res.success) {
        alert(res.error || 'No se pudo borrar el video.');
      } else {
        await cargarDatos();
      }
    } catch {
      alert('Error de conexión al borrar el video.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectGuest = (id: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-4" />
        <p className="text-sm text-slate-300">Cargando tus dedicatorias...</p>
      </div>
    );
  }

  if (error && !fiesta) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Acceso no disponible</h1>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">{error}</p>
        <Link href={`/portal-cliente/${fiestaId}`}>
          <Button variant="outline" className="text-white border-white/20">
            Volver al Portal
          </Button>
        </Link>
      </div>
    );
  }

  const invitados: Invitado[] = fiesta?.invitados || [];
  const videosGuardados = fiesta?.videosParaInvitados || [];

  // Mapeo de invitadoId -> tiene video
  const invitadosConVideo = new Set<string>();
  videosGuardados.forEach((v) => {
    v.invitadoIds.forEach((id) => invitadosConVideo.add(id));
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Cabecera Móvil */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link href={`/portal-cliente/${fiestaId}`}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            Videos para Invitados
          </h1>
          <p className="text-xs text-slate-400">Dedicatorias personales que verán al llegar</p>
        </div>
      </header>
      <AvisoDeDatos para="invitado" />

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {/* Grabador / Vista previa */}
        <Card className="bg-slate-900 border-white/10 overflow-hidden text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Grabar Dedicatoria</span>
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Elegí uno o más invitados abajo y grabá un saludo de hasta 30 segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visor de cámara o reproducción */}
            <div className="relative aspect-[9/16] max-h-[420px] w-full bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10 mx-auto">
              {recordedVideoUrl ? (
                <video
                  src={recordedVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : cameraActive ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-400">La cámara está apagada</p>
                </div>
              )}
            </div>

            {/* Controles de cámara / grabación */}
            <div className="flex flex-col gap-2">
              {!cameraActive && !recordedVideoUrl && (
                <Button
                  onClick={iniciarCamara}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-12"
                  disabled={selectedGuestIds.length === 0}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {selectedGuestIds.length === 0 ? 'Elegí invitados abajo para grabar' : `Abrir cámara (${selectedGuestIds.length} elegidos)`}
                </Button>
              )}

              {cameraActive && !isRecording && (
                <div className="flex gap-2">
                  <Button
                    onClick={iniciarGrabacion}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12"
                  >
                    <Video className="w-4 h-4 mr-2" /> Empezar a Grabar (max 30s)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={detenerCamara}
                    className="border-white/20 text-white h-12"
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {isRecording && (
                <Button
                  onClick={detenerGrabacion}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 animate-pulse"
                >
                  Detener Grabación ({recordingSeconds}s restantes)
                </Button>
              )}

              {recordedVideoUrl && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={descartarYGrabarDeNuevo}
                      disabled={saving}
                      className="flex-1 border-white/20 text-white h-12"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Grabar de nuevo
                    </Button>
                    <Button
                      onClick={handleGuardar}
                      disabled={saving}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12"
                    >
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                      Guardar video
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Invitados con casillas */}
        <Card className="bg-slate-900 border-white/10 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                ¿Para quién es este video?
              </span>
              <span className="text-xs text-slate-400 font-normal">
                {selectedGuestIds.length} seleccionados
              </span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Podés elegir una persona sola o un grupo entero (por ejemplo, amigos o primos).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {invitados.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No hay invitados cargados todavía.</p>
            ) : (
              invitados.map((inv) => {
                const tieneVideo = invitadosConVideo.has(inv.id);
                const isSelected = selectedGuestIds.includes(inv.id);

                return (
                  <div
                    key={inv.id}
                    onClick={() => toggleSelectGuest(inv.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-white/5 bg-slate-800/40 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Manejado por el div contenedor
                        className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 pointer-events-none"
                      />
                      <div>
                        <p className="text-sm font-bold text-white">{inv.nombre}</p>
                        <p className="text-xs text-slate-400">
                          {inv.tableNumber ? `Mesa: ${inv.tableNumber}` : 'Sin mesa asignada'}
                        </p>
                      </div>
                    </div>

                    {tieneVideo && (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Ya tiene video
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Videos ya grabados */}
        {videosGuardados.length > 0 && (
          <Card className="bg-slate-900 border-white/10 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Videos Grabados ({videosGuardados.length})</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Dedicatorias listas para mostrarse en el evento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {videosGuardados.map((v) => {
                const nombresInvitados = v.invitadoIds
                  .map((id) => invitados.find((i) => i.id === id)?.nombre)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/10"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{nombresInvitados || 'Invitados'}</p>
                      <p className="text-xs text-slate-400">
                        Duración: {v.duracionSegundos}s · {v.invitadoIds.length} persona{v.invitadoIds.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBorrar(v.id)}
                      disabled={deletingId === v.id}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      {deletingId === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
