'use client';

import { useState } from 'react';
import { Bot, X, Send, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

interface GuestBotWidgetProps {
  fiesta: FiestaEnPlanificacion;
}

export function GuestBotWidget({ fiesta }: GuestBotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([
    { role: 'bot', text: `¡Hola! Soy el asistente virtual de la fiesta de ${fiesta.clienteNombre || 'nuestro anfitrión'}. ¿En qué te puedo ayudar hoy?` }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputValue('');

    // Mock AI Logic
    setTimeout(() => {
      let botResponse = "Disculpa, no entendí bien. ¡Pero te esperamos con ganas en la fiesta!";
      const lower = userText.toLowerCase();
      
      if (lower.includes('hora') || lower.includes('cuando') || lower.includes('cuándo')) {
        botResponse = `El evento es el ${fiesta.fecha || 'pronto'}, empezaremos puntual. ¡No llegues tarde!`;
      } else if (lower.includes('ropa') || lower.includes('vestimenta') || lower.includes('ponerme')) {
        botResponse = "El código de vestimenta es elegante sport, ¡vení cómodo pero fachero!";
      } else if (lower.includes('donde') || lower.includes('dónde') || lower.includes('lugar')) {
        botResponse = "Te esperamos en nuestro salón principal. ¡Busca la ubicación en la invitación!";
      }

      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    }, 600);
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
                <p className="text-xs text-indigo-200">Respondiendo al instante</p>
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
            </div>
          </ScrollArea>

          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <Input 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Preguntame algo..." 
              className="rounded-full bg-slate-50 border-none h-10"
            />
            <Button size="icon" className="rounded-full h-10 w-10 bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={handleSend}>
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
