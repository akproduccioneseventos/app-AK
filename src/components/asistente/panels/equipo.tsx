'use client';

import { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle2, Loader2, RefreshCw, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMultiAgentTeamBriefing, runMultiAgentTeamReview } from '@/app/actions/multiagent';
import type { AkAgentType } from '@/types/multiagent';
import type { AkAgentDiagnosticItem, AkAgentTeamBriefing } from '@/lib/multiagent/diagnostics';

const agentLabels: Record<AkAgentType, string> = {
  secretaria: 'Secretaria AK',
  fiesta: 'Agente por fiesta',
  fiestas_general: 'General de fiestas',
  contable: 'Contable',
  marketing: 'Marketing',
  comercial: 'Comercial',
  central: 'Central',
};

const priorityStyle = {
  alta: 'border-red-200 bg-red-50 text-red-700',
  media: 'border-amber-200 bg-amber-50 text-amber-700',
  normal: 'border-slate-200 bg-slate-50 text-slate-600',
} as const;

function groupByAgent(items: AkAgentDiagnosticItem[]) {
  return items.reduce((acc, item) => {
    if (item.agentType === 'central') return acc;
    if (!acc[item.agentType]) acc[item.agentType] = [];
    acc[item.agentType]?.push(item);
    return acc;
  }, {} as Partial<Record<AkAgentType, AkAgentDiagnosticItem[]>>);
}

export default function MultiagenteEquipoPage() {
  const [briefing, setBriefing] = useState<AkAgentTeamBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const groupedEntries = useMemo(() => {
    const entries = Object.entries(groupByAgent(briefing?.items || []));
    return entries.filter((entry): entry is [AkAgentType, AkAgentDiagnosticItem[]] => Array.isArray(entry[1]) && entry[1].length > 0);
  }, [briefing]);

  async function load() {
    setLoading(true);
    setStatus('');
    try {
      const result = await getMultiAgentTeamBriefing();
      if (result.success) setBriefing(result.data);
    } finally {
      setLoading(false);
    }
  }

  async function saveReview() {
    setSaving(true);
    setStatus('');
    try {
      const result = await runMultiAgentTeamReview();
      if (result.success) {
        setBriefing(result.briefing);
        setStatus(result.failed > 0
          ? `Se guardó en ${result.saved} agente(s). ${result.failed} no se pudieron guardar.`
          : `Revisión guardada en la memoria de ${result.saved} agente(s).`);
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Revisión del equipo</Badge>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950"><Brain className="h-8 w-8 text-red-600" /> Equipo multiagente AK</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Vista para ver qué detecta cada agente con datos reales: fiestas, tareas, pagos, CRM, post-fiesta y marketing. También guarda la revisión como aprendizaje.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={load} disabled={loading || saving} variant="outline" className="rounded-2xl font-bold">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Revisar ahora
            </Button>
            <Button onClick={saveReview} disabled={loading || saving || !briefing} className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar aprendizaje
            </Button>
          </div>
        </div>
      </section>

      {status && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
          <CheckCircle2 className="h-5 w-5" /> {status}
        </div>
      )}

      <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-red-600">Resumen</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{briefing?.summary || 'Preparando revisión...'}</h2>
            <p className="mt-1 text-sm text-slate-500">{briefing?.generatedAt ? new Date(briefing.generatedAt).toLocaleString('es-UY') : 'Sin fecha todavía'}</p>
          </div>
          <Badge variant="outline" className="border-red-200 text-red-700">{briefing?.items.length || 0} punto(s)</Badge>
        </CardContent>
      </Card>

      {loading && (
        <Card className="rounded-2xl border-red-100">
          <CardContent className="flex items-center gap-2 p-6 text-sm font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Revisando equipo...</CardContent>
        </Card>
      )}

      {!loading && briefing && briefing.items.length === 0 && (
        <Card className="rounded-2xl border-green-100 bg-green-50">
          <CardContent className="flex items-center gap-2 p-6 text-sm font-bold text-green-800"><Sparkles className="h-4 w-4" /> No se detectaron pendientes importantes con los datos actuales.</CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {groupedEntries.map(([agentType, items]) => (
          <Card key={agentType} className="rounded-3xl border-red-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-lg font-black text-slate-950">
                <span>{agentLabels[agentType]}</span>
                <Badge variant="outline" className="border-red-200 text-red-700">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.slice(0, 8).map(item => (
                <a key={item.id} href={item.href} className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-red-50">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={priorityStyle[item.priority]}>{item.priority === 'alta' ? 'Alta' : item.priority === 'media' ? 'A revisar' : 'Normal'}</Badge>
                    {item.fiestaId && <Badge variant="outline" className="border-slate-200 text-slate-500">Fiesta</Badge>}
                  </div>
                  <h3 className="font-black text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </a>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
