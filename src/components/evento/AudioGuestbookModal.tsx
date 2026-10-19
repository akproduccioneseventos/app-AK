'use client';

import React, { useState, useRef } from 'react';
import { Phone, Mic, Square, Disc, Sparkles, Send, X, Volume2, CheckCircle2 } from 'lucide-react';
import { saveAudioGuestbookEntryAction } from '@/app/actions/audio-guestbook';

interface AudioGuestbookModalProps {
  fiestaId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultMesa?: string;
  defaultAutor?: string;
}

export function AudioGuestbookModal({
  fiestaId,
  isOpen,
  onClose,
  defaultMesa,
  defaultAutor,
}: AudioGuestbookModalProps) {
  const [autor, setAutor] = useState(defaultAutor || '');
  const [mesa, setMesa] = useState(defaultMesa || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 25) {
            stopRecording();
            return 25;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert('Por favor habilitá el micrófono de tu navegador para dejar tu mensaje de voz.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSave = async () => {
    if (!audioBase64) return;
    setSaving(true);
    try {
      const res = await saveAudioGuestbookEntryAction({
        fiestaId,
        autor: autor.trim() || 'Invitado anónimo',
        mesa: mesa.trim() || undefined,
        audioBase64OrUrl: audioBase64,
        duracionSegundos: recordingSeconds,
      });
      if (res.success) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setAudioBase64(null);
          onClose();
        }, 1800);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {sent ? (
          <div className="py-8 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-white">¡Mensaje grabado en el Vinilo!</h3>
            <p className="text-xs text-slate-300">
              La familia lo va a escuchar en su recuerdo digital al día siguiente.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="w-14 h-14 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                <Disc className={`w-8 h-8 ${isRecording ? 'animate-spin text-rose-500' : ''}`} />
              </div>
              <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5 pt-1">
                <Phone className="w-4 h-4 text-amber-400" />
                El Teléfono Rojo Digital
              </h3>
              <p className="text-xs text-slate-400">
                Dejale tu mensaje de voz para el recuerdo como si levantaras un teléfono retro a las 3 AM.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <input
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Tu nombre (ej: Tío Martín, Primas)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
              <input
                type="text"
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                placeholder="Mesa (opcional, ej: Mesa 4)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="py-2">
              {isRecording ? (
                <div className="space-y-3">
                  <div className="text-2xl font-black text-rose-400 font-mono animate-pulse">
                    00:{recordingSeconds.toString().padStart(2, '0')} / 00:25
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 mx-auto"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    Parar y Escuchar
                  </button>
                </div>
              ) : audioBase64 ? (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-400 font-bold">✓ Audio listo ({recordingSeconds}s)</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={startRecording}
                      className="px-3.5 py-2 bg-slate-900 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                    >
                      Grabar de nuevo
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {saving ? 'Guardando...' : 'Enviar al Vinilo'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 mx-auto"
                >
                  <Mic className="w-5 h-5 text-slate-950" />
                  Apretar y Grabar Audio
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
