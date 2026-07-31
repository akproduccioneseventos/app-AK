'use client';

import React, { useState, useEffect } from 'react';
import { TriviaQuestion, DEFAULT_TRIVIA_QUESTIONS } from '@/lib/games/game-engine';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  fiestaId: string;
  guestName: string;
}

export default function TriviaGameScreen({ fiestaId, guestName }: Props) {
  const [questions] = useState<TriviaQuestion[]>(DEFAULT_TRIVIA_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (isFinished || selectedAnswer !== null) return;
    if (timeLeft <= 0) {
      handleAnswer('timeout');
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, selectedAnswer]);

  const handleAnswer = (answerId: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerId);

    const question = questions[currentIndex];
    if (answerId === question.correctOptionId) {
      setScore(prev => prev + 100);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(questions[currentIndex + 1].timeLimitSeconds || 15);
        setSelectedAnswer(null);
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">¡Juego Terminado!</h1>
        <p className="text-xl mb-2">{guestName}, tu puntaje final es:</p>
        <div className="text-6xl font-black text-amber-400 mb-8">{score}</div>
        <Button onClick={() => window.location.reload()} size="lg">Volver al inicio</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = (timeLeft / (currentQuestion.timeLimitSeconds || 15)) * 100;
  const isLowTime = timeLeft <= 5;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-bold">Pregunta {currentIndex + 1}/{questions.length}</div>
        <div className="text-lg font-bold">Puntos: {score}</div>
      </div>
      
      <div className="w-full bg-slate-700 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 linear ${isLowTime ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
          {currentQuestion.question}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map(option => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentQuestion.correctOptionId;
            let bgColor = 'bg-slate-800 hover:bg-slate-700';
            
            if (selectedAnswer !== null) {
              if (isCorrect) bgColor = 'bg-emerald-500';
              else if (isSelected && !isCorrect) bgColor = 'bg-rose-500';
              else bgColor = 'bg-slate-800 opacity-50';
            }

            return (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                disabled={selectedAnswer !== null}
                className={`p-6 rounded-xl text-xl md:text-2xl font-semibold transition-all flex items-center justify-center gap-4 ${bgColor}`}
              >
                {option.emoji && <span>{option.emoji}</span>}
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
