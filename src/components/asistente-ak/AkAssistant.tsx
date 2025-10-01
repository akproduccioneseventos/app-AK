
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Loader2, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { assistant } from '@/ai/flows/assistant-flow';


interface Message {
  role: 'user' | 'assistant';
  content: string;
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
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await assistant({ query: input });
      const assistantMessage: Message = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      toast({
        title: "Error de Asistente",
        description: err.message || "No se pudo obtener una respuesta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Bot className="text-primary" /> Asistente AK
        </CardTitle>
        <CardDescription>Tu asistente de IA para ayudarte con la planificación.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4" viewportRef={scrollViewportRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
                <div className={`rounded-lg px-4 py-2 max-w-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm">{message.content}</p>
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
            placeholder="Pídele a la IA que cree algo o te ayude..."
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
