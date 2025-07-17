
'use client';

import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Bot, User, Send, X, Loader2, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { analyzeEventPlan, type AnalyzeEventPlanOutput } from '@/ai/flows/analyze-event-plan-flow';
import { analyzeCodebase, type AnalyzeCodebaseOutput } from '@/ai/flows/analyze-codebase-flow';
import Markdown from 'react-markdown';


type Message = {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    type?: 'analysis-result' | 'code-analysis' | 'text';
};

export function AkAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "¡Hola! Soy Asistente AK. ¿Cómo puedo ayudarte a optimizar tu evento hoy?",
                type: 'text',
            }]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);
    
    const renderAnalysisItems = (items: AnalyzeCodebaseOutput['completedModules'], category: string) => {
      if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground">No se encontraron elementos en esta categoría.</p>;
      }
      return (
        <ul className="space-y-2 text-sm">
          {items.map((item, index) => (
            <li key={`${category}-${index}`} className="p-2 border rounded-md bg-background/50">
              <p className="font-semibold text-foreground">{item.module}</p>
              <p className="text-xs text-primary">{item.status}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
            </li>
          ))}
        </ul>
      );
    }

    const handleCodeAnalysis = async () => {
        setMessages(prev => [...prev, { role: 'user', content: 'Analizar el código base de la aplicación.' }]);
        setIsLoading(true);
        try {
            // In a real scenario, this might need a more complex way to get the spec,
            // but for now, an empty string is fine as the prompt has the snapshot.
            const result = await analyzeCodebase({ specification: '' });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: (
                    <div className="space-y-4">
                        <h4 className="font-bold text-lg">Análisis de Código Completado</h4>
                        <p className="text-sm text-muted-foreground">{result.overallSummary}</p>
                        <details><summary className="font-semibold cursor-pointer">Módulos Completados</summary><div className="pt-2">{renderAnalysisItems(result.completedModules, 'completed')}</div></details>
                        <details><summary className="font-semibold cursor-pointer">Módulos Faltantes</summary><div className="pt-2">{renderAnalysisItems(result.missingModules, 'missing')}</div></details>
                        <details><summary className="font-semibold cursor-pointer">Errores y Bugs</summary><div className="pt-2">{renderAnalysisItems(result.errorsAndBugs, 'bugs')}</div></details>
                        <details><summary className="font-semibold cursor-pointer">Sugerencias</summary><div className="pt-2">{renderAnalysisItems(result.suggestions, 'suggestions')}</div></details>
                    </div>
                ),
                type: 'code-analysis'
            }]);
        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEventPlanAnalysis = async () => {
        setMessages(prev => [...prev, { role: 'user', content: 'Analizar el plan de la fiesta actual.' }]);
        setIsLoading(true);
        try {
            const planData = await getFiestaActual();
            const result = await analyzeEventPlan({ planData });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: (
                    <div className="space-y-3">
                        <h4 className="font-bold text-lg">Análisis del Plan de Evento</h4>
                        <p className="text-sm text-muted-foreground">{result.overallSummary}</p>
                        <ul className="space-y-2 text-sm">
                            {result.analysisItems.map(item => (
                                <li key={item.module} className="p-2 border rounded-md bg-background/50">
                                    <p className="font-semibold">{item.module}: <span className="text-primary">{item.status}</span></p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
                                    {item.suggestion && <p className="text-xs text-blue-600 mt-1">Sugerencia: {item.suggestion}</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ),
                type: 'analysis-result'
            }]);
        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        // Placeholder for future free-form chat logic
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: "La funcionalidad de chat libre está en desarrollo. Por ahora, puedes usar los botones de acción.", type: 'text' }]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed bottom-24 right-4 sm:right-6 md:right-8 z-40 w-[calc(100%-2rem)] max-w-md"
                    >
                        <Card className="h-[60vh] flex flex-col shadow-2xl border-primary/20">
                            <CardContent className="p-4 flex-grow flex flex-col min-h-0">
                                <ScrollArea className="flex-grow pr-3" ref={scrollAreaRef}>
                                    <div className="space-y-4">
                                        {messages.map((message, index) => (
                                            <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                                                {message.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5"/></div>}
                                                <div className={cn("p-3 rounded-lg max-w-xs md:max-w-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                    <Markdown className="prose prose-sm dark:prose-invert prose-p:my-1">{typeof message.content === 'string' ? message.content : ''}</Markdown>
                                                    {typeof message.content !== 'string' && message.content}
                                                </div>
                                                {message.role === 'user' && <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0"><User className="w-5 h-5"/></div>}
                                            </div>
                                        ))}
                                         {isLoading && (
                                            <div className="flex items-start gap-3 justify-start">
                                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5"/></div>
                                                <div className="p-3 rounded-lg bg-muted flex items-center"><Loader2 className="w-5 h-5 animate-spin text-primary"/></div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                 <div className="mt-4 pt-3 border-t">
                                     <div className="flex gap-2 flex-wrap justify-center mb-3">
                                        <Button size="sm" variant="outline" onClick={handleEventPlanAnalysis} disabled={isLoading}>Analizar Fiesta Actual</Button>
                                        <Button size="sm" variant="outline" onClick={handleCodeAnalysis} disabled={isLoading}>Analizar Código</Button>
                                    </div>
                                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                        <Textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Escribe tu consulta..."
                                            className="flex-grow resize-none"
                                            rows={1}
                                            disabled={isLoading}
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmit(e);
                                                }
                                            }}
                                        />
                                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}><Send className="w-5 h-5"/></Button>
                                    </form>
                                 </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
            <Button
                size="icon"
                className="fixed bottom-4 right-4 sm:right-6 md:right-8 z-50 rounded-full w-16 h-16 shadow-lg"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Abrir Asistente AK"
            >
                <AnimatePresence>
                {isOpen ? <motion.div key="close" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }}><X className="w-7 h-7"/></motion.div> 
                         : <motion.div key="open" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }}><Sparkles className="w-7 h-7"/></motion.div>}
                </AnimatePresence>
            </Button>
        </>
    );
}
