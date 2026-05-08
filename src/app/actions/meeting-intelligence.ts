'use server';

import { analyzeMeetingTranscript, type MeetingIntelligenceOutput } from '@/ai/flows/meeting-intelligence-flow';
import { uploadToStorage } from '@/lib/firebase/storage';
import type { FaqItem, FiestaEnPlanificacion, Reunion, Tarea } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta/fiesta.actions';
import { syncReunionToGoogleWorkspace } from './google-workspace-extended';

const MAX_AUDIO_UPLOAD_BYTES = 45 * 1024 * 1024;
const MAX_AUDIO_AI_BYTES = 12 * 1024 * 1024;

type MeetingReunion = Reunion & {
  audioRecording?: {
    url?: string;
    path?: string;
    fileName?: string;
    contentType?: string;
    size?: number;
    durationSeconds?: number;
    recordedAt: string;
  };
  resumenCliente?: string;
  resumenOrganizador?: string;
  preguntasCliente?: string[];
  lastIntelligenceSyncAt?: string;
  updatedAt?: string;
  aiSummary?: {
    generatedAt: string;
    transcript: string;
    resumenCliente: string;
    resumenOrganizador: string;
    acuerdos: string[];
    decisionesCliente: string[];
    tareasCliente: string[];
    tareasOrganizador: string[];
    preguntasCliente: string[];
    checklistCompletadoIds: string[];
    camposSincronizados: string[];
    alertas: string[];
  };
};

type MeetingTask = Tarea & {
  sourceMeetingId?: string;
  sourceMeetingTitle?: string;
  autoDetected?: boolean;
};

type LearnedFaq = FaqItem & {
  learnedFromMeetingId?: string;
  learnedFromMeetingTitle?: string;
  updatedAt?: string;
};

function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function safeId(prefix: string, value: string): string {
  const base = normalizeKey(value).replace(/\s+/g, '-').slice(0, 48);
  return `${prefix}-${base || Date.now().toString(36)}`;
}

function buildEventContext(fiesta: FiestaEnPlanificacion): string {
  const config = fiesta.configuracion;
  return [
    `Cliente/evento: ${config?.nombreEvento || config?.clienteNombre || 'sin nombre'}`,
    config?.tipoCelebracion ? `Tipo: ${config.tipoCelebracion}` : '',
    config?.fechaEvento ? `Fecha: ${config.fechaEvento}` : '',
    config?.invitadosEstimados ? `Invitados: ${config.invitadosEstimados}` : '',
    config?.nombreLugar ? `Salon: ${config.nombreLugar}` : '',
    fiesta.estado ? `Estado: ${fiesta.estado}` : '',
  ].filter(Boolean).join('\n');
}

function fallbackMeetingAnalysis(transcript: string): MeetingIntelligenceOutput {
  const text = cleanText(transcript);
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanText)
    .filter(Boolean);

  const acuerdos = sentences
    .filter((sentence) => /(queda|acord|confirm|cliente|vamos|debe|hay que|se define|se elig)/i.test(sentence))
    .slice(0, 6);
  const preguntas = sentences
    .filter((sentence) => sentence.includes('?') || /pregunt|consulta|duda|puede|cuanto|cuando|donde|como/i.test(sentence))
    .slice(0, 6);
  const tareas = sentences
    .filter((sentence) => /(pendiente|enviar|confirmar|coordinar|revisar|hacer|mandar|llamar|agendar)/i.test(sentence))
    .slice(0, 8);
  const resumen = text
    ? `Se registraron los puntos principales de la reunion: ${sentences.slice(0, 4).join(' ')}`
    : 'La reunion quedo registrada, pero falta transcripcion para generar un resumen completo.';

  return {
    resumenCliente: resumen,
    resumenOrganizador: resumen,
    acuerdos: acuerdos.length ? acuerdos : ['Revisar la reunion y confirmar acuerdos finales con el cliente.'],
    decisionesCliente: acuerdos.slice(0, 4),
    tareasCliente: tareas.slice(0, 4),
    tareasOrganizador: tareas.slice(4, 8).length ? tareas.slice(4, 8) : tareas.slice(0, 4),
    preguntasCliente: preguntas,
    checklistCompletadoIds: [],
    camposSincronizados: [],
    alertas: text ? [] : ['No hubo transcripcion suficiente para analizar automaticamente todo el contenido.'],
  };
}

