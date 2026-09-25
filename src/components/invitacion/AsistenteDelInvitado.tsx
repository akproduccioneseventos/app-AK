'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { chatConAsistenteInvitado } from '@/app/actions/asistente-virtual';
import type { MessageData } from 'genkit';

interface AsistenteDelInvitadoProps {
  fiestaId: string;
  invitadoNombre?: string;
  mesaAsignada?: string;
}

interface MensajeChat {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AsistenteDelInvitado({
  fiestaId,
  invitadoNombre,
  mesaAsignada,
}: AsistenteDelInvitadoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'bienvenida',
      role: 'assistant',
      text: `¡Hola${invitadoNombre ? ` ${invitadoNombre}` : ''}! 🎉 Soy tu asistente de la fiesta. ¿En qué te puedo ayudar? Podés preguntarme sobre los horarios, cómo llegar, tu mesa o lo que necesites.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput('');

    const userMsg: MensajeChat = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: userText,
    };
    const nuevosMensajes = [...mensajes, userMsg];
    setMensajes(nuevosMensajes);
    setIsLoading(true);

    try {
      // Convertir el historial al formato MessageData de genkit esperado por chatConAsistenteInvitado
      const historyGenkit: MessageData[] = mensajes
        .filter((m) => m.id !== 'bienvenida')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: [{ text: m.text }],
        }));

      const res = await chatConAsistenteInvitado(
        fiestaId,
        historyGenkit,
        userText,
        invitadoNombre,
        mesaAsignada,
      );

      if (res.success && res.text) {
        setMensajes((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: res.text as string,
          },
        ]);
      } else {
        setMensajes((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text: res.error || 'Disculpá, no pude procesar tu consulta en este momento.',
          },
        ]);
      }
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Hubo un error de conexión. Probá de nuevo en unos instantes.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              onClick={() => setIsOpen(true)}
              data-testid="btn-asistente-invitado"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold px-4 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>¿Tenés una duda?</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-[92vw] sm:w-[380px] h-[500px] max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Cabezal */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-rose-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">Asistente del Invitado</h3>
                  <p className="text-[11px] text-white/80 mt-1">Preguntas y respuestas del evento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                aria-label="Cerrar asistente"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div
              data-testid="mensajes-asistente-invitado"
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50 text-sm"
            >
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                      m.role === 'user'
                        ? 'bg-red-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                    <span>Consultando datos del evento...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulario de entrada */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2"
            >
              <input
                type="text"
                data-testid="input-asistente-invitado"
                placeholder="Escribí tu consulta acá..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                data-testid="btn-enviar-asistente-invitado"
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white min-h-[40px] min-w-[40px] shrink-0"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
