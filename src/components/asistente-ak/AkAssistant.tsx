
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, X, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { assistant, type AssistantOutput } from '@/app/ai/flows/assistant-flow';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Message {
    id: string;
    text: string | React.ReactNode;
    sender: 'user' | 'bot';
    isTyping?: boolean;
    presupuestoId?: string;
}

export function AkAssistant({ isPage = false }: { isPage?: boolean }) {
    const [isOpen, setIsOpen] = useState(isPage);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isPage && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isPage]);
    
    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

     useEffect(() => {
        const fetchInitialMessage = async () => {
            setIsLoading(true);
            try {
                const initialResponse = await assistant({ query: "Hola" });
                setMessages([{
                    id: `bot-${Date.now()}`,
                    text: initialResponse.response,
                    sender: 'bot'
                }]);
            } catch (error) {
                console.error("Error fetching initial message:", error);
                setMessages([{
                    id: `bot-error-${Date.now()}`,
                    text: "Ocurrió un error al iniciar. Por favor, intenta recargar.",
                    sender: 'bot'
                }]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen && messages.length === 0) {
            fetchInitialMessage();
        }
    }, [isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { id: `user-${Date.now()}`, text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        setMessages(prev => [...prev, { id: 'bot-typing', text: '', sender: 'bot', isTyping: true }]);
        
        try {
            const botResponse: AssistantOutput = await assistant({ query: input });
             setMessages(prev => {
                const newMessages = prev.filter(msg => msg.id !== 'bot-typing');
                return [...newMessages, {
                    id: `bot-${Date.now()}`,
                    text: botResponse.response,
                    sender: 'bot',
                    presupuestoId: botResponse.presupuestoId
                }];
            });

        } catch (error) {
            console.error("Error fetching bot response:", error);
            setMessages(prev => {
                 const newMessages = prev.filter(msg => msg.id !== 'bot-typing');
                return [...newMessages, {
                    id: `bot-error-${Date.now()}`,
                    text: "Lo siento, ocurrió un error al procesar tu solicitud.",
                    sender: 'bot'
                }];
            });
        }
    };

    const containerClasses = isPage 
        ? "relative w-full h-full flex flex-col bg-card border rounded-lg" 
        : "fixed bottom-5 right-5 z-50";

    return (
        <div className={containerClasses}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={isPage ? "w-full h-full flex flex-col" : "w-80 h-[28rem] flex flex-col bg-card rounded-xl shadow-2xl border"}
                    >
                        <header className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://placehold.co/40x40/EF4444/FFFFFF.png?text=AK" alt="AK Assistant"/>
                                    <AvatarFallback>AK</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-sm">Asistente AK</h3>
                            </div>
                            {!isPage && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </header>
                        
                        <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
                             <div className="space-y-4">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-full p-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    messages.map((message, index) => (
                                        <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {message.sender === 'bot' && (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src="https://placehold.co/40x40/EF4444/FFFFFF.png?text=AK" alt="AK Assistant" />
                                                    <AvatarFallback>AK</AvatarFallback>
                                                </Avatar>
                                            )}
                                            {message.isTyping ? (
                                                <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-1.5">
                                                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                                                </div>
                                            ) : (
                                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                                        <ReactMarkdown>{message.text as string}</ReactMarkdown>
                                                    </div>
                                                    {message.presupuestoId && (
                                                        <Button asChild variant="secondary" size="sm" className="mt-2 w-full">
                                                            <Link href={`/presupuestos/${message.presupuestoId}/ver`}>
                                                                Ver Presupuesto Creado <ArrowRight className="w-4 h-4 ml-2"/>
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            {message.sender === 'user' && (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src="https://placehold.co/40x40.png" alt="User"/>
                                                    <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        <form onSubmit={handleSubmit} className="p-3 border-t">
                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escribe tu mensaje..."
                                    className="pr-10"
                                    disabled={isLoading}
                                    autoComplete="off"
                                />
                                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" disabled={!input.trim() || isLoading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
            {!isPage && !isOpen && (
                 <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full w-16 h-16 shadow-lg"
                >
                    <Bot className="h-8 w-8" />
                </Button>
            )}
        </div>
    );
}
