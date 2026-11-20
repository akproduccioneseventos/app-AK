'use client';

import { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Play,
  Eye,
  Flag,
  Trophy,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  DEFAULT_TRIVIA_QUESTIONS,
  type TriviaGame,
  type TriviaQuestion,
} from '@/lib/games/game-engine';
import type { ActiveGameData } from '@/types/fiesta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface CentroTriviaPanelProps {
  fiestaId: string;
  eventName: string;
  initialTrivia?: TriviaGame;
  initialActiveGame?: ActiveGameData;
  initialRanking: { nombre: string; puntos: number }[];
  onGenerarConIa: (fiestaId: string) => Promise<{ success: boolean; trivia?: TriviaGame; error?: string }>;
  onConfirmarTrivia: (
    fiestaId: string,
    preguntas?: TriviaQuestion[],
  ) => Promise<{ success: boolean; trivia?: TriviaGame; error?: string }>;
  onGuardarBorrador: (fiestaId: string, game: TriviaGame) => Promise<boolean>;
  onLanzarPregunta: (
    fiestaId: string,
    game: Omit<ActiveGameData, 'launchedAt'>,
  ) => Promise<{ success: boolean; error?: string }>;
  onRevelarRespuesta: (fiestaId: string) => Promise<{ success: boolean; error?: string }>;
  onTerminarTrivia: (fiestaId: string) => Promise<{ success: boolean; error?: string }>;
}

