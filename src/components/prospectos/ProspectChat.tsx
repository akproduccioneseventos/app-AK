'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ProspectChat({ prospectName }: { prospectName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `¡Hola ${prospectName}! 👋 Soy la Inteligencia Artificial de AK Producciones. ¿En qué te puedo ayudar hoy con tu evento?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Aquí conectaríamos con una API real de IA (ej. OpenAI o Gemini)
    // Por ahora simulamos la respuesta para la Landing
    setTimeout(() => {
      let aiResponse = 'Esa es una gran pregunta. Para darte la mejor respuesta o armar algo a tu medida, te recomiendo usar nuestro Simulador o tocar el botón de WhatsApp para hablar con nuestro equipo humano.';
      
      if (userMsg.toLowerCase().includes('precio') || userMsg.toLowerCase().includes('costo')) {
        aiResponse = 'Los precios varían dependiendo de la cantidad de invitados y los servicios que elijas (DJ, Barra VIP, Catering, etc). ¡Te invito a usar el Simulador Manual aquí en el portal para ver un estimado al instante!';
      } else if (userMsg.toLowerCase().includes('salon') || userMsg.toLowerCase().includes('lugar')) {
        aiResponse = 'Trabajamos con salones exclusivos como el Club Uruguay, pero también podemos armar la fiesta donde tú prefieras (chacras, clubes, etc).';
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        className="fixed bottom-28 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-110 transition-transform"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="w-7 h-7" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">Asistente AK</h3>
                  <p className="text-[10px] text-indigo-200">En línea</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-amber-500 text-black rounded-tr-sm' 
                      : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white p-3 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-white/10 flex gap-2">
              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-black/50 border-white/10 rounded-full text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />
              <Button type="submit" disabled={!input.trim()} className="rounded-full w-10 h-10 p-0 bg-indigo-600 hover:bg-indigo-700 shrink-0">
                <Send className="w-4 h-4 text-white ml-1" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
