
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Esta página actuará como un wrapper o un punto de entrada para el Asistente AK de cliente
// que podría ser un chatbot más avanzado en el futuro.

export default function AsistenteAkPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de eventos. ¿Cómo puedo ayudarte a planificar tu día perfecto? Puedes pedirme que te cree un presupuesto.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim()) return;

    // TODO: Conectar con el flow del asistente de IA
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    // Simular respuesta de IA
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: `He entendido tu petición sobre: "${input}". La función de creación de presupuestos por chat está en desarrollo. Mientras tanto, puedes usar el Armado Rápido.` }]);
      setIsLoading(false);
    }, 1500);

    setInput('');
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <Bot className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-3xl">Asistente AK</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Tu copiloto de planificación de eventos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="h-64 border rounded-md p-4 space-y-3 overflow-y-auto bg-background">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-1"/>}
                        <div className={`p-2 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                           <p className="text-sm">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1"/>}
                    </div>
                ))}
                 {isLoading && <div className="flex justify-start"><Bot className="w-5 h-5 text-primary flex-shrink-0 mr-2"/><Loader2 className="w-5 h-5 animate-spin"/></div>}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ej: Crea un presupuesto para una boda de 150 personas..."
                    rows={1}
                    className="resize-none"
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}><Send className="w-5 h-5"/></Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