export function CentroTriviaPanel({
  fiestaId,
  eventName,
  initialTrivia,
  initialActiveGame,
  initialRanking,
  onGenerarConIa,
  onConfirmarTrivia,
  onGuardarBorrador,
  onLanzarPregunta,
  onRevelarRespuesta,
  onTerminarTrivia,
}: CentroTriviaPanelProps) {
  const { toast } = useToast();
  const [trivia, setTrivia] = useState<TriviaGame | undefined>(initialTrivia);
  const [questions, setQuestions] = useState<TriviaQuestion[]>(
    initialTrivia?.questions ?? [],
  );
  const [confirmada, setConfirmada] = useState<boolean>(
    Boolean(initialTrivia?.confirmadaPorEquipo),
  );
  const [activeGame, setActiveGame] = useState<ActiveGameData | undefined>(initialActiveGame);
  const [ranking, setRanking] = useState(initialRanking);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningLive, setRunningLive] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const handleArmarConIa = async () => {
    setLoadingAi(true);
    setFallbackNotice(null);
    try {
      const res = await onGenerarConIa(fiestaId);
      if (res.success && res.trivia && res.trivia.questions.length > 0) {
        setTrivia(res.trivia);
        setQuestions(res.trivia.questions);
        setConfirmada(Boolean(res.trivia.confirmadaPorEquipo));
        setSelectedIndex(0);
        toast({
          title: 'Trivia armada con IA',
          description: 'Revisá las preguntas, editá lo que quieras y confirmalas antes de empezar.',
        });
        return;
      }

      const fallbackQuestions = DEFAULT_TRIVIA_QUESTIONS.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o })),
      }));
      const draft: TriviaGame = {
        id: `trivia_${fiestaId}_${Date.now()}`,
        fiestaId,
        title: `Trivia de la Noche - ${eventName}`,
        questions: fallbackQuestions,
        createdAt: new Date().toISOString(),
        status: 'draft',
        confirmadaPorEquipo: false,
      };
      await onGuardarBorrador(fiestaId, draft).catch(() => false);
      setTrivia(draft);
      setQuestions(fallbackQuestions);
      setConfirmada(false);
      setSelectedIndex(0);
      setFallbackNotice(
        `${res.error || 'La IA no estuvo disponible.'} Cargamos preguntas clásicas de respaldo para que revises y edites.`,
      );
    } catch {
      const fallbackQuestions = DEFAULT_TRIVIA_QUESTIONS.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o })),
      }));
      setQuestions(fallbackQuestions);
      setConfirmada(false);
      setSelectedIndex(0);
      setFallbackNotice(
        'No pudimos conectar con la IA ahora. Cargamos preguntas clásicas de respaldo para que revises y edites.',
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    setConfirmada(false);
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, question: text } : q)));
  };

  const handleOptionTextChange = (qIdx: number, optId: string, text: string) => {
    setConfirmada(false);
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
            }
          : q,
      ),
    );
  };

  const handleCorrectOptionChange = (qIdx: number, optId: string) => {
    setConfirmada(false);
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctOptionId: optId } : q)),
    );
  };

  const handleAddQuestion = () => {
    setConfirmada(false);
    const id = `q_${Date.now()}`;
    setQuestions((prev) => [
      ...prev,
      {
        id,
        question: '¿Nueva pregunta para la fiesta?',
        options: [
          { id: 'a', text: 'Opción A', emoji: '🎉' },
          { id: 'b', text: 'Opción B', emoji: '💃' },
          { id: 'c', text: 'Opción C', emoji: '🎵' },
          { id: 'd', text: 'Opción D', emoji: '🥂' },
        ],
        correctOptionId: 'a',
        timeLimitSeconds: 20,
      },
    ]);
  };

  const handleRemoveQuestion = (qIdx: number) => {
    setConfirmada(false);
    setQuestions((prev) => prev.filter((_, i) => i !== qIdx));
    setSelectedIndex(0);
  };

  const handleConfirmar = async () => {
    if (questions.length === 0) return;
    setSaving(true);
    try {
      const baseGame: TriviaGame = {
        id: trivia?.id || `trivia_${fiestaId}_${Date.now()}`,
        fiestaId,
        title: trivia?.title || `Trivia de la Noche - ${eventName}`,
        questions,
        createdAt: trivia?.createdAt || new Date().toISOString(),
        status: 'draft',
        confirmadaPorEquipo: false,
        participants: trivia?.participants ?? [],
      };
      if (!trivia) {
        await onGuardarBorrador(fiestaId, baseGame);
      }
      const res = await onConfirmarTrivia(fiestaId, questions);
      if (!res.success) {
        throw new Error(res.error || 'No se pudo confirmar la trivia.');
      }
      setTrivia(res.trivia ?? { ...baseGame, confirmadaPorEquipo: true, status: 'active' });
      setConfirmada(true);
      toast({
        title: 'Trivia confirmada por el equipo',
        description: 'Ya podés lanzar preguntas a la pantalla gigante.',
      });
    } catch (e: any) {
      toast({ title: 'Error al confirmar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmpezarPregunta = async (qIdx: number) => {
    const q = questions[qIdx];
    if (!q || !confirmada) return;
    setRunningLive(true);
    try {
      const payload: Omit<ActiveGameData, 'launchedAt'> = {
        type: 'trivia',
        title: q.question,
        subtitle: `Pregunta ${qIdx + 1} de ${questions.length} · ¡Respondé en tu celular!`,
        options: q.options,
        correctOptionId: q.correctOptionId,
      };
      const res = await onLanzarPregunta(fiestaId, payload);
      if (!res.success) throw new Error(res.error || 'No se pudo lanzar la pregunta.');
      setSelectedIndex(qIdx);
      setActiveGame({ ...payload, launchedAt: new Date().toISOString(), respuestaRevelada: false, isFinished: false });
      toast({ title: `Pregunta ${qIdx + 1} en pantalla` });
    } catch (e: any) {
      toast({ title: 'No salió a pantalla', description: e.message, variant: 'destructive' });
    } finally {
      setRunningLive(false);
    }
  };

  const handleRevelar = async () => {
    setRunningLive(true);
    try {
      const res = await onRevelarRespuesta(fiestaId);
      if (!res.success) throw new Error(res.error || 'No se pudo revelar la respuesta.');
      setActiveGame((prev) => (prev ? { ...prev, respuestaRevelada: true } : prev));
      toast({ title: 'Respuesta correcta revelada en pantalla' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setRunningLive(false);
    }
  };

  const handleTerminar = async () => {
    setRunningLive(true);
    try {
      const res = await onTerminarTrivia(fiestaId);
      if (!res.success) throw new Error(res.error || 'No se pudo terminar la trivia.');
      setActiveGame((prev) => (prev ? { ...prev, isFinished: true, respuestaRevelada: true } : prev));
      setRanking(initialRanking);
      toast({ title: 'Trivia terminada · Podio en pantalla' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setRunningLive(false);
    }
  };

  return (
    <section
      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 space-y-4"
      data-testid="centro-trivia-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-violet-300">
            Juego en vivo · Trivia
          </p>
          <h2 className="text-lg font-black tracking-tight text-white md:text-xl">
            Trivia de la fiesta
          </h2>
          <p className="text-xs text-slate-400">
            Armala con IA, revisala antes de jugar y manejá la pantalla desde acá.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              confirmada
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {confirmada ? 'Confirmada por el equipo' : 'Pendiente de revisión'}
          </span>
          <Button
            type="button"
            onClick={handleArmarConIa}
            disabled={loadingAi}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
          >
            {loadingAi ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Armar con IA
          </Button>
        </div>
      </div>

      {fallbackNotice && (
        <div
          role="status"
          className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-200 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
          <span>{fallbackNotice}</span>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-slate-900/50 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-slate-200">Todavía no hay preguntas cargadas</p>
          <p className="text-xs text-slate-400">
            Tocá &quot;Armar con IA&quot; para generar 5 preguntas personalizadas de {eventName}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="rounded-xl border border-white/10 bg-slate-900/70 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Pregunta {qIdx + 1}
                </span>
                <div className="flex items-center gap-2">
                  {confirmada && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={runningLive}
                      onClick={() => handleEmpezarPregunta(qIdx)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Empezar
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                    aria-label={`Quitar pregunta ${qIdx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <Input
                value={q.question}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                className="bg-slate-950 border-white/15 text-white font-bold"
              />

              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const isCorrect = q.correctOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 rounded-lg border p-2 ${
                        isCorrect
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-white/10 bg-slate-950/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCorrectOptionChange(qIdx, opt.id)}
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          isCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                        title="Marcar como respuesta correcta"
                      >
                        {isCorrect ? '✓ Correcta' : opt.id.toUpperCase()}
                      </button>
                      <Input
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(qIdx, opt.id, e.target.value)}
                        className="h-8 bg-transparent border-0 text-xs text-white focus-visible:ring-0 px-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar pregunta
            </Button>

            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={saving || questions.length === 0}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {confirmada ? 'Guardar cambios confirmados' : 'Confirmar preguntas'}
            </Button>
          </div>
        </div>
      )}

      {/* CONTROLES EN VIVO PARA LA PANTALLA GIGANTE */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-300 space-y-0.5">
          <p className="font-bold text-white">
            {activeGame?.type === 'trivia'
              ? activeGame.isFinished
                ? 'Trivia terminada · Mostrando ranking en pantalla'
                : `En vivo: ${activeGame.title}`
              : 'No hay pregunta de trivia activa en pantalla'}
          </p>
          <p className="text-slate-400">
            {confirmada
              ? `Pregunta seleccionada: #${selectedIndex + 1}`
              : 'Confirmá las preguntas arriba para habilitar el juego en vivo.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!confirmada || questions.length === 0 || runningLive}
            onClick={() => handleEmpezarPregunta(selectedIndex)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            <Play className="w-4 h-4 mr-1.5" /> Empezar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={activeGame?.type !== 'trivia' || Boolean(activeGame?.respuestaRevelada) || runningLive}
            onClick={handleRevelar}
            className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
          >
            <Eye className="w-4 h-4 mr-1.5" /> Revelar respuesta
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={activeGame?.type !== 'trivia' || runningLive}
            onClick={handleTerminar}
            variant="destructive"
            className="rounded-xl font-bold"
          >
            <Flag className="w-4 h-4 mr-1.5" /> Terminar
          </Button>
        </div>
      </div>

      {/* RANKING */}
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <Trophy className="w-4 h-4" /> Ranking actual (Top 5)
        </p>
        {ranking.length > 0 ? (
          <ol className="space-y-1 text-xs">
            {ranking.map((item, idx) => (
              <li key={`${item.nombre}-${idx}`} className="flex justify-between text-slate-200 font-semibold">
                <span>
                  {idx + 1}. {item.nombre}
                </span>
                <span className="text-amber-300 font-black">{item.puntos} pts</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-400">Sin respuestas registradas todavía.</p>
        )}
      </div>
    </section>
  );
}
