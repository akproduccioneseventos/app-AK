'use client'

import { useState } from 'react';
import { Sparkles, Send, X, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askConcierge } from '@/app/actions/concierge.actions';
import { QUICK_SUGGESTIONS, ConciergeAnswer } from '@/lib/concierge/concierge-engine';

interface Message {
  role: 'user' | 'concierge';
  content: string;
  dataPoints?: { label: string; value: string }[];
  suggestedFollowUps?: string[];
}

export function ConciergeWidget({ fiestaId }: { fiestaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askConcierge(fiestaId, question);
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
        { role: 'concierge', content: 'Lo siento, ha ocurrido un error al procesar tu solicitud.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">AK Concierge IA</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 mt-4 space-y-4">
                <p>¡Hola! Soy tu asistente IA de AK Producciones. ¿En qué te puedo ayudar hoy?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      className="text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 px-3 py-1.5 rounded-full transition-colors"
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
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-700 text-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>

                {msg.dataPoints && msg.dataPoints.length > 0 && (
                  <div className="mt-2 w-full max-w-[85%] bg-slate-800 rounded-xl p-3 border border-slate-700">
                    {msg.dataPoints.map((dp, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-700/50 last:border-0">
                        <span className="text-slate-400">{dp.label}</span>
                        <span className="font-medium text-slate-200">{dp.value}</span>
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
                        className="text-xs bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-indigo-500/30 px-2 py-1 rounded-full transition-colors"
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
                <div className="bg-slate-700 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span className="text-sm text-slate-300">Pensando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm">
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
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </Button>
      )}
    </div>
  );
}
