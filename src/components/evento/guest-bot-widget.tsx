'use client';

import { useState } from 'react';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { chatWithGuestBot } from '@/app/actions/salon-ia.actions';

interface GuestBotWidgetProps {
  fiesta: FiestaEnPlanificacion;
}

export function GuestBotWidget({ fiesta }: GuestBotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([
    { role: 'bot', text: `¡Hola! Soy el asistente virtual de la fiesta de ${fiesta.configuracion?.nombreAgasajado || fiesta.configuracion?.clienteNombre || 'nuestro anfitrión'}. ¿En qué te puedo ayudar hoy?` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    const currentHistory = [...messages, { role: 'user' as const, text: userText }];
    setMessages(currentHistory);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await chatWithGuestBot(fiesta, userText, currentHistory);
      setMessages(prev => [...prev, { role: 'bot' as const, text: res.response }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'bot' as const, text: "Disculpa, no pude responder en este momento. ¡Te esperamos con muchas ganas!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden flex flex-col h-[500px] max-h-[80vh] border border-slate-100 animate-in slide-in-from-bottom-5">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-sm">Asistente Virtual IA</h3>
                <p className="text-xs text-indigo-200">Respondiendo con Gemini</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-700 rounded-full" onClick={() => setIsOpen(false)}>
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4 bg-slate-50">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex w-max max-w-[80%] rounded-2xl px-4 py-2 text-sm", msg.role === 'user' ? "ml-auto bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-800")}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="flex w-max max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-white border border-slate-200 text-slate-400 italic animate-pulse">
                  Pensando...
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <Input 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pregúntame algo..." 
              className="rounded-full bg-slate-50 border-none h-10"
              disabled={isTyping}
            />
            <Button size="icon" className="rounded-full h-10 w-10 bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={handleSend} disabled={isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-xl flex items-center justify-center animate-bounce shadow-indigo-600/30"
        >
          <Bot className="w-6 h-6 text-white" />
        </Button>
      )}
    </div>
  );
}
