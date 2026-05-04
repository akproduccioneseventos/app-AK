'use client';

import { useState } from 'react';
import { BellRing, Brain, CheckCircle2, ClipboardList, Loader2, PartyPopper, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cerrarFiestaConRetroalimentacion, crearRecordatorioDesdeMultiagente, crearTareaDesdeMultiagente, enviarAprendizajeAFiestasGeneral } from '@/app/actions/multiagent';
import type { AkAgentType } from '@/types/multiagent';

export default function MultiagenteAccionesPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fiestaId, setFiestaId] = useState('');
  const [taskText, setTaskText] = useState('');
  const [reminderTitle, setReminderTitle] = useState('Recordatorio Multiagente AK');
  const [reminderMessage, setReminderMessage] = useState('');
  const [learningTitle, setLearningTitle] = useState('');
  const [learningContent, setLearningContent] = useState('');
  const [agentType, setAgentType] = useState<AkAgentType>('fiestas_general');
  const [closeNotes, setCloseNotes] = useState('');

  async function runAction(action: () => Promise<any>, successMessage: string) {
    setLoading(true);
    setStatus('');
    try {
      const result = await action();
      if (result?.success === false) setStatus(result.error || 'No se pudo completar la acción.');
      else setStatus(successMessage);
    } catch (error: any) {
      setStatus(error?.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <Badge className="mb-3 bg-red-600 text-white">Acciones reales</Badge>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950"><Brain className="h-8 w-8 text-red-600" /> Multiagente operativo</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
          Esta pantalla permite que el Multiagente no solo responda, sino que guarde aprendizajes, cree recordatorios, cree tareas y cierre fiestas con retroalimentación.
        </p>
      </section>

      {status && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
          <CheckCircle2 className="h-5 w-5" /> {status}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-red-600" /> Crear tarea en una fiesta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={fiestaId} onChange={e => setFiestaId(e.target.value)} placeholder="ID de la fiesta" className="rounded-2xl" />
            <Textarea value={taskText} onChange={e => setTaskText(e.target.value)} placeholder="Texto de la tarea" className="rounded-2xl" />
            <Button disabled={loading || !fiestaId.trim() || !taskText.trim()} onClick={() => runAction(() => crearTareaDesdeMultiagente({ fiestaId, texto: taskText }), 'Tarea creada y aprendizaje guardado.')} className="rounded-2xl bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Crear tarea
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-red-600" /> Crear recordatorio</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} placeholder="Título" className="rounded-2xl" />
            <Textarea value={reminderMessage} onChange={e => setReminderMessage(e.target.value)} placeholder="Mensaje del recordatorio" className="rounded-2xl" />
            <Button disabled={loading || !reminderMessage.trim()} onClick={() => runAction(() => crearRecordatorioDesdeMultiagente({ titulo: reminderTitle, mensaje: reminderMessage, fiestaId: fiestaId || undefined }), 'Recordatorio creado.')} className="rounded-2xl bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />} Crear recordatorio
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-red-600" /> Enviar aprendizaje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={agentType} onValueChange={value => setAgentType(value as AkAgentType)}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fiestas_general">General de fiestas</SelectItem>
                <SelectItem value="secretaria">Secretaria</SelectItem>
                <SelectItem value="contable">Contable</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
            <Input value={learningTitle} onChange={e => setLearningTitle(e.target.value)} placeholder="Título del aprendizaje" className="rounded-2xl" />
            <Textarea value={learningContent} onChange={e => setLearningContent(e.target.value)} placeholder="Contenido del aprendizaje" className="rounded-2xl" />
            <Button disabled={loading || !learningTitle.trim() || !learningContent.trim()} onClick={() => runAction(() => enviarAprendizajeAFiestasGeneral({ fiestaId: fiestaId || undefined, title: learningTitle, content: learningContent }), 'Aprendizaje guardado y enviado al agente general.')} className="rounded-2xl bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />} Guardar aprendizaje
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><PartyPopper className="h-5 w-5 text-red-600" /> Cerrar fiesta con retroalimentación</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={fiestaId} onChange={e => setFiestaId(e.target.value)} placeholder="ID de la fiesta" className="rounded-2xl" />
            <Textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} placeholder="Notas finales: qué salió bien, qué falló, qué repetir" className="rounded-2xl" />
            <Button disabled={loading || !fiestaId.trim()} onClick={() => runAction(() => cerrarFiestaConRetroalimentacion({ fiestaId, notasFinales: closeNotes }), 'Fiesta cerrada: resumen guardado y enviado al agente general.')} className="rounded-2xl bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PartyPopper className="mr-2 h-4 w-4" />} Cerrar fiesta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
