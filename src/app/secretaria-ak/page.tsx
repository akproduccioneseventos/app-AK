'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  CalendarCheck,
  Loader2,
  Mic,
  MicOff,
  PhoneCall,
  Radio,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { sendMultiAgentMessage } from '@/app/actions/multiagent';
import type { AkMultiAgentMessage } from '@/types/multiagent';

type ChatMessage = AkMultiAgentMessage & { id: string; agentName?: string };

const quickActions = [
  { title: 'Qué hago hoy', prompt: 'Actuá como mi secretaria y decime qué tengo que hacer hoy, por prioridad.', icon: CalendarCheck },
  { title: 'A quién llamo', prompt: 'Decime a quién debería llamar o escribir hoy y por qué.', icon: PhoneCall },
  { title: 'Pagos a revisar', prompt: 'Decime qué pagos, saldos o cobros debería revisar hoy.', icon: WalletCards },
  { title: 'Resumen rápido', prompt: 'Dame un resumen rápido de prioridades de la empresa y fiestas.', icon: Sparkles },
];

function selectBestSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. es-UY (Uruguay)
  const uy = voices.find((v) => v.lang === 'es-UY' || v.lang.startsWith('es_UY') || v.lang.toLowerCase().includes('uy'));
  if (uy) return uy;

  // 2. es-AR (Argentina / Rioplatense)
  const ar = voices.find((v) => v.lang === 'es-AR' || v.lang.startsWith('es_AR') || v.lang.toLowerCase().includes('ar'));
  if (ar) return ar;

  // 3. es-419 / es-US (Latinoamérica)
  const latam = voices.find((v) => v.lang === 'es-419' || v.lang === 'es-US' || v.lang.toLowerCase().includes('419') || v.lang.toLowerCase().includes('us'));
  if (latam) return latam;

  // 4. Cualquier voz en español
  const generalEs = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
  if (generalEs) return generalEs;

  return null;
}

