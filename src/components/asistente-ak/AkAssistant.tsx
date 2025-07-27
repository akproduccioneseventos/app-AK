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
import { assistant } from '@/ai/flows/assistant-flow';
import Markdown from 'react-markdown';
import type { AssistantOutput } from '@/ai/types/assistant-types';


type Message = {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
};

// SVG Icon for the assistant
const AssistantIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="hsl(var(--primary))"/>
        <path d="M68.5 70C68.5 64.201 63.799 59.5 58 59.5H42C36.201 59.5 31.5 64.201 31.5 70V72.5H68.5V70Z" fill="white"/>
        <path d="M58 59.5H42C36.201 59.5 31.5 64.201 31.5 70V72.5H68.5V70C68.5 64.201 63.799 59.5 58 59.5Z" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" strokeWidth="2"/>
        <rect x="30" y="42" width="40" height="25" rx="12.5" fill="white"/>
        <rect x="30" y="42" width="40" height="25" rx="12.5" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" strokeWidth="2"/>
        <circle cx="41.5" cy="52.5" r="5.5" fill="hsl(var(--primary))"/>
        <circle cx="58.5" cy="52.5" r="5.5" fill="hsl(var(--primary))"/>
        <path d="M50 34C53.866 34 57 30.866 57 27C57 23.134 53.866 20 50 20C46.134 20 43 23.134 43 27C43 30.866 46.134 34 50 34Z" fill="white"/>
        <path d="M49 25H51V29H49V25Z" fill="hsl(var(--primary))"/>
        <path d="M45 27H47V29H45V27Z" fill="hsl(var(--primary))"/>
        <path d="M53 27H55V29H53V27Z" fill="hsl(var(--primary))"/>
        <text x="40" y="56" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="hsl(var(--primary))">AK</text>
    </svg>
);

export function AkAssistant({ isOpen: controlledIsOpen, setIsOpen: setControlledIsOpen }: { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen ?? internalIsOpen;
    const setIsOpen = setControlledIsOpen ?? setInternalIsOpen;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && messages.length === 0) {
             const fetchInitialMessage = async () => {
                setIsLoading(true);
                try {
                    // Use a more proactive initial query for the internal assistant.
                    const result = await assistant({ query: "Hola, soy el organizador. ¿Hay algo importante que deba saber sobre mi evento actual?" });
                    setMessages([{ role: 'assistant', content: result.response }]);
                } catch (e: any) {
                    setMessages([{ role: 'assistant', content: `¡Hola! Soy Asistente AK. Ocurrió un error al cargar el resumen: ${e.message}` }]);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialMessage();
        }
    }, [isOpen, messages.length]); // Added messages.length dependency

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentQuery = input;
        setInput('');
        setIsLoading(true);
        
        try {
            const result: AssistantOutput = await assistant({ query: currentQuery });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.response,
            }]);
        } catch (e: any) {
             setMessages(prev => [...prev, { role: 'assistant', content: `Lo siento, ocurrió un error: ${e.message}` }]);
        } finally {
            setIsLoading(false);
        }
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
                                                <div className={cn("p-3 rounded-lg max-w-xs md:max-w-sm prose prose-sm dark:prose-invert prose-p:my-1", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                    <Markdown>{typeof message.content === 'string' ? message.content : ''}</Markdown>
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
            <div className="fixed bottom-4 right-4 sm:right-6 md:right-8 z-50">
                <Button
                    size="icon"
                    className="rounded-full w-16 h-16 shadow-lg bg-transparent hover:bg-transparent p-0 border-2 border-primary/50"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Abrir Asistente AK"
                >
                     <AnimatePresence>
                        {isOpen ? 
                            <motion.div key="close" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} className="w-full h-full flex items-center justify-center bg-primary rounded-full">
                                <X className="w-7 h-7 text-primary-foreground"/>
                            </motion.div> 
                         : 
                            <motion.div key="open" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }} className="w-full h-full">
                                <AssistantIcon />
                            </motion.div>
                        }
                    </AnimatePresence>
                </Button>
            </div>
        </>
    );
}
