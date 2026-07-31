'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TriviaQuestion, PhotoMission, DEFAULT_TRIVIA_QUESTIONS, DEFAULT_PHOTO_MISSIONS } from '@/lib/games/game-engine';

interface Props {
  fiestaId: string;
}

export default function TriviaAdminPanel({ fiestaId }: Props) {
  const [questions, setQuestions] = useState<TriviaQuestion[]>(DEFAULT_TRIVIA_QUESTIONS);
  const [missions, setMissions] = useState<PhotoMission[]>(DEFAULT_PHOTO_MISSIONS);
  const [status, setStatus] = useState<'draft' | 'active' | 'finished'>('draft');

  const handleSaveTrivia = () => {
    alert('Trivia guardada correctamente');
  };

  const handleSaveMissions = () => {
    alert('Misiones guardadas correctamente');
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Juegos en Vivo</h1>
        <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-lg py-1 px-4">
          {status.toUpperCase()}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuración de Trivia</CardTitle>
          <Button onClick={handleSaveTrivia}>Guardar Trivia</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="p-4 border rounded-lg bg-slate-50 space-y-4">
              <div className="flex gap-4">
                <Input 
                  value={q.question} 
                  onChange={(e) => {
                    const newQ = [...questions];
                    newQ[qIndex].question = e.target.value;
                    setQuestions(newQ);
                  }}
                  placeholder="Pregunta"
                  className="font-semibold text-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, optIndex) => (
                  <div key={opt.id} className="flex gap-2">
                    <Input 
                      value={opt.emoji || ''} 
                      onChange={(e) => {
                        const newQ = [...questions];
                        newQ[qIndex].options[optIndex].emoji = e.target.value;
                        setQuestions(newQ);
                      }}
                      className="w-16"
                      placeholder="Emoji"
                    />
                    <Input 
                      value={opt.text} 
                      onChange={(e) => {
                        const newQ = [...questions];
                        newQ[qIndex].options[optIndex].text = e.target.value;
                        setQuestions(newQ);
                      }}
                      placeholder={`Opción ${optIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Opción Correcta</label>
                <Select 
                  value={q.correctOptionId} 
                  onValueChange={(val) => {
                    const newQ = [...questions];
                    newQ[qIndex].correctOptionId = val;
                    setQuestions(newQ);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.text}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full">Agregar Pregunta</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Misiones Fotográficas</CardTitle>
          <Button onClick={handleSaveMissions}>Guardar Misiones</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {missions.map((m, mIndex) => (
            <div key={m.id} className="p-4 border rounded-lg bg-slate-50 flex gap-4">
              <Input 
                value={m.emoji} 
                className="w-16 text-center text-xl"
                onChange={(e) => {
                  const newM = [...missions];
                  newM[mIndex].emoji = e.target.value;
                  setMissions(newM);
                }}
              />
              <div className="flex-1 space-y-2">
                <Input 
                  value={m.title} 
                  placeholder="Título de la misión"
                  className="font-semibold"
                  onChange={(e) => {
                    const newM = [...missions];
                    newM[mIndex].title = e.target.value;
                    setMissions(newM);
                  }}
                />
                <Input 
                  value={m.description} 
                  placeholder="Descripción"
                  onChange={(e) => {
                    const newM = [...missions];
                    newM[mIndex].description = e.target.value;
                    setMissions(newM);
                  }}
                />
              </div>
              <div className="w-24">
                <Input 
                  type="number" 
                  value={m.points} 
                  placeholder="Pts"
                  onChange={(e) => {
                    const newM = [...missions];
                    newM[mIndex].points = Number(e.target.value);
                    setMissions(newM);
                  }}
                />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full">Agregar Misión</Button>
        </CardContent>
      </Card>
    </div>
  );
}
