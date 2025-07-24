
'use client';

import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { assistant } from '@/ai/flows/assistant-flow';
import Markdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function AsistenteAkPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

   useEffect(() => {
        // Scroll to the bottom whenever messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

  useEffect(() => {
    // Initial greeting from the assistant
    setMessages([
      { role: 'assistant', content: '¡Hola! Soy tu asistente de eventos. Puedes pedirme que cree un presupuesto por ti. Por ejemplo: "Crea un presupuesto para una boda de 100 personas el 20 de Diciembre de 2025".' }
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = input;
    setInput('');
    setIsLoading(true);
    
    try {
      const result = await assistant({ query: currentQuery });
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Lo siento, ocurrió un error: ${err.message}` }]);
      toast({ title: "Error del Asistente", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
        <CardHeader className="text-center">
          <Bot className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-3xl">Asistente AK</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Tu copiloto de planificación de eventos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0">
            <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && <Bot className="w-8 h-8 text-primary flex-shrink-0 mt-1"/>}
                            <div className={`p-3 rounded-lg max-w-sm prose prose-sm dark:prose-invert ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                               <Markdown>{msg.content}</Markdown>
                            </div>
                            {msg.role === 'user' && <User className="w-8 h-8 text-muted-foreground flex-shrink-0 mt-1"/>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start items-center gap-2">
                            <Bot className="w-8 h-8 text-primary flex-shrink-0"/>
                            <Loader2 className="w-5 h-5 animate-spin"/>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t mt-4">
                <Textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ej: Crea un presupuesto para una boda..."
                    rows={1}
                    className="resize-none flex-grow"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}><Send className="w-5 h-5"/></Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
