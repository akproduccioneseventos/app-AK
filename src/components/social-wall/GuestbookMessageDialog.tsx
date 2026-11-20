'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Video, Square, Send, Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GUESTBOOK_MAX_SECONDS } from '@/lib/social-fiesta/libro-de-firmas';
import { submitGuestbookMessage } from '@/app/actions/social-interactive';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface GuestbookMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiestaId: string;
  authorName: string;
  accentColor: string;
}

export function GuestbookMessageDialog({
  open,
  onOpenChange,
  fiestaId,
  authorName,
  accentColor,
}: GuestbookMessageDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'audio' | 'video'>('audio');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTracks = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      stopTracks();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setRecordedBlob(null);
      setPreviewUrl(null);
      setSeconds(0);
      setRecording(false);
      setMessageText('');
      setSent(false);
      setError(null);
    }
  }, [open, previewUrl]);

  const startRecording = async () => {
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setSeconds(0);

    try {
      const media = await navigator.mediaDevices.getUserMedia(
        mode === 'video' ? { video: true, audio: true } : { audio: true },
      );
      streamRef.current = media;
      if (mode === 'video' && liveVideoRef.current) {
        liveVideoRef.current.srcObject = media;
      }

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(media);
      recorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        media.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecording(false);
        const type = recorder.mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm');
        const blob = new Blob(chunks, { type });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      setRecording(true);
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= GUESTBOOK_MAX_SECONDS && recorder.state === 'recording') {
          recorder.stop();
        }
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'No pudimos acceder al micrófono o cámara.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  const handleSubmit = async () => {
    if (!recordedBlob || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const ext = mode === 'video' ? 'webm' : 'webm';
      const file = new File([recordedBlob], `firma-${Date.now()}.${ext}`, {
        type: recordedBlob.type || (mode === 'video' ? 'video/webm' : 'audio/webm'),
      });
      const fd = new FormData();
      fd.append('file', file);
      fd.append('authorName', authorName || 'Invitado');
      fd.append('message', messageText.trim());
      fd.append('durationSeconds', String(Math.max(1, seconds)));

      const res = await submitGuestbookMessage(fiestaId, fd);
      if (!res.success) {
        throw new Error(res.error || 'No se pudo guardar el mensaje.');
      }
      setSent(true);
      toast({
        title: 'Mensaje guardado para los anfitriones',
        description: 'Va directo al álbum privado del cliente, nunca al muro público.',
      });
    } catch (e: any) {
      setError(e?.message || 'Error al enviar tu mensaje.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-rose-600" />
            Dejale un mensaje
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            Hasta {GUESTBOOK_MAX_SECONDS}s en audio o video. Solo lo ve el cliente en su álbum.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-900">¡Gracias! Tu mensaje quedó guardado en &quot;Mensajes para vos&quot;.</p>
            <Button type="button" onClick={() => onOpenChange(false)} className="w-full">
              Listo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === 'audio' ? 'default' : 'outline'}
                disabled={recording}
                onClick={() => setMode('audio')}
                className="h-10 font-bold"
                style={mode === 'audio' ? { backgroundColor: accentColor } : undefined}
              >
                <Mic className="w-4 h-4 mr-1.5" /> Audio
              </Button>
              <Button
                type="button"
                variant={mode === 'video' ? 'default' : 'outline'}
                disabled={recording}
                onClick={() => setMode('video')}
                className="h-10 font-bold"
                style={mode === 'video' ? { backgroundColor: accentColor } : undefined}
              >
                <Video className="w-4 h-4 mr-1.5" /> Video
              </Button>
            </div>

            {mode === 'video' && (recording || previewUrl) && (
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                {recording ? (
                  <video ref={liveVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                ) : previewUrl ? (
                  <video src={previewUrl} controls className="w-full h-full object-cover" />
                ) : null}
              </div>
            )}

            {mode === 'audio' && previewUrl && !recording && (
              <audio src={previewUrl} controls className="w-full h-10" />
            )}

            <div className="flex items-center justify-between gap-3">
              {recording ? (
                <Button type="button" variant="destructive" onClick={stopRecording} className="w-full h-12 font-bold">
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Detener ({seconds}s / {GUESTBOOK_MAX_SECONDS}s)
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={startRecording} className="w-full h-12 font-bold">
                  {mode === 'video' ? <Video className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {recordedBlob ? 'Volver a grabar' : `Grabar ${mode} (máx ${GUESTBOOK_MAX_SECONDS}s)`}
                </Button>
              )}
            </div>

            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              maxLength={300}
              placeholder="Sumá unas palabras escritas (opcional)"
              className="min-h-20 bg-slate-50 text-slate-950"
            />

            <Button
              type="button"
              disabled={!recordedBlob || recording || submitting}
              onClick={handleSubmit}
              className="w-full h-12 font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar mensaje privado
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
