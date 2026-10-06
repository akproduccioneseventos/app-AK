'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { chatConAsistenteCliente } from '@/app/actions/asistente-virtual';
import type { MessageData } from 'genkit';

interface AsistenteDelClienteProps {
  fiestaId: string;
  nombreEvento?: string;
}

interface MensajeChat {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AsistenteDelCliente({
  fiestaId,
  nombreEvento,
}: AsistenteDelClienteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'bienvenida',
      role: 'assistant',
      text: `¡Hola! 👋 Soy tu asistente virtual de AK Producciones${nombreEvento ? ` para ${nombreEvento}` : ''}. ¿En qué te puedo ayudar hoy? Podés consultarme sobre las fechas, el contrato, tus tareas o detalles de la fiesta.`,
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
      const historyGenkit: MessageData[] = mensajes
        .filter((m) => m.id !== 'bienvenida')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: [{ text: m.text }],
        }));

      const res = await chatConAsistenteCliente(
        fiestaId,
        historyGenkit,
        userText
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
          text: 'Ocurrió un error de conexión. Por favor intentá de nuevo más tarde.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 px-5 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2.5 font-bold transition-all hover:scale-105 active:scale-95"
              aria-label="Abrir asistente de la fiesta"
            >
              <Bot className="w-6 h-6 animate-pulse" />
              <span className="hidden sm:inline">Asistente Virtual</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-96 max-h-[85vh] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Cabezal */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-foreground/10 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Asistente Virtual</h3>
                  <p className="text-[11px] opacity-80 leading-tight">AK Producciones · Portal del Cliente</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full h-8 w-8"
                aria-label="Cerrar asistente"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card border border-border text-card-foreground shadow-sm rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input y envío */}
            <div className="p-3 bg-card border-t border-border flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Preguntame sobre tu fiesta o contrato..."
                disabled={isLoading}
                className="flex-1 bg-muted/40 border border-input rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="rounded-xl shrink-0 h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                aria-label="Enviar mensaje"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
