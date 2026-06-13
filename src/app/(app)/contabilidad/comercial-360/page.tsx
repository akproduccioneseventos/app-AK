import Link from 'next/link';
import { ArrowLeft, BadgeDollarSign, CheckCircle2, GalleryHorizontalEnd, MessageCircle, Monitor, Presentation, Sparkles, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildCommercialDiscountLineItems, buildCommercialFictitiousDiscount, formatCommercialMoneyUYU } from '@/lib/commercial/fictitious-discount';
import { buildCommercialFollowUpChecklist, buildCommercialFollowUpPlan } from '@/lib/commercial/commercial-follow-up';
import { buildCommercialGalleryUsageChecklist } from '@/lib/commercial/commercial-gallery';
import { buildPortalLedProImplementationChecklist, buildPortalLedProVisualModel } from '@/lib/commercial/portal-led-pro-visual-model';
import { buildSimulatorConversionChecklist, buildSimulatorConversionPlan } from '@/lib/commercial/simulator-conversion-engine';

const sampleLead = {
  source: 'portal_led' as const,
  clientName: 'Cliente AK',
  eventType: 'Fiesta de 15',
  guests: 120,
  hasVenue: false,
  wantsClubUruguay: true,
  estimatedTotal: 680000,
  completedSalesPresentation: true,
  requestedMeeting: true,
  clickedWhatsApp: true,
  createdBudget: true,
};

export default function Commercial360Page() {
  const visualModel = buildPortalLedProVisualModel();
  const conversionPlan = buildSimulatorConversionPlan(sampleLead);
  const followUpPlan = buildCommercialFollowUpPlan(conversionPlan);
  const discount = buildCommercialFictitiousDiscount({ targetFinalPrice: sampleLead.estimatedTotal, visualDiscountPercentage: 15, giftsValue: 45000 });
  const discountLines = buildCommercialDiscountLineItems({ targetFinalPrice: sampleLead.estimatedTotal, visualDiscountPercentage: 15, giftsValue: 45000 });
  const ledChecklist = buildPortalLedProImplementationChecklist();
  const simulatorChecklist = buildSimulatorConversionChecklist();
  const galleryChecklist = buildCommercialGalleryUsageChecklist();
  const followUpChecklist = buildCommercialFollowUpChecklist();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost"><Link href="/contabilidad"><ArrowLeft className="mr-2 h-4 w-4" />Volver a contabilidad</Link></Button>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Comercial 360</Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card><CardContent className="space-y-5 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"><Presentation className="h-4 w-4 text-emerald-700" />Presentacion comercial conectada con CRM, presupuesto y LED</div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{visualModel.title}</h1>
            <p className="max-w-3xl text-base text-muted-foreground">Esta pantalla hace visible el trabajo posterior a la PR #445: presentacion comercial, simulador, descuento visual, seguimiento, galeria comercial y Portal LED.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild><Link href="/presentacion-led"><Monitor className="mr-2 h-4 w-4" />Abrir Portal LED</Link></Button>
              <Button asChild variant="outline"><Link href="/galeria-led"><GalleryHorizontalEnd className="mr-2 h-4 w-4" />Ver galeria LED</Link></Button>
              <Button asChild variant="outline"><Link href="/contabilidad/crm"><Target className="mr-2 h-4 w-4" />Ir al CRM</Link></Button>
            </div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Ejemplo de cierre</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="rounded-lg bg-emerald-50 p-4"><p className="text-muted-foreground">Total final AK</p><p className="text-3xl font-bold text-emerald-900">{formatCommercialMoneyUYU(discount.finalPrice)}</p><p className="mt-2 text-emerald-800">Ahorro mostrado: {formatCommercialMoneyUYU(discount.savingsStoryValue)}</p></div><p className="text-xs text-muted-foreground">{discount.disclaimer}</p></CardContent></Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-5"><Monitor className="mb-3 h-5 w-5 text-indigo-700" /><p className="text-sm text-muted-foreground">Secciones LED</p><p className="text-3xl font-semibold text-slate-950">{visualModel.sections.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><Target className="mb-3 h-5 w-5 text-emerald-700" /><p className="text-sm text-muted-foreground">Temperatura lead</p><p className="text-3xl font-semibold text-slate-950">{conversionPlan.leadTemperature}</p></CardContent></Card>
          <Card><CardContent className="p-5"><MessageCircle className="mb-3 h-5 w-5 text-blue-700" /><p className="text-sm text-muted-foreground">Tareas seguimiento</p><p className="text-3xl font-semibold text-slate-950">{followUpPlan.tasks.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><Sparkles className="mb-3 h-5 w-5 text-amber-700" /><p className="text-sm text-muted-foreground">Reglas visuales</p><p className="text-3xl font-semibold text-slate-950">{visualModel.designRules.length}</p></CardContent></Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card><CardHeader><CardTitle>Camino comercial visible</CardTitle></CardHeader><CardContent className="space-y-3">{visualModel.sections.map(section => <div key={section.id} className="rounded-lg border bg-white p-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-950">{section.priority}. {section.title}</p><Badge variant="outline">{section.layout}</Badge></div><p className="text-sm text-muted-foreground">{section.subtitle}</p><p className="mt-2 text-xs text-slate-600">{section.screenRule}</p></div>)}</CardContent></Card>

          <div className="space-y-6">
            <Card><CardHeader><CardTitle>Descuento visual sin tocar precio real</CardTitle></CardHeader><CardContent className="space-y-3">{discountLines.map(line => <div key={line.label} className="flex items-center justify-between rounded-md bg-white p-3 text-sm"><span>{line.label}</span><strong className={line.kind === 'final' ? 'text-emerald-700' : ''}>{formatCommercialMoneyUYU(line.value)}</strong></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Seguimiento automatico sugerido</CardTitle></CardHeader><CardContent className="space-y-3">{followUpPlan.tasks.map(task => <div key={task.id} className="rounded-lg border bg-white p-4"><div className="mb-2 flex items-center justify-between gap-2"><p className="font-semibold text-slate-950">{task.title}</p><Badge variant="outline">{task.timing}</Badge></div><p className="text-sm text-muted-foreground">{task.message}</p></div>)}</CardContent></Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            { title: 'Portal LED', items: ledChecklist.slice(0, 6) },
            { title: 'Simulador', items: simulatorChecklist },
            { title: 'Galeria y CRM', items: [...galleryChecklist.slice(0, 3), ...followUpChecklist.slice(0, 3)] },
          ].map(group => <Card key={group.title}><CardHeader><CardTitle>{group.title}</CardTitle></CardHeader><CardContent className="space-y-3">{group.items.map(item => <div key={item} className="flex gap-3 rounded-lg bg-white p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><p className="text-sm text-muted-foreground">{item}</p></div>)}</CardContent></Card>)}
        </section>

        <Card><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-950">Resultado buscado</h2><p className="text-sm text-muted-foreground">Que cada consulta comercial tenga presentacion, presupuesto, seguimiento y material visual conectados.</p></div><Button asChild><Link href="/simulador-v2"><BadgeDollarSign className="mr-2 h-4 w-4" />Abrir simulador</Link></Button></CardContent></Card>
      </div>
    </main>
  );
}