async function uploadAudioIfPresent(params: {
  file: File | null;
  fiestaId: string;
  reunionId: string;
  durationSeconds: number;
  now: string;
}) {
  const { file, fiestaId, reunionId, durationSeconds, now } = params;
  if (!file || file.size === 0) return { recording: undefined, audioDataUri: undefined, warning: undefined };

  if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
    return {
      recording: undefined,
      audioDataUri: undefined,
      warning: 'El audio supera el tamano maximo de guardado. La reunion se proceso con la transcripcion disponible.',
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || 'audio/webm';
  const extension = contentType.includes('mp4') ? 'm4a' : contentType.includes('mpeg') ? 'mp3' : 'webm';
  const fileName = `${Date.now()}-${reunionId}.${extension}`;
  const storagePath = `reuniones-audio/${fiestaId}/${reunionId}/${fileName}`;
  const audioDataUri = file.size <= MAX_AUDIO_AI_BYTES ? `data:${contentType};base64,${buffer.toString('base64')}` : undefined;

  try {
    const url = await uploadToStorage(buffer, storagePath, contentType);
    return {
      audioDataUri,
      recording: {
        url,
        path: storagePath,
        fileName,
        contentType,
        size: file.size,
        durationSeconds,
        recordedAt: now,
      },
      warning: file.size > MAX_AUDIO_AI_BYTES
        ? 'El audio quedo guardado, pero por tamano se analizo con la transcripcion escrita.'
        : undefined,
    };
  } catch (error) {
    console.error('Error uploading meeting audio:', error);
    return {
      audioDataUri,
      recording: undefined,
      warning: 'No se pudo guardar el audio en Storage. Igual se proceso la reunion con la transcripcion disponible.',
    };
  }
}

function normalizeAnalysis(analysis: MeetingIntelligenceOutput): MeetingIntelligenceOutput {
  return {
    resumenCliente: cleanText(analysis.resumenCliente),
    resumenOrganizador: cleanText(analysis.resumenOrganizador),
    acuerdos: (analysis.acuerdos || []).map(cleanText).filter(Boolean),
    decisionesCliente: (analysis.decisionesCliente || []).map(cleanText).filter(Boolean),
    tareasCliente: (analysis.tareasCliente || []).map(cleanText).filter(Boolean),
    tareasOrganizador: (analysis.tareasOrganizador || []).map(cleanText).filter(Boolean),
    preguntasCliente: (analysis.preguntasCliente || []).map(cleanText).filter(Boolean),
    checklistCompletadoIds: (analysis.checklistCompletadoIds || []).map(cleanText).filter(Boolean),
    camposSincronizados: (analysis.camposSincronizados || []).map(cleanText).filter(Boolean),
    alertas: (analysis.alertas || []).map(cleanText).filter(Boolean),
  };
}

function completeChecklist(reunion: MeetingReunion, completedIds: string[]): MeetingReunion {
  if (!Array.isArray(reunion.checklist) || completedIds.length === 0) return reunion;
  const completedSet = new Set(completedIds);
  return {
    ...reunion,
    checklist: reunion.checklist.map((item) => completedSet.has(item.id) ? { ...item, completed: true } : item),
  };
}

function buildDetectedTasks(params: {
  fiesta: FiestaEnPlanificacion;
  reunion: MeetingReunion;
  tasks: string[];
  owner: 'cliente' | 'organizacion';
}): MeetingTask[] {
  return params.tasks.map(cleanText).filter(Boolean).map((task) => ({
    id: safeId(`reunion-${params.owner}-${params.reunion.id}`, task),
    texto: task,
    descripcion: `Detectada automaticamente desde la reunion "${params.reunion.titulo}".`,
    completada: false,
    fechaLimite: params.reunion.fecha || params.fiesta.configuracion?.fechaEvento || undefined,
    asignadaA: params.owner === 'cliente' ? 'Cliente' : 'Organizador',
    sourceMeetingId: params.reunion.id,
    sourceMeetingTitle: params.reunion.titulo,
    autoDetected: true,
  }));
}

function mergeTasks(existing: Tarea[] | undefined, detected: MeetingTask[]): Tarea[] {
  const merged = Array.isArray(existing) ? [...existing] : [];
  const keys = new Set(merged.map((task) => normalizeKey(task.texto)));
  for (const task of detected) {
    const key = normalizeKey(task.texto);
    if (!keys.has(key)) {
      merged.push(task);
      keys.add(key);
    }
  }
  return merged;
}

function buildLearningFaqs(reunion: MeetingReunion, questions: string[], now: string): LearnedFaq[] {
  return questions.map(cleanText).filter((question) => question.length > 8).map((question) => ({
    id: safeId(`faq-${reunion.id}`, question),
    pregunta: question.endsWith('?') ? question : `${question}?`,
    respuesta: 'Esta pregunta surgio en una reunion real. Revisar y completar la respuesta para que quede disponible en futuras reuniones y en el portal del cliente.',
    learnedFromMeetingId: reunion.id,
    learnedFromMeetingTitle: reunion.titulo,
    updatedAt: now,
  }));
}

function mergeFaqs(existing: FaqItem[] | undefined, learned: LearnedFaq[]): FaqItem[] {
  const merged = Array.isArray(existing) ? [...existing] : [];
  const keys = new Set(merged.map((item) => normalizeKey(item.pregunta)));
  for (const item of learned) {
    const key = normalizeKey(item.pregunta);
    if (!keys.has(key)) {
      merged.push(item);
      keys.add(key);
    }
  }
  return merged;
}

export async function processReunionIntelligence(formData: FormData) {
  try {
    const fiestaId = cleanText(formData.get('fiestaId'));
    const reunionId = cleanText(formData.get('reunionId'));
    const transcript = cleanText(formData.get('transcript'));
    const durationSeconds = Number(formData.get('durationSeconds') || 0);
    const audio = formData.get('audio');
    const audioFile = typeof File !== 'undefined' && audio instanceof File && audio.size > 0 ? audio : null;

    if (!fiestaId || !reunionId) return { success: false, error: 'Falta identificar la fiesta o la reunion.' };
    if (!transcript && !audioFile) return { success: false, error: 'Graba audio o escribe notas antes de procesar la reunion.' };

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'No se encontro la fiesta.' };

    const reuniones = Array.isArray(fiesta.reuniones) ? (fiesta.reuniones as MeetingReunion[]) : [];
    const reunion = reuniones.find((item) => item.id === reunionId);
    if (!reunion) return { success: false, error: 'No se encontro la reunion.' };

    const now = new Date().toISOString();
    const uploadResult = await uploadAudioIfPresent({ file: audioFile, fiestaId, reunionId, durationSeconds, now });
    const warnings = uploadResult.warning ? [uploadResult.warning] : [];

    let analysis: MeetingIntelligenceOutput;
    try {
      analysis = await analyzeMeetingTranscript({
        eventContext: buildEventContext(fiesta),
        meetingTitle: reunion.titulo,
        meetingNotes: reunion.notas || '',
        currentChecklist: JSON.stringify((reunion.checklist || []).map((item) => ({ id: item.id, titulo: item.text, completado: item.completed })), null, 2),
        currentFaqs: JSON.stringify((fiesta.faqPortal || []).map((item) => ({ pregunta: item.pregunta, respuesta: item.respuesta })), null, 2),
        transcript,
        audioDataUri: uploadResult.audioDataUri,
      });
    } catch (error) {
      console.error('Error analyzing meeting transcript:', error);
      analysis = fallbackMeetingAnalysis(transcript);
      warnings.push('La IA no pudo completar el analisis. Se guardo un resumen basico para no perder la reunion.');
    }

    const cleanAnalysis = normalizeAnalysis(analysis);
    const acuerdosText = [
      `Resumen para cliente: ${cleanAnalysis.resumenCliente || 'Resumen pendiente de revision.'}`,
      cleanAnalysis.acuerdos.length ? `Acuerdos:\n- ${cleanAnalysis.acuerdos.join('\n- ')}` : '',
    ].filter(Boolean).join('\n\n');

    const updatedReunion = completeChecklist({
      ...reunion,
      acuerdos: acuerdosText,
      notas: [reunion.notas, transcript ? `Transcripcion/notas:\n${transcript}` : ''].filter(Boolean).join('\n\n'),
      resumenCliente: cleanAnalysis.resumenCliente,
      resumenOrganizador: cleanAnalysis.resumenOrganizador,
      preguntasCliente: cleanAnalysis.preguntasCliente,
      lastIntelligenceSyncAt: now,
      updatedAt: now,
      audioRecording: uploadResult.recording || reunion.audioRecording,
      aiSummary: {
        generatedAt: now,
        transcript,
        ...cleanAnalysis,
      },
    }, cleanAnalysis.checklistCompletadoIds);

    const detectedTasks = [
      ...buildDetectedTasks({ fiesta, reunion, tasks: cleanAnalysis.tareasCliente, owner: 'cliente' }),
      ...buildDetectedTasks({ fiesta, reunion, tasks: cleanAnalysis.tareasOrganizador, owner: 'organizacion' }),
    ];
    const learnedFaqs = buildLearningFaqs(reunion, cleanAnalysis.preguntasCliente, now);

    const nextFiesta: FiestaEnPlanificacion = {
      ...fiesta,
      reuniones: reuniones.map((item) => item.id === reunionId ? updatedReunion : item),
      tareas: mergeTasks(fiesta.tareas, detectedTasks),
      faqPortal: mergeFaqs(fiesta.faqPortal, learnedFaqs),
      clientPortalSettings: fiesta.clientPortalSettings ? {
        ...fiesta.clientPortalSettings,
        faq: {
          ...fiesta.clientPortalSettings.faq,
          visible: true,
        },
      } : fiesta.clientPortalSettings,
    };

    await saveFiesta(nextFiesta);

    try {
      const syncResult = await syncReunionToGoogleWorkspace(fiestaId, updatedReunion, { sendEmails: true, forceEmail: true });
      if (!syncResult.success && syncResult.message) warnings.push(syncResult.message);
    } catch (error) {
      console.error('Error syncing meeting intelligence to Google Workspace:', error);
      warnings.push('La reunion se guardo, pero Google Calendar/Gmail no se sincronizo en este intento.');
    }

    return { success: true, reunion: updatedReunion, detectedTasks, learnedFaqs, warnings };
  } catch (error) {
    console.error('Error processing meeting intelligence:', error);
    return { success: false, error: error instanceof Error ? error.message : 'No se pudo procesar la reunion.' };
  }
}
