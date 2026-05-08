'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, Download, FileAudio, Loader2, Mic, Save, Square, Wand2 } from 'lucide-react';
import { processReunionIntelligence } from '@/app/actions/meeting-intelligence';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Reunion } from '@/types/fiesta';

type MeetingReunion = Reunion & {
  audioRecording?: { url?: string; durationSeconds?: number };
  resumenCliente?: string;
  resumenOrganizador?: string;
  preguntasCliente?: string[];
  lastIntelligenceSyncAt?: string;
  aiSummary?: {
    transcript?: string;
    tareasCliente?: string[];
    tareasOrganizador?: string[];
    preguntasCliente?: string[];
  };
};

interface MeetingIntelligenceRecorderProps {
  fiestaId: string;
  reunion: MeetingReunion;
  onProcessed: () => void | Promise<void>;
}

function formatSeconds(value?: number) {
  const seconds = Math.max(0, Math.round(value || 0));
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function MeetingIntelligenceRecorder({ fiestaId, reunion, onProcessed }: MeetingIntelligenceRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState(reunion.aiSummary?.transcript || '');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.stop?.();
    };
  }, [audioPreviewUrl]);

  const stopSpeechRecognition = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // Browser speech recognition can throw if already stopped.
    }
    recognitionRef.current = null;
    setLiveTranscript('');
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setWarnings((prev) => Array.from(new Set([...prev, 'Este navegador no transcribe en vivo. El audio se graba igual; podes escribir o pegar las notas antes de procesar.'])));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-UY';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) finalText += ` ${text}`;
          else interimText += ` ${text}`;
        }
        if (finalText.trim()) setTranscript((prev) => `${prev ? `${prev.trim()} ` : ''}${finalText.trim()}`.trim());
        setLiveTranscript(interimText.trim());
      };
      recognition.onerror = () => {
        setWarnings((prev) => Array.from(new Set([...prev, 'La transcripcion en vivo se corto. La grabacion de audio sigue activa.'])));
      };
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch {
            // Some browsers throttle automatic restarts.
          }
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
      setSpeechSupported(true);
    } catch {
      setSpeechSupported(false);
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast({
        title: 'Grabacion no disponible',
        description: 'Este navegador no permite grabar audio desde la app.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setWarnings([]);
      setAudioBlob(null);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus' } : undefined;
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsedSeconds((Date.now() - startedAtRef.current) / 1000), 1000);
      recorder.start(5000);
      setIsRecording(true);
      startSpeechRecognition();
    } catch (error: any) {
      toast({
        title: 'No se pudo iniciar la grabacion',
        description: error?.message || 'Revisa permisos de microfono.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    recorderRef.current?.stop();
    recorderRef.current = null;
    stopSpeechRecognition();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setElapsedSeconds((Date.now() - startedAtRef.current) / 1000);
    setIsRecording(false);
  };

  const processMeeting = async () => {
    if (!audioBlob && transcript.trim().length < 10) {
      toast({
        title: 'Falta contenido',
        description: 'Graba audio o escribi una transcripcion/resumen base antes de procesar.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('reunionId', reunion.id);
      formData.append('transcript', transcript.trim());
      formData.append('durationSeconds', String(Math.round(elapsedSeconds || reunion.audioRecording?.durationSeconds || 0)));
      if (audioBlob) formData.append('audio', audioBlob, `reunion-${reunion.id}.webm`);

      const result = await processReunionIntelligence(formData);
      if (!result.success) throw new Error(result.error || 'No se pudo procesar la reunion.');
      setWarnings(result.warnings || []);
      toast({
        title: 'Acta inteligente generada',
        description: 'Se guardo audio, resumen, tareas y preguntas frecuentes detectadas.',
      });
      await onProcessed();
    } catch (error: any) {
      toast({
        title: 'Error al procesar reunion',
        description: error?.message || 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clientTasks = reunion.aiSummary?.tareasCliente || [];
  const organizerTasks = reunion.aiSummary?.tareasOrganizador || [];
  const learnedFaqs = reunion.preguntasCliente || reunion.aiSummary?.preguntasCliente || [];

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-sm font-bold">
          <span className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            Acta inteligente de reunion
          </span>
          {reunion.lastIntelligenceSyncAt && <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Sincronizada</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isRecording ? 'animate-pulse bg-red-600' : 'bg-slate-300'}`} />
            <span className="text-sm font-bold tabular-nums">{formatSeconds(elapsedSeconds || reunion.audioRecording?.durationSeconds)}</span>
          </div>
          <div className="text-xs text-slate-500">
            {isRecording ? 'Grabando audio y tomando transcripcion en vivo si el navegador lo permite.' : audioBlob || reunion.audioRecording ? 'Audio listo para guardar/procesar.' : 'Inicia la grabacion al comenzar la reunion.'}
          </div>
          <div className="flex flex-wrap justify-start gap-2 md:justify-end">
            {!isRecording ? (
              <Button type="button" size="sm" onClick={startRecording} disabled={isProcessing}>
                <Mic className="mr-2 h-4 w-4" />
                Grabar
              </Button>
            ) : (
              <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                <Square className="mr-2 h-4 w-4" />
                Detener
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={processMeeting} disabled={isProcessing || isRecording}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Procesar
            </Button>
          </div>
        </div>

        {audioPreviewUrl && (
          <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <FileAudio className="h-4 w-4" />
                Audio grabado
              </p>
              <a href={audioPreviewUrl} download={`reunion-${reunion.id}.webm`}>
                <Button type="button" size="sm" variant="ghost">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </a>
            </div>
            <audio controls src={audioPreviewUrl} className="w-full" />
          </div>
        )}

        {reunion.audioRecording?.url && !audioPreviewUrl && (
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Audio guardado en la reunion
            </p>
            <audio controls src={reunion.audioRecording.url} className="w-full" />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Transcripcion / notas de la reunion</p>
            {speechSupported === false && <Badge variant="outline">Transcripcion manual</Badge>}
          </div>
          <Textarea
            value={liveTranscript ? `${transcript}${transcript ? ' ' : ''}${liveTranscript}` : transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={5}
            placeholder="Aca aparece la transcripcion si el navegador la soporta. Tambien podes escribir o pegar las notas de la reunion."
            className="bg-white"
            disabled={isProcessing}
          />
        </div>

        {reunion.resumenCliente && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-sky-700">Resumen para cliente</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{reunion.resumenCliente}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">Resumen para organizador</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{reunion.resumenOrganizador}</p>
            </div>
          </div>
        )}

        {(clientTasks.length > 0 || organizerTasks.length > 0 || learnedFaqs.length > 0) && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">Cliente</p>
              {clientTasks.length ? clientTasks.map((task) => <p key={task} className="mb-1 text-xs text-slate-700">- {task}</p>) : <p className="text-xs text-slate-500">Sin tareas nuevas.</p>}
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-700">Organizador</p>
              {organizerTasks.length ? organizerTasks.map((task) => <p key={task} className="mb-1 text-xs text-slate-700">- {task}</p>) : <p className="text-xs text-slate-500">Sin tareas nuevas.</p>}
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-700">FAQ aprendidas</p>
              {learnedFaqs.length ? learnedFaqs.slice(0, 3).map((faq) => <p key={faq} className="mb-1 text-xs text-slate-700">- {faq}</p>) : <p className="text-xs text-slate-500">Sin preguntas nuevas.</p>}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-800">Avisos</AlertTitle>
            <AlertDescription className="space-y-1 text-xs text-amber-800">
              {warnings.slice(0, 4).map((warning) => <p key={warning}>{warning}</p>)}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Save className="h-3.5 w-3.5" />
          Al procesar, el agente actualiza resumen, tareas, checklist, FAQ del portal y Google/Gmail si esta conectado.
        </div>
      </CardContent>
    </Card>
  );
}
