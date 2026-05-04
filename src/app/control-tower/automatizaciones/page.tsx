'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BellRing, CheckCircle2, Loader2, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runSmartAutomations, type SmartAutomationResult } from '@/app/actions/smart-automations';

export default function SmartAutomationsPage() {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<number | null>(null);
  const [results, setResults] = useState<SmartAutomationResult[]>([]);

  async function run() {
    setLoading(true);
    setCreated(null);
    try {
      const response = await runSmartAutomations();
      setCreated(response.created);
      setResults(response.results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Automatizaciones</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Automatizaciones inteligentes AK</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Revisan presupuestos, CRM, fiestas, menú, invitados y tareas para crear avisos útiles sin usar lenguaje alarmante.
            </p>
          </div>
          <Link href="/control-tower"><Button variant="outline" className="rounded-2xl font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
        </div>
      </section>

      <Card className="rounded-3xl border-red-100 bg-white shadow-xl shadow-red-900/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-red-600" /> Revisión automática</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            Al ejecutar, la app revisa datos reales y crea notificaciones cuando detecta algo para atender: seguimientos comerciales, menú pendiente, invitados sin cargar o tareas con fecha cercana.
          </p>
          <Button onClick={run} disabled={loading} className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Ejecutar revisión inteligente
          </Button>
          {created !== null && (
            <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
              <CheckCircle2 className="h-5 w-5" /> Revisión completa. Avisos creados: {created}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {results.map(item => (
          <Card key={item.id} className="rounded-2xl border-red-100 bg-white shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600"><BellRing className="h-5 w-5" /></div>
                <div>
                  <p className="font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <Badge variant="outline" className={item.created ? 'mt-2 border-green-200 text-green-700' : 'mt-2 border-slate-200 text-slate-500'}>
                    {item.created ? 'Aviso creado' : 'Detectado'}
                  </Badge>
                </div>
              </div>
              {item.href && <Link href={item.href}><Button variant="outline" className="rounded-2xl font-bold">Abrir</Button></Link>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