function truncateForSpeech(text: string): string {
  const cleaned = text
    .replace(/[*#_`~>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 3) {
    return cleaned;
  }
  return `${sentences.slice(0, 3).join(' ')} ¿Querés que siga con más detalle?`;
}

export default function SecretariaAkPage() {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Control de voz y manos libres
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isHandsFreeRef = useRef(isHandsFree);
  const isVoiceMutedRef = useRef(isVoiceMuted);
  const isSendingRef = useRef(isSending);
  const startListeningRef = useRef<(autoSend?: boolean) => void>(() => {});

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
  }, [isHandsFree]);

  useEffect(() => {
    isVoiceMutedRef.current = isVoiceMuted;
  }, [isVoiceMuted]);

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setIsRecordingVoice(false);
  }, []);

  const speakText = useCallback((text: string, onFinish?: () => void) => {
    if (isVoiceMutedRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onFinish?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const bestVoice = selectBestSpanishVoice();
      const speechText = truncateForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(speechText);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      } else {
        utterance.lang = 'es-UY';
      }
      utterance.rate = 1.02;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onFinish?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onFinish?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      onFinish?.();
    }
  }, []);

  const askSecretaria = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSendingRef.current) return;

    stopListening();
    const userMessage: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: trimmed };
    setMessages(prev => {
      const history = [...prev, userMessage].slice(-12).map(({ role, content }) => ({ role, content }));
      void (async () => {
        setIsSending(true);
        try {
          const result = await sendMultiAgentMessage(trimmed, history, { pathname: '/secretaria-ak', agentType: 'secretaria' });
          setMessages(p => [...p, { id: `a_${Date.now()}`, role: 'assistant', content: result.response, agentName: result.agentName }]);
          speakText(result.response, () => {
            if (isHandsFreeRef.current) {
              startListeningRef.current(true);
            }
          });
        } catch {
          const errorMsg = 'No pude revisar ahora. Probá de nuevo o pasame el error.';
          setMessages(p => [...p, { id: `a_${Date.now()}`, role: 'assistant', content: errorMsg, agentName: 'Secretaria AK' }]);
          speakText(errorMsg, () => {
            if (isHandsFreeRef.current) {
              startListeningRef.current(true);
            }
          });
        } finally {
          setIsSending(false);
        }
      })();
      return [...prev, userMessage];
    });
    setInput('');
  }, [speakText, stopListening]);

  const startListening = useCallback((autoSend = false) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      stopListening();
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-UY';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (e: any) => {
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0]?.transcript || '';
          if (e.results[i].isFinal) final += text + ' ';
        }
        if (final.trim()) {
          const recognizedText = final.trim();
          setIsRecordingVoice(false);
          recognition.stop();
          if (isHandsFreeRef.current || autoSend) {
            void askSecretaria(recognizedText);
          } else {
            setInput(prev => (prev ? prev + ' ' : '') + recognizedText);
          }
        }
      };

      recognition.onerror = () => {
        setIsRecordingVoice(false);
        // Si estamos en manos libres y hubo un silencio/timeout, reintentamos escuchar tras una breve pausa
        if (isHandsFreeRef.current && !isSendingRef.current) {
          setTimeout(() => {
            if (isHandsFreeRef.current && !isSendingRef.current && !isRecordingVoice) {
              startListening(true);
            }
          }, 1500);
        }
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecordingVoice(true);
    } catch {
      setIsRecordingVoice(false);
    }
  }, [askSecretaria, stopListening, isRecordingVoice]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const toggleHandsFree = () => {
    const next = !isHandsFree;
    setIsHandsFree(next);
    if (next) {
      startListening(true);
    } else {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      stopListening();
    } else {
      startListening(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-red-600 p-4 text-white shadow-lg shadow-red-900/20">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-600 text-white">Asistente personal</Badge>
                {isHandsFree && (
                  <Badge className="bg-emerald-600 text-white animate-pulse flex items-center gap-1">
                    <Radio className="w-3 h-3" /> Manos Libres Activo
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Secretaria AK</h1>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Tu asistente diaria para ordenar prioridades, llamados, pagos, reuniones y próximos pasos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={isHandsFree ? 'default' : 'outline'}
              onClick={toggleHandsFree}
              className={`rounded-2xl font-bold text-xs gap-2 transition-all ${
                isHandsFree
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'
                  : 'border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Radio className={`w-4 h-4 ${isHandsFree ? 'animate-pulse' : ''}`} />
              {isHandsFree ? 'Desactivar Manos Libres' : 'Modo Manos Libres'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              title={isVoiceMuted ? 'Activar voz' : 'Silenciar voz'}
              className="rounded-2xl border-red-200 text-slate-700 hover:bg-red-50 h-10 w-10 p-0"
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-600" />}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={() => askSecretaria(action.prompt)}
              className="rounded-2xl border border-red-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50"
            >
              <Icon className="mb-3 h-5 w-5 text-red-600" />
              <p className="text-sm font-black text-slate-900">{action.title}</p>
            </button>
          );
        })}
      </div>

      <Card className="rounded-3xl border-red-100 bg-white shadow-xl shadow-red-900/5">
        <CardHeader className="border-b border-red-50 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-black">
            <Bot className="h-5 w-5 text-red-600" /> Conversación
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            {isRecordingVoice && (
              <span className="flex items-center gap-1.5 text-red-600 font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                Escuchando tu voz...
              </span>
            )}
            {isSpeaking && (
              <span className="flex items-center gap-1.5 text-indigo-600 font-bold animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                Hablando...
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="min-h-[360px] space-y-3 rounded-2xl bg-slate-50 p-4">
            {messages.length === 0 && (
              <div className="flex h-[320px] flex-col items-center justify-center text-center text-slate-500">
                <Sparkles className="mb-4 h-10 w-10 text-red-500" />
                <p className="font-black text-slate-800">Arrancá por una revisión diaria.</p>
                <p className="text-xs text-slate-400 mt-1">Podés escribir o activar el modo manos libres para hablar directo.</p>
              </div>
            )}
            {messages.map(message => (
              <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={message.role === 'user' ? 'max-w-[84%] rounded-2xl bg-red-600 px-4 py-3 text-sm leading-6 text-white' : 'max-w-[84%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm'}>
                  {message.role === 'assistant' && message.agentName && <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-red-600">{message.agentName}</p>}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Revisando...
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={isRecordingVoice ? 'Escuchando tu voz...' : 'Ejemplo: ordename el día de hoy...'}
              className="min-h-[52px] resize-none rounded-2xl"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void askSecretaria(input);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={toggleVoiceRecording}
              disabled={isSending}
              title={isRecordingVoice ? 'Detener dictado' : 'Dictar por voz'}
              className={`rounded-2xl px-4 transition-all ${
                isRecordingVoice
                  ? 'bg-red-50 text-red-600 border-red-300 animate-pulse hover:bg-red-100'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isRecordingVoice ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => askSecretaria(input)}
              disabled={isSending || !input.trim()}
              className="rounded-2xl bg-red-600 px-5 hover:bg-red-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
