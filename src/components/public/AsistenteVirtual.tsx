'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, Bot, Loader2, Link as LinkIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { chatWithVirtualAssistant, type AssistantResponse } from '@/app/actions/asistente-virtual';

// Generar o recuperar sessionId (por simplicidad, un ID aleatorio por recarga/sesión)
function getSessionId() {
  if (typeof window === 'undefined') return 'anon';
  let sid = sessionStorage.getItem('ak_assistant_sid');
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('ak_assistant_sid', sid);
  }
  return sid;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isBudgetLink?: boolean;
  budgetUrl?: string;
}

export function AsistenteVirtual() {
  const [enabled, setEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasFetchedSettings, setHasFetchedSettings] = useState(false);
  const pathname = usePathname();

  const isPublicRoute = !pathname?.startsWith('/fiestas') && 
                        !pathname?.startsWith('/presupuestos') && 
                        !pathname?.startsWith('/settings') &&
                        !pathname?.startsWith('/agenda') &&
                        !pathname?.startsWith('/clientes');

  useEffect(() => {
    async function init() {
      try {
        const settings = await getBudgetDisplaySettings();
        if (settings?.virtualAssistantEnabled) {
          setEnabled(true);
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              text: settings.assistantWelcomeMessage || '¡Hola! Soy el Asistente de AK. ¿En qué te puedo ayudar hoy?'
            }
          ]);
        }
      } catch (e) {
        console.error('Error cargando ajustes del asistente', e);
      }
      setHasFetchedSettings(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (!hasFetchedSettings || !enabled || !isPublicRoute) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput('');
    
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Formateamos para Genkit (simplificado)
      const genkitHistory = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role as 'user' | 'assistant' | 'model',
        content: [{ text: m.text }]
      }));
      // En genkit el assistant a veces se mapea a 'model'
      const formattedHistory = genkitHistory.map(m => ({
        ...m,
        role: m.role === 'assistant' ? 'model' : m.role
      })) as any[];

      const res = await chatWithVirtualAssistant(getSessionId(), formattedHistory, userText);

      if (res.success) {
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now().toString(), 
            role: 'assistant', 
            text: res.text || 'Sin respuesta',
            isBudgetLink: res.budgetGenerated,
            budgetUrl: res.budgetUrl
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now().toString(), 
            role: 'assistant', 
            text: res.error || 'Hubo un error de conexión.' 
          }
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'assistant', 
          text: 'En este momento nuestros asesores están ocupados. Por favor, utilizá el botón de WhatsApp tradicional.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[999] p-4 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors"
            style={{ boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="fixed bottom-6 right-6 z-[1000] w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shadow-md relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold leading-tight">Asistente AK</h3>
                  <p className="text-xs text-indigo-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    En línea
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
              <div className="text-center pb-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Las respuestas son generadas por IA
                </p>
              </div>
              
              {messages.map((msg, idx) => (
                <div 
                  key={msg.id || idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.isBudgetLink && msg.budgetUrl && (
                      <div className="mt-3">
                        <Button 
                          asChild
                          size="sm" 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                          <a href={msg.budgetUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="w-4 h-4" />
                            Ver mi presupuesto
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl p-4 bg-white border border-slate-100 rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="text-xs text-slate-500">Escribiendo...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Privacidad */}
            <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <p className="text-[10px] text-slate-500 font-medium">Tus datos están seguros y no serán compartidos.</p>
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribí un mensaje..."
                  className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
