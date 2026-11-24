'use client';

import { useEffect, useRef, useState } from 'react';
import { Radio, Video, Square, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  LIVE_STREAM_CONNECT_TIMEOUT_MS,
  LIVE_STREAM_FALLBACK_CLIP_SECONDS,
  LIVE_STREAM_MAX_DURATION_SECONDS,
  LIVE_STREAM_STUN_URL,
  type LiveStreamRequest,
} from '@/lib/social-fiesta/transmision-invitado';
import {
  getGuestLiveStreamStatus,
  pushLiveStreamIceCandidate,
  requestLiveStream,
} from '@/app/actions/social-live-stream';
import { uploadSocialPost } from '@/app/actions/social-gallery';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LiveStreamGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiestaId: string;
  authorName: string;
  guestId?: string;
  guestAccessToken?: string;
  dispositivoId?: string;
  accentColor: string;
}

export function LiveStreamGuestDialog({
  open,
  onOpenChange,
  fiestaId,
  authorName,
  guestId,
  guestAccessToken,
  dispositivoId,
  accentColor,
}: LiveStreamGuestDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<'preview' | 'waiting' | 'live' | 'fallback_recording' | 'uploading' | 'done'>('preview');
  const [request, setRequest] = useState<LiveStreamRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(LIVE_STREAM_MAX_DURATION_SECONDS);
  const [clipSeconds, setClipSeconds] = useState(0);

  const cleanup = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      cleanup();
      setPhase('preview');
      setRequest(null);
      setError(null);
      setClipSeconds(0);
      return;
    }

    let cancelled = false;
    async function initCamera() {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Tu navegador no permite usar la cámara.');
        }
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = media;
        if (videoRef.current) {
          videoRef.current.srcObject = media;
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Necesitamos permiso de cámara y micrófono para salir en pantalla.');
        }
      }
    }

    void initCamera();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open]);

  const startFallbackClip = () => {
    if (!streamRef.current) return;
    if (pollRef.current) clearInterval(pollRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setPhase('fallback_recording');
    setClipSeconds(0);
    const chunks: Blob[] = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;

    const ticker = setInterval(() => {
      setClipSeconds((s) => s + 1);
    }, 1000);

    const autoStop = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, LIVE_STREAM_FALLBACK_CLIP_SECONDS * 1000);

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };

    recorder.onstop = async () => {
      clearInterval(ticker);
      clearTimeout(autoStop);
      setPhase('uploading');
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const file = new File([blob], `en-vivo-${Date.now()}.webm`, { type: blob.type });
        const fd = new FormData();
        fd.append('fiestaId', fiestaId);
        fd.append('file', file);
        fd.append('authorName', authorName || 'Invitado');
        fd.append('dedication', 'Saludo en vivo (Plan B · 15s)');
        if (guestId) fd.append('guestId', guestId);
        if (guestAccessToken) fd.append('guestAccessToken', guestAccessToken);
        if (dispositivoId) fd.append('dispositivoId', dispositivoId);
        const res = await uploadSocialPost(fd);
        if (!res.success) throw new Error(res.error || 'No se pudo enviar el clip.');
        setPhase('done');
        toast({
          title: 'Clip de 15s enviado a moderación',
          description: 'Si se aprueba, saldrá en la pantalla del salón.',
        });
      } catch (e: any) {
        setError(e?.message || 'Error al subir el clip.');
        setPhase('preview');
      }
    };

    recorder.start();
  };

  const handleRequestLive = async () => {
    if (!streamRef.current) return;
    setError(null);
    setPhase('waiting');

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: LIVE_STREAM_STUN_URL }],
      });
      pcRef.current = pc;

      streamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current!);
      });

      const pendingCandidates: string[] = [];
      let activeReqId = '';
      let activeCallerToken: string | undefined;

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const json = JSON.stringify(event.candidate.toJSON());
        if (activeReqId) {
          void pushLiveStreamIceCandidate(fiestaId, activeReqId, 'caller', json, {
            guestId,
            guestAccessToken,
            callerToken: activeCallerToken,
          });
        } else {
          pendingCandidates.push(json);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          setPhase('live');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await requestLiveStream(fiestaId, {
        authorName: authorName || 'Invitado',
        offerSdp: JSON.stringify(offer),
        guestId,
        guestAccessToken,
        dispositivoId,
      });

      if (!res.success || !res.request) {
        throw new Error(res.error || 'No se pudo enviar el pedido.');
      }

      activeReqId = res.request.id;
      activeCallerToken = res.callerToken;
      setRequest(res.request);

      for (const c of pendingCandidates) {
        void pushLiveStreamIceCandidate(fiestaId, activeReqId, 'caller', c, {
          guestId,
          guestAccessToken,
          callerToken: activeCallerToken,
        });
      }

      let acceptedStartedAt = 0;
      const seenCalleeIce = new Set<string>();

      pollRef.current = setInterval(async () => {
        const statusRes = await getGuestLiveStreamStatus(fiestaId, activeReqId, {
          guestId,
          guestAccessToken,
          callerToken: activeCallerToken,
        });
        const current = statusRes.request;
        if (!current) return;
        setRequest(current);

        if (current.status === 'rejected') {
          cleanup();
          setError('El operador no aceptó la transmisión en este momento.');
          setPhase('preview');
          return;
        }

        if (current.status === 'ended') {
          cleanup();
          onOpenChange(false);
          toast({ title: 'Transmisión finalizada' });
          return;
        }

        if (current.status === 'accepted' || current.status === 'live') {
          if (!acceptedStartedAt) {
            acceptedStartedAt = Date.now();
            fallbackTimerRef.current = setTimeout(() => {
              if (pcRef.current && pcRef.current.connectionState !== 'connected') {
                toast({
                  title: 'La red tardó más de 10s',
                  description: 'Activamos el Plan B: grabá un clip de 15s y lo enviamos a moderación.',
                });
                startFallbackClip();
              }
            }, LIVE_STREAM_CONNECT_TIMEOUT_MS);
          }

          if (current.acceptedAt) {
            const elapsed = Math.floor((Date.now() - Date.parse(current.acceptedAt)) / 1000);
            setSecondsLeft(Math.max(0, (current.maxDurationSeconds || LIVE_STREAM_MAX_DURATION_SECONDS) - elapsed));
          }

          if (current.answerSdp && !pc.currentRemoteDescription) {
            const answer = JSON.parse(current.answerSdp);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            setPhase('live');
            if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          }

          for (const raw of current.calleeCandidates ?? []) {
            if (!seenCalleeIce.has(raw)) {
              seenCalleeIce.add(raw);
              try {
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(raw)));
              } catch {}
            }
          }
        }
      }, 1500);
    } catch (e: any) {
      cleanup();
      setError(e?.message || 'No se pudo iniciar la transmisión.');
      setPhase('preview');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-600" />
            Salir en la pantalla
          </DialogTitle>
          <DialogDescription>
            El operador acepta tu cámara antes de mostrarla (máx. 60 segundos). Si la red no conecta en 10s, grabás un clip de 15s para moderación.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative aspect-[3/4] max-h-[340px] w-full overflow-hidden rounded-xl bg-slate-950">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          {phase === 'live' && (
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              EN VIVO · {secondsLeft}s
            </div>
          )}
          {phase === 'fallback_recording' && (
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-slate-950 shadow">
              Grabando Plan B · {clipSeconds}s / {LIVE_STREAM_FALLBACK_CLIP_SECONDS}s
            </div>
          )}
        </div>

        {phase === 'preview' && (
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleRequestLive}
              disabled={!streamRef.current}
              className="w-full h-12 font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              <Radio className="w-4 h-4 mr-2" />
              Pedir salir en pantalla
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={startFallbackClip}
              disabled={!streamRef.current}
              className="w-full h-10 text-xs font-bold"
            >
              <Video className="w-4 h-4 mr-1.5" />
              Plan B: grabar clip de 15s para moderación
            </Button>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              <span>Esperando aceptación del operador...</span>
            </div>
            <p className="text-xs text-slate-500">
              Pedido #{request?.id.slice(-4)} · Nunca salís al aire sin aprobación.
            </p>
            <Button type="button" variant="outline" onClick={startFallbackClip} className="w-full text-xs font-bold">
              Grabar clip de 15s en su lugar (Plan B)
            </Button>
          </div>
        )}

        {phase === 'fallback_recording' && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => recorderRef.current?.stop()}
            className="w-full h-12 font-bold"
          >
            <Square className="w-4 h-4 mr-2 fill-current" />
            Enviar clip ahora ({clipSeconds}s)
          </Button>
        )}

        {phase === 'uploading' && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enviando clip a moderación...</span>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <p className="text-sm font-bold text-slate-800">¡Listo! Tu clip entró a moderación.</p>
            <Button type="button" onClick={() => onOpenChange(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
