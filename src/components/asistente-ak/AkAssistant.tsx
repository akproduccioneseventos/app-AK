
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Loader2, Send, Wand2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { assistant, type AssistantOutput } from '@/ai/flows/assistant-flow';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export function AkAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await assistant({ query: input });
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: result.response,
        imageUrl: result.imageUrl,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      toast({
        title: "Error de Asistente de IA",
        description: err.message || "No se pudo obtener una respuesta. Inténtalo de nuevo.",
        variant: "destructive",
      });
      // Optionally add an error message to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: "Lo siento, tuve un problema para procesar tu solicitud." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-2xl flex flex-col h-[calc(100vh-220px)] border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-headline text-2xl">
          <Wand2 className="text-primary w-8 h-8" /> Asistente de Marketing AK
        </CardTitle>
        <CardDescription>
          Tu experto en marketing para AK Producciones. Pide ideas, textos para redes sociales, o la creación de imágenes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6" ref={scrollViewportRef}>
            <Alert>
                <Bot className="h-4 w-4" />
                <AlertTitle>¡Hola! Soy tu asistente de marketing.</AlertTitle>
                <AlertDescription>
                    Tengo conocimiento de tus servicios, menús y paquetes. Puedes pedirme ideas como:
                    <ul className="list-disc pl-5 mt-2 text-xs">
                        <li>"Crea un post para Instagram promocionando el Paquete Premium."</li>
                        <li>"Dame 3 ideas para hacerme viral en TikTok mostrando nuestro servicio de catering."</li>
                        <li>"Genera una imagen de una boda elegante en un salón de fiestas."</li>
                    </ul>
                </AlertDescription>
            </Alert>

            {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
                <div className={`rounded-lg px-4 py-2 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.imageUrl && (
                    <div className="mt-2">
                      <NextImage src={message.imageUrl} alt="Imagen generada por IA" width={400} height={400} className="rounded-md border"/>
                    </div>
                  )}
                </div>
                {message.role === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0" />}
            </div>
            ))}
            {isLoading && (
            <div className="flex items-start gap-3 justify-start">
                <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="rounded-lg px-4 py-2 max-w-sm bg-muted flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin"/>
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
            </div>
            )}
        </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
        <Input
            id="message"
            placeholder="Pídele algo a tu asistente de marketing..."
            className="flex-1"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar mensaje</span>
        </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
