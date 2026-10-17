'use client'

import { useState, useRef } from 'react';
import { Sparkles, Send, X, MessageCircle, Loader2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askConcierge } from '@/app/actions/concierge.actions';
import { QUICK_SUGGESTIONS } from '@/lib/concierge/concierge-engine';

interface Message {
  role: 'user' | 'concierge';
  content: string;
  dataPoints?: { label: string; value: string }[];
  suggestedFollowUps?: string[];
}

export function ConciergeWidget({
  fiestaId,
  guestId,
  guestAccessToken,
}: {
  fiestaId: string;
  guestId: string;
  guestAccessToken: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-UY';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askConcierge(fiestaId, guestId, guestAccessToken, question);
      const conciergeMessage: Message = {
        role: 'concierge',
        content: response.answer,
        dataPoints: response.dataPoints,
        suggestedFollowUps: response.suggestedFollowUps
      };
      setMessages((prev) => [...prev, conciergeMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'concierge', content: 'Perdón, hubo un problema al procesar tu consulta. Probá de nuevo en unos segundos.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between p-4 border-b border-amber-500/20 bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white tracking-wide">AK Concierge VIP</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 && (
              <div className="text-center text-slate-300 mt-4 space-y-4">
                <p className="text-sm">¡Hola! Soy tu asistente de la fiesta. ¿Qué querés consultar?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-br-none shadow-md'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>

                {msg.dataPoints && msg.dataPoints.length > 0 && (
                  <div className="mt-2 w-full max-w-[85%] bg-slate-900/90 rounded-xl p-3 border border-amber-500/20">
                    {msg.dataPoints.map((dp, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-700/50 last:border-0">
                        <span className="text-slate-400">{dp.label}</span>
                        <span className="font-semibold text-amber-400">{dp.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.suggestedFollowUps && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.suggestedFollowUps.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(sug)}
                        className="text-xs bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30 px-2 py-1 rounded-full transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-sm text-slate-300">Consultando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí o hablá tu consulta..."
                className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={startListening}
                className={`border-slate-700 ${isListening ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' : 'text-slate-300 hover:text-white'}`}
                title={isListening ? 'Escuchando... tocá para parar' : 'Dictar por voz'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="w-6 h-6 text-slate-950" />
        </Button>
      )}
    </div>
  );
}
