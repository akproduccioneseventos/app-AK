'use client';

import React, { useState } from 'react';
import { PhotoMission, DEFAULT_PHOTO_MISSIONS, getSecretMissionForGuest } from '@/lib/games/game-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface Props {
  fiestaId: string;
  guestName: string;
}

export default function PhotoMissionScreen({ fiestaId, guestName }: Props) {
  const [missions] = useState<PhotoMission[]>(DEFAULT_PHOTO_MISSIONS);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());

  const handleComplete = (id: string) => {
    // Aquí se abriría la cámara en una implementación real
    setCompletedMissions(prev => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">Misiones Fotográficas</h1>
        <p className="text-slate-400 text-center mb-8">Completá las misiones para ganar puntos</p>

        <div className="mb-8 p-1 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 animate-pulse">
          <Card className="bg-slate-900 border-none relative overflow-hidden h-full rounded-lg">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="bg-slate-800/80 p-4 rounded-full shadow-inner border border-slate-700">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
                  Top Secret
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-white">Tu Misión Secreta</h3>
                <p className="text-slate-300 text-lg">
                  {getSecretMissionForGuest(guestName)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map(mission => {
            const isCompleted = completedMissions.has(mission.id);

            return (
              <Card key={mission.id} className={`bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden relative ${isCompleted ? 'opacity-70' : ''}`}>
                {isCompleted && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="bg-emerald-500 rounded-full p-2">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="text-4xl mb-4 text-center">{mission.emoji}</div>
                  <h3 className="text-xl font-bold mb-2 text-white">{mission.title}</h3>
                  <p className="text-slate-300 flex-1">{mission.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{mission.points} pts</span>
                    <Button
                      onClick={() => handleComplete(mission.id)}
                      disabled={isCompleted}
                      variant={isCompleted ? "secondary" : "default"}
                    >
                      {isCompleted ? 'Completada' : 'Completar Misión'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
