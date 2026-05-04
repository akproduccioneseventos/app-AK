'use client';

import { useEffect, useState } from 'react';
import { Brain, Loader2, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMemoriasMultiagente, guardarAprendizajeAgente } from '@/app/actions/multiagent';
import type { AkAgentMemoryProfile, AkAgentType } from '@/types/multiagent';

const agentOptions: { value: AkAgentType; label: string }[] = [
  { value: 'secretaria', label: 'Secretaria AK' },
  { value: 'fiestas_general', label: 'General de Fiestas' },
  { value: 'contable', label: 'Contable' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'comercial', label: 'Comercial' },
];

export default function MultiagenteMemoriaPage() {
  const [profiles, setProfiles] = useState<AkAgentMemoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agentType, setAgentType] = useState<AkAgentType>('secretaria');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await getMemoriasMultiagente();
      setProfiles(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveLearning() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await guardarAprendizajeAgente({ agentType, title, content, module: agentType, tags: ['manual'] });
      setTitle('');
      setContent('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <Badge className="mb-3 bg-red-600 text-white">Aprendizaje</Badge>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950"><Brain className="h-8 w-8 text-red-600" /> Memoria del Multiagente</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">Acá podés guardar aprendizajes manuales y ver lo que los agentes ya tienen como memoria.</p>
      </section>

      <Card className="rounded-3xl border-red-100 bg-white shadow-xl shadow-red-900/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><Save className="h-5 w-5 text-red-600" /> Guardar aprendizaje</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[220px_1fr]">
          <Select value={agentType} onValueChange={(value) => setAgentType(value as AkAgentType)}>
            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>{agentOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del aprendizaje" className="rounded-2xl" />
          <div />
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Ejemplo: en fiestas de 15 conviene confirmar video de vida 20 días antes..." className="min-h-[100px] rounded-2xl" />
          <div />
          <Button onClick={saveLearning} disabled={saving || !title.trim() || !content.trim()} className="rounded-2xl bg-red-600 hover:bg-red-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {loading && <Card className="rounded-2xl"><CardContent className="flex items-center gap-2 p-6 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando memoria...</CardContent></Card>}
        {!loading && profiles.length === 0 && <Card className="rounded-2xl"><CardContent className="flex items-center gap-2 p-6 text-slate-500"><Sparkles className="h-4 w-4" /> Todavía no hay aprendizajes guardados.</CardContent></Card>}
        {profiles.map(profile => (
          <Card key={profile.id} className="rounded-2xl border-red-100 bg-white shadow-sm">
            <CardHeader><CardTitle className="text-lg font-black text-slate-900">{profile.displayName}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-slate-600">{profile.description}</p>
              <Badge variant="outline" className="border-red-200 text-red-700">{profile.learnings.length} aprendizajes</Badge>
              <div className="space-y-2">
                {profile.learnings.slice(0, 5).map(item => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm"><p className="font-black text-slate-900">{item.title}</p><p className="mt-1 text-slate-600">{item.content}</p></div>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
