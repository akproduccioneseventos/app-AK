
'use client';

import { useState, useEffect, useRef, type FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, X, Loader2, ArrowRight, CornerDownLeft, Check, Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assistant, type AssistantOutput } from '@/ai/flows/assistant-flow';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from 'genkit';
import { ScrollArea } from '../ui/scroll-area';
import type { SelectableService, ServiceInfo } from '@/ai/types/assistant-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface ChatMessage extends Message {
  id: string;
  data?: AssistantOutput;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export function AkAssistant({ isPage = false, assistantKey }: { isPage?: boolean, assistantKey?: number }) {
    const [isOpen, setIsOpen] = useState(isPage);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // State for interactive service selection
    const [currentServices, setCurrentServices] = useState<ServiceInfo[]>([]);
    
    // State for service catalog modal
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [catalog, setCatalog] = useState<SelectableService[]>([]);
    const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState<string>('');

    const startConversation = useCallback(() => {
        setIsLoading(true);
        setMessages([]);
        setCurrentServices([]);
        assistant({ query: '' }).then(response => {
            setMessages(prev => [...prev, {
                id: `ai-${Date.now()}`,
                role: 'model',
                content: [{text: response.response}],
                data: response
            }]);
        }).catch(err => {
            setError(err.message);
            toast({ title: "Error del Asistente", description: err.message, variant: "destructive" });
        }).finally(() => {
            setIsLoading(false);
        });
    }, [toast]);
    
    useEffect(() => {
        if(isPage || assistantKey) {
            startConversation();
        }
    }, [isPage, assistantKey, startConversation]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);
    
    useEffect(() => {
        async function fetchCatalog() {
            try {
                const services = await getServiciosEmpresa();
                const selectableServices = services
                    .filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined)
                    .map(s => ({
                        id: s.id,
                        nombre: s.nombre,
                        precioVenta: s.precioVenta,
                        unidad: s.unidad
                    }));
                setCatalog(selectableServices);
            } catch (e) {
                toast({title: "Error", description: "No se pudo cargar el catálogo de servicios."});
            }
        }
        if(isOpen) {
            fetchCatalog();
        }
    }, [isOpen, toast]);

    const handleAddServiceFromCatalog = () => {
        if (!selectedCatalogServiceId) return;
        const service = catalog.find(s => s.id === selectedCatalogServiceId);
        if (!service) return;

        const prompt = `Añade el servicio "${service.nombre}" al presupuesto.`;
        handleSubmit(undefined, prompt);
        setIsCatalogOpen(false);
        setSelectedCatalogServiceId('');
    };

    const handleSubmit = async (e?: FormEvent<HTMLFormElement>, prompt?: string) => {
        if(e) e.preventDefault();
        const userMessage = prompt || input;
        if (!userMessage.trim()) return;

        const newUserMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: [{ text: userMessage }]
        };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);
        setError('');

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await assistant({ 
                query: userMessage, 
                history,
                currentServices: currentServices,
            });
            
            setMessages(prev => [...prev, {
                id: `ai-${Date.now()}`,
                role: 'model',
                content: [{ text: response.response }],
                data: response,
            }]);

            if (response.currentServices) {
                setCurrentServices(response.currentServices);
            }

        } catch (err: any) {
            setError(err.message || "Ocurrió un error.");
            toast({ title: "Error", description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };
    
    const containerClasses = isPage 
        ? "relative w-full h-full flex flex-col bg-card border rounded-lg" 
        : "fixed bottom-5 right-5 z-50";

    const extractOptions = (text: string): string[] => {
      const regex = /Opciones:\s*\[([^\]]+)\]/i;
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      }
      return [];
    };

    const totalPresupuesto = currentServices.reduce((sum, service) => sum + (service.unitPrice * service.quantity), 0);

    return (
        <div className={containerClasses}>
             <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir Servicio al Presupuesto</DialogTitle>
                        <DialogDescription>Selecciona un servicio del catálogo para añadirlo a la cotización actual.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="service-catalog-select">Servicio</Label>
                        <Select value={selectedCatalogServiceId} onValueChange={setSelectedCatalogServiceId}>
                            <SelectTrigger id="service-catalog-select"><SelectValue placeholder="Seleccionar servicio..."/></SelectTrigger>
                            <SelectContent><ScrollArea className="h-64">
                                {catalog.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} - {formatCurrency(s.precioVenta)}</SelectItem>)}
                            </ScrollArea></SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                        <Button onClick={handleAddServiceFromCatalog} disabled={!selectedCatalogServiceId}>Añadir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={isPage ? "w-full h-full flex flex-col" : "w-96 h-[32rem] flex flex-col bg-card rounded-xl shadow-2xl border"}
                    >
                        <header className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/40x40/EF4444/FFFFFF.png?text=AK" alt="AK Assistant"/><AvatarFallback>AK</AvatarFallback></Avatar>
                                <h3 className="font-semibold text-sm">Asistente AK</h3>
                            </div>
                            {!isPage && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>}
                        </header>
                        
                        <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <div className="p-4 space-y-4">
                                {messages.map((message) => {
                                    const isModel = message.role === 'model';
                                    const messageContent = message.content[0].text;
                                    const presupuestoId = message.data?.presupuestoId;
                                    const suggestedReplies = extractOptions(messageContent);
                                    const selectableServices = message.data?.selectableServices;
                                    
                                    const cleanMessageContent = messageContent.replace(/Opciones:\s*\[[^\]]+\]/, '').trim();

                                    return (
                                        <div key={message.id} className={`flex items-start gap-3 ${isModel ? '' : 'justify-end'}`}>
                                            {isModel && <Avatar className="h-6 w-6"><AvatarFallback>AK</AvatarFallback></Avatar>}
                                            <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${isModel ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{cleanMessageContent}</ReactMarkdown>
                                                 {presupuestoId && (
                                                    <Button asChild variant="secondary" size="sm" className="mt-2">
                                                        <Link href={`/presupuestos/${presupuestoId}/ver`}>Ver Presupuesto <ArrowRight className="w-4 h-4 ml-2"/></Link>
                                                    </Button>
                                                )}
                                                {isModel && suggestedReplies.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {suggestedReplies.map((reply, i) => (
                                                            <Button key={i} size="sm" variant="outline" onClick={() => handleSubmit(undefined, reply)}>{reply}</Button>
                                                        ))}
                                                    </div>
                                                )}
                                                {isModel && selectableServices && selectableServices.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {selectableServices.map((service) => (
                                                            <Button key={service.id} size="sm" variant="outline" onClick={() => handleSubmit(undefined, `Añade el servicio "${service.nombre}"`)}>{service.nombre}</Button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {!isModel && <Avatar className="h-6 w-6"><AvatarFallback><User className="h-4 w-4"/></AvatarFallback></Avatar>}
                                        </div>
                                    );
                                })}
                                {isLoading && (
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-6 w-6"><AvatarFallback>AK</AvatarFallback></Avatar>
                                        <div className="max-w-xs rounded-lg px-3 py-2 text-sm bg-muted flex items-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary"/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        
                        <footer className="p-3 border-t">
                            {currentServices.length > 0 && (
                                <div className="p-2 mb-2 border rounded-md text-sm bg-background">
                                    <h4 className="font-semibold text-xs text-muted-foreground mb-1">Presupuesto Actual:</h4>
                                    <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                                        {currentServices.map(s => <li key={s.id} className="flex justify-between items-center text-xs"><span>{s.quantity}x {s.name}</span> <span>{formatCurrency(s.unitPrice * s.quantity)}</span></li>)}
                                    </ul>
                                    <div className="flex justify-between font-bold border-t mt-1 pt-1">
                                        <span>Total:</span>
                                        <span>{formatCurrency(totalPresupuesto)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <Button size="sm" variant="outline" className="flex-grow" onClick={() => setIsCatalogOpen(true)}>
                                    <PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio
                                </Button>
                            </div>
                             <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu mensaje..." className="flex-1" disabled={isLoading} />
                                <Button type="submit" disabled={isLoading || !input.trim()}><CornerDownLeft className="h-4 w-4" /></Button>
                            </form>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
            {!isPage && !isOpen && (
                 <Button onClick={() => setIsOpen(true)} className="rounded-full w-16 h-16 shadow-lg">
                    <Bot className="h-8 w-8" />
                </Button>
            )}
        </div>
    );
}
