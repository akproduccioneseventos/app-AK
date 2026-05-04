'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardCopy, Loader2, PartyPopper, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { createPostEventPackage, getPostEventOpportunities, type PostEventItem } from '@/app/actions/post-event-intelligence';

export default function PostEventPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [items, setItems] = useState<PostEventItem[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  async function load() {
    setLoading(true);
    try {
      const result = await getPostEventOpportunities();
      setItems(result.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }

  async function savePackage(item: PostEventItem) {
    setSavingId(item.fiestaId);
    setStatus('');
    try {
      const result = await createPostEventPackage(item.fiestaId, notes[item.fiestaId]);
      if (result.success) setStatus(`Paquete post-fiesta guardado para ${item.nombreEvento}.`);
      else setStatus(result.error || 'No se pudo guardar el paquete.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Post-fiesta</Badge>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950"><PartyPopper className="h-8 w-8 text-red-600" /> Cierre, testimonios y marketing</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Después de cada evento, prepara mensajes para testimonio, autorización de fotos, publicación sugerida y aprendizaje para los agentes.
            </p>
          </div>
          <Link href="/control-tower"><Button variant="outline" className="rounded-2xl font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
        </div>
      </section>

      {status && <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800"><CheckCircle2 className="h-5 w-5" /> {status}</div>}
      {loading && <Card className="rounded-2xl"><CardContent className="flex items-center gap-2 p-5 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando fiestas finalizadas...</CardContent></Card>}
      {!loading && items.length === 0 && <Card className="rounded-2xl border-green-100 bg-green-50"><CardContent className="p-5 text-sm font-bold text-green-800">No hay fiestas recientes para cierre post-fiesta.</CardContent></Card>}

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map(item => (
          <Card key={item.fiestaId} className="rounded-3xl border-red-100 bg-white shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-950">{item.nombreEvento}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Hace {item.daysAfter} día(s) · Preparación {item.preparationScore}% · {item.pendingTasks} pendiente(s)</p>
                </div>
                <Badge variant="outline" className="border-red-200 text-red-700">A cerrar</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-red-600">Mensaje testimonio</p>
                <p className="text-sm leading-6 text-slate-700">{item.testimonyMessage}</p>
                <Button onClick={() => copy(item.testimonyMessage, `${item.fiestaId}_testimonio`)} variant="outline" className="mt-3 rounded-2xl font-bold"><ClipboardCopy className="mr-2 h-4 w-4" /> {copied === `${item.fiestaId}_testimonio` ? 'Copiado' : 'Copiar'}</Button>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-red-600">Autorización fotos/redes</p>
                <p className="text-sm leading-6 text-slate-700">{item.photoMessage}</p>
                <Button onClick={() => copy(item.photoMessage, `${item.fiestaId}_foto`)} variant="outline" className="mt-3 rounded-2xl font-bold"><ClipboardCopy className="mr-2 h-4 w-4" /> {copied === `${item.fiestaId}_foto` ? 'Copiado' : 'Copiar'}</Button>
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-red-600">Idea de publicación</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.socialPostIdea}</p>
                <Button onClick={() => copy(item.socialPostIdea, `${item.fiestaId}_post`)} variant="outline" className="mt-3 rounded-2xl font-bold"><ClipboardCopy className="mr-2 h-4 w-4" /> {copied === `${item.fiestaId}_post` ? 'Copiado' : 'Copiar'}</Button>
              </div>

              <Textarea value={notes[item.fiestaId] || ''} onChange={e => setNotes(prev => ({ ...prev, [item.fiestaId]: e.target.value }))} placeholder="Notas internas: qué salió bien, qué mejorar, detalles para recordar..." className="min-h-[90px] rounded-2xl" />

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => savePackage(item)} disabled={savingId === item.fiestaId} className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">
                  {savingId === item.fiestaId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar cierre
                </Button>
                <Link href={item.href}><Button variant="outline" className="rounded-2xl font-bold"><Sparkles className="mr-2 h-4 w-4" /> Abrir fiesta</Button></Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
