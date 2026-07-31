'use client';

import React from 'react';
import { TriviaParticipant } from '@/lib/games/game-engine';

interface Props {
  participants: TriviaParticipant[];
}

export default function LeaderboardDisplay({ participants }: Props) {
  const top3 = participants.slice(0, 3);
  const others = participants.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8 overflow-hidden">
      <h1 className="text-5xl md:text-7xl font-black text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
        Tabla de Posiciones
      </h1>

      <div className="flex flex-col md:flex-row justify-center items-end gap-8 mb-16 h-64">
        {top3.length > 1 && (
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold mb-2">{top3[1].guestName}</div>
            <div className="text-xl text-slate-300 mb-4">{top3[1].score} pts</div>
            <div className="w-32 h-40 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-lg flex items-start justify-center pt-4">
              <span className="text-4xl font-bold text-slate-800">2</span>
            </div>
          </div>
        )}

        {top3.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold mb-2 text-amber-300">{top3[0].guestName}</div>
            <div className="text-2xl text-amber-200 mb-4">{top3[0].score} pts</div>
            <div className="w-40 h-56 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg flex items-start justify-center pt-4 shadow-2xl shadow-yellow-500/50">
              <span className="text-6xl font-bold text-yellow-900">1</span>
            </div>
          </div>
        )}

        {top3.length > 2 && (
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold mb-2">{top3[2].guestName}</div>
            <div className="text-xl text-slate-300 mb-4">{top3[2].score} pts</div>
            <div className="w-32 h-32 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-start justify-center pt-4">
              <span className="text-4xl font-bold text-amber-900">3</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 border-b border-slate-700 pb-2">Más Participantes</h2>
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {others.map((p, i) => (
            <div key={p.guestId} className="flex justify-between items-center bg-slate-800/80 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-bold w-6">{i + 4}.</span>
                <span className="text-lg font-medium">{p.guestName}</span>
              </div>
              <span className="font-bold text-emerald-400">{p.score} pts</span>
            </div>
          ))}
          {others.length === 0 && (
            <div className="text-center text-slate-400 py-4">No hay más participantes</div>
          )}
        </div>
      </div>
    </div>
  );
}
