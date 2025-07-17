
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


type Message = {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
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
                content: "¡Hola! Soy Asistente AK. Puedes pedirme que analice tu evento actual, revise el código de la aplicación y mucho más. ¿En qué te puedo ayudar?",
            }]);
        }
    }, [isOpen, messages.length]);

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
            const result = await assistant({ query: currentQuery });
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
