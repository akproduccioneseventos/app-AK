'use client';

import React, { useState, useEffect } from 'react';
import { PhotoMission, DEFAULT_PHOTO_MISSIONS, getSecretMissionForGuest } from '@/lib/games/game-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Camera, CheckCircle2 } from 'lucide-react';

interface Props {
  fiestaId: string;
  guestName: string;
  onLaunchUpload?: (captionPrefix: string) => void;
}

export default function PhotoMissionScreen({ fiestaId, guestName, onLaunchUpload }: Props) {
  const [missions] = useState<PhotoMission[]>(DEFAULT_PHOTO_MISSIONS);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ak_completed_missions_${fiestaId}`);
      if (saved) {
        setCompletedMissions(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
  }, [fiestaId]);

  const handleStartMission = (missionId: string, title: string) => {
    if (onLaunchUpload) {
      onLaunchUpload(`⭐ Misión cumplida: ${title}`);
    }
    const next = new Set(completedMissions).add(missionId);
    setCompletedMissions(next);
    localStorage.setItem(`ak_completed_missions_${fiestaId}`, JSON.stringify([...next]));
  };

  const secretMission = getSecretMissionForGuest(guestName);
  const isSecretCompleted = completedMissions.has('secret_mission');

  return (
    <div className="min-h-[70vh] bg-slate-950 text-white p-4 md:p-6 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Desafío de la Noche
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Misiones Fotográficas</h1>
          <p className="text-slate-400 text-sm mt-1">Cumplí las misiones para que salgan destacadas en la pantalla grande</p>
        </div>

        {/* Misión Secreta VIP */}
        <div className="mb-6 p-0.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-lg shadow-amber-500/10">
          <Card className="bg-slate-900 border-none relative overflow-hidden rounded-[14px]">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-amber-400/20 text-amber-300 p-4 rounded-2xl border border-amber-400/30 shrink-0">
                <Lock className="w-7 h-7" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-block bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 border border-amber-400/30">
                  Solo Para Vos
                </div>
                <h3 className="text-lg font-black text-white">Tu Misión Secreta</h3>
                <p className="text-slate-200 text-base font-semibold mt-0.5">
                  {secretMission}
                </p>
              </div>
              <Button
                onClick={() => handleStartMission('secret_mission', secretMission)}
                className={`shrink-0 font-bold ${
                  isSecretCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md font-black'
                }`}
              >
                {isSecretCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Cumplida
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-1.5" /> Subir Foto
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Grid de misiones grupales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map((mission) => {
            const isCompleted = completedMissions.has(mission.id);

            return (
              <Card
                key={mission.id}
                className={`bg-slate-900 border-slate-800 transition-all ${
                  isCompleted ? 'opacity-70 border-emerald-500/40 bg-emerald-950/20' : 'hover:border-slate-700'
                }`}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-800/80 inline-block">{mission.emoji}</span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        {mission.points} pts
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{mission.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mission.description}</p>
                  </div>

                  <Button
                    onClick={() => handleStartMission(mission.id, mission.title)}
                    variant={isCompleted ? 'secondary' : 'default'}
                    size="sm"
                    className={`w-full font-bold h-10 rounded-xl ${
                      isCompleted
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40'
                        : 'bg-white text-slate-950 hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> Completada
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-1.5 text-slate-700" /> Sacar Foto
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
