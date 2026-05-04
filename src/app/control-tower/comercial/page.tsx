'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardCopy, Loader2, PhoneCall, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createCommercialFollowupAlerts, getCommercialFollowups, type CommercialFollowupItem } from '@/app/actions/commercial-intelligence';

const priorityStyles = {
  alta: 'border-red-200 bg-red-50 text-red-700',
  media: 'border-amber-200 bg-amber-50 text-amber-700',
  normal: 'border-slate-200 bg-slate-50 text-slate-600',
} as const;

export default function CommercialFollowupsPage() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [items, setItems] = useState<CommercialFollowupItem[]>([]);
  const [status, setStatus] = useState('');

  async function load() {
    setLoading(true);
    try {
      const result = await getCommercialFollowups();
      setItems(result.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function copyMessage(item: CommercialFollowupItem) {
    await navigator.clipboard.writeText(item.suggestedMessage);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function createAlerts() {
    setCreating(true);
    setStatus('');
    try {
      const result = await createCommercialFollowupAlerts();
      setStatus(`Avisos creados: ${result.created}. Seguimientos detectados: ${result.total}.`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Comercial inteligente</Badge>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950"><PhoneCall className="h-8 w-8 text-red-600" /> Seguimientos comerciales</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Revisa leads y presupuestos enviados para ayudarte a saber a quién escribir, por qué y con qué mensaje.
            </p>
          </div>
          <Link href="/control-tower"><Button variant="outline" className="rounded-2xl font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
        </div>
      </section>

      <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black text-slate-950">Crear avisos comerciales</p>
            <p className="mt-1 text-sm text-slate-600">Genera notificaciones para los seguimientos detectados.</p>
          </div>
          <Button onClick={createAlerts} disabled={creating} className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Crear avisos
          </Button>
        </CardContent>
      </Card>

      {status && <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800"><CheckCircle2 className="h-5 w-5" /> {status}</div>}

      {loading && <Card className="rounded-2xl"><CardContent className="flex items-center gap-2 p-5 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando seguimientos...</CardContent></Card>}

      {!loading && items.length === 0 && <Card className="rounded-2xl border-green-100 bg-green-50"><CardContent className="p-5 text-sm font-bold text-green-800">Todo tranquilo. No hay seguimientos comerciales importantes detectados.</CardContent></Card>}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map(item => (
          <Card key={item.id} className="rounded-3xl border-red-100 bg-white shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-950">{item.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{item.source === 'crm' ? 'CRM' : 'Presupuesto'} · {item.status}</p>
                </div>
                <Badge variant="outline" className={priorityStyles[item.priority]}>{item.priority === 'alta' ? 'Prioridad alta' : item.priority === 'media' ? 'A revisar' : 'Normal'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">{item.reason}</p>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.suggestedMessage}</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => copyMessage(item)} variant="outline" className="rounded-2xl font-bold"><ClipboardCopy className="mr-2 h-4 w-4" /> {copiedId === item.id ? 'Copiado' : 'Copiar WhatsApp'}</Button>
                <Link href={item.href}><Button className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">Abrir</Button></Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
