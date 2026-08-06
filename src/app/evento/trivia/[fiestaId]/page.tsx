'use client';

import React, { useState, useEffect } from 'react';
import TriviaGameScreen from '@/components/games/TriviaGameScreen';
import { getTriviaGame } from '@/app/actions/games.actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2 } from 'lucide-react';

export default function TriviaPublicPage({ params }: { params: { fiestaId: string } }) {
  const [guestName, setGuestName] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrivia, setHasTrivia] = useState(false);

  useEffect(() => {
    // Polling for trivia status
    const checkTrivia = async () => {
      try {
        const game = await getTriviaGame(params.fiestaId);
        setHasTrivia(!!game && game.questions.length > 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    checkTrivia();
    const interval = setInterval(checkTrivia, 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, [params.fiestaId]);

  if (isLoading && !hasTrivia) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!hasTrivia) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <Wand2 className="w-16 h-16 text-slate-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Esperando Trivia...</h1>
        <p className="text-slate-400">La trivia aún no ha comenzado o ya ha finalizado. Esperá a que el animador la lance en pantalla.</p>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Unite a la Trivia</h1>
            <form onSubmit={(e) => { e.preventDefault(); if (guestName.trim()) setIsJoined(true); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Tu Nombre</label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ej: Martín S."
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">Jugar Ahora</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <TriviaGameScreen fiestaId={params.fiestaId} guestName={guestName} />;
}
