import Link from 'next/link';
import { ArrowLeft, Camera, CheckCircle2, Flame, Gamepad2, Heart, MessageCircle, Monitor, ShieldCheck, Sparkles, Trophy, Users, ExternalLink } from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyStateModulo } from '@/components/ui/empty-state-modulo';
import { createDefaultFiestaSocialConfig, getFiestaSocialStageLabel } from '@/lib/social-fiesta/social-fiesta-base';
import { buildAkSoftSellingPosts } from '@/lib/social-fiesta/private-feed';
import { buildLiveWallEmptyState, buildLiveWallPremiumSlides } from '@/lib/social-fiesta/live-wall-premium';
import { buildPresetGameSet, getReadyPromptsForPreset, type FiestaEventPreset } from '@/lib/social-fiesta/games-raffles-ranking';
import { buildModerationSummary } from '@/lib/social-fiesta/operator-moderation-panel';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

type PageProps = { searchParams?: Promise<{ fiestaId?: string }> };

function buildEventName(fiesta?: FiestaEnPlanificacion | null): string {
  return fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.tipoCelebracion || 'Evento AK';
}

function buildProtagonistName(fiesta?: FiestaEnPlanificacion | null): string | undefined {
  return fiesta?.configuracion?.protagonista1Nombre || fiesta?.configuracion?.nombreAgasajado || fiesta?.configuracion?.clienteNombre;
}

function inferPreset(fiesta?: FiestaEnPlanificacion | null): FiestaEventPreset {
  const text = `${fiesta?.configuracion?.tipoCelebracion ?? ''} ${fiesta?.configuracion?.nombreEvento ?? ''}`.toLowerCase();
  if (text.includes('boda') || text.includes('casamiento')) return 'boda';
  if (text.includes('xv') || text.includes('15') || text.includes('quince')) return 'xv';
  if (text.includes('empresa') || text.includes('corporativo')) return 'empresarial';
  if (text.includes('infantil') || text.includes('nino') || text.includes('niño')) return 'infantil';
  if (text.includes('cumple')) return 'cumpleanos';
  return 'general';
}

function linkFor(path: string, fiestaId: string): string {
  return `${path}?fiestaId=${encodeURIComponent(fiestaId)}`;
}

export default async function SocialFiestaProPage(props: PageProps) {
  const params = (await props.searchParams) ?? {};
  const fiestaId = params.fiestaId;

  if (!fiestaId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader><CardTitle>Falta elegir un evento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Para abrir Social Fiesta Pro primero hay que entrar desde un evento en planificacion.</p>
            <Button asChild><Link href="/eventos">Volver a eventos</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const fiesta = await getFiestaById(fiestaId);

  if (!fiesta) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card><CardHeader><CardTitle>No se encontro la fiesta</CardTitle></CardHeader></Card>
      </main>
    );
  }

  if (fiesta.modulosContratados && !fiesta.modulosContratados.muroSocial && !fiesta.modulosContratados.redSocial) {
    return (
      <EmptyStateModulo
        titulo="Social Fiesta Pro"
        descripcion="El módulo de Muro Social o Red Social no está contratado para este evento. Habilitalo desde la configuración o tienda."
        fiestaId={fiestaId}
      />
    );
  }

  const eventName = buildEventName(fiesta);
  const preset = inferPreset(fiesta);
  const config = createDefaultFiestaSocialConfig({
    fiestaId,
    nombreEvento: eventName,
    protagonistName: buildProtagonistName(fiesta),
    portadaUrl: fiesta?.clientePortalExperience?.heroImageUrl || fiesta?.configuracion?.protagonistaFotoUrl,
    colorPrincipal: fiesta?.clientePortalExperience?.primaryColor || fiesta?.configuracion?.primaryColor,
    hashtag: `AK${eventName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`,
  });
  const seedPosts = buildAkSoftSellingPosts({ fiestaId, stage: config.stage, eventName });
  const slides = buildLiveWallPremiumSlides({
    posts: seedPosts,
    theme: {
      eventName,
      protagonistName: buildProtagonistName(fiesta),
      backgroundUrl: fiesta?.clientePortalExperience?.heroImageUrl || fiesta?.configuracion?.protagonistaFotoUrl,
      primaryColor: config.theme.colorPrincipal,
      accentColor: config.theme.colorAcento,
      textColor: '#ffffff',
      showAkBranding: true,
      akBrandingText: 'AK Producciones',
    },
  });
  const fallbackSlide = buildLiveWallEmptyState({ eventName, protagonistName: buildProtagonistName(fiesta), primaryColor: config.theme.colorPrincipal, accentColor: config.theme.colorAcento, textColor: '#ffffff', showAkBranding: true, akBrandingText: 'AK Producciones' });
  const gameSet = buildPresetGameSet({ fiestaId, preset });
  const prompts = getReadyPromptsForPreset(preset);
  const moderation = buildModerationSummary(seedPosts);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 -ml-3">
              <Button asChild variant="ghost">
                <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>Volver</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden sm:flex bg-white hover:bg-slate-50 text-slate-700">
                <Link href={`/evento/social/${fiestaId}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2 text-violet-500" />
                  Previsualizar
                </Link>
              </Button>
            </div>
            <Badge className="mb-3 border-violet-200 bg-violet-50 text-violet-700">Experiencia gamificada</Badge>
        </div>
      </div>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card><CardContent className="space-y-5 p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-violet-700">Experiencia visible para invitados</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{eventName}</h1>
            <p className="max-w-3xl text-base text-muted-foreground">Este panel une invitacion, red social privada, fotos, mensajes, juegos, sorteos y pantalla gigante. La fiesta queda simple para el invitado y controlada para el operador.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button asChild variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"><Link href={linkFor('/fiestas/nueva/muro-social', fiestaId)}><Monitor className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Muro social y pantalla</span><span className="block text-xs font-normal text-muted-foreground">Moderar fotos, mensajes, juegos y pantalla gigante.</span></span></Link></Button>
              <Button asChild variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"><Link href={linkFor('/fiestas/nueva/pagina-web', fiestaId)}><QrCode className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Invitacion web</span><span className="block text-xs font-normal text-muted-foreground">RSVP e invitados desde celular.</span></span></Link></Button>
              <Button asChild variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"><Link href={linkFor('/fiestas/nueva/en-vivo', fiestaId)}><Sparkles className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Evento en vivo</span><span className="block text-xs font-normal text-muted-foreground">Contenido aprobado en el dia de la fiesta.</span></span></Link></Button>
              <Button asChild variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"><a href={`/evento/social/${fiestaId}`} target="_blank" rel="noopener noreferrer"><Users className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Vista invitado real</span><span className="block text-xs font-normal text-muted-foreground">Celular participativo con fotos, videos, chat y musica.</span></span></a></Button>
              <Button asChild variant="outline" className="h-auto justify-start gap-3 whitespace-normal p-4 text-left"><a href={`/evento/muro-en-vivo/${fiestaId}`} target="_blank" rel="noopener noreferrer"><Monitor className="h-5 w-5 shrink-0" /><span><span className="block font-semibold">Pantalla LED real</span><span className="block text-xs font-normal text-muted-foreground">Salida grande filtrada por aprobacion.</span></span></a></Button>
            </div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Estado del motor</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-100 p-3"><span>Etapa</span><strong>{getFiestaSocialStageLabel(config.stage)}</strong></div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-100 p-3"><span>Privacidad</span><strong>Solo invitados</strong></div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-100 p-3"><span>Moderacion</span><strong>Segura</strong></div>
          </CardContent></Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="flex items-center gap-4 p-5"><MessageCircle className="h-5 w-5 text-violet-700" /><div><p className="text-sm text-muted-foreground">Contenido inicial</p><p className="text-2xl font-semibold text-slate-950">{seedPosts.length}</p><p className="text-xs text-muted-foreground">avisos AK listos</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5"><Monitor className="h-5 w-5 text-violet-700" /><div><p className="text-sm text-muted-foreground">Pantalla</p><p className="text-2xl font-semibold text-slate-950">{slides.length || 1}</p><p className="text-xs text-muted-foreground">slides generados</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5"><Gamepad2 className="h-5 w-5 text-violet-700" /><div><p className="text-sm text-muted-foreground">Juegos</p><p className="text-2xl font-semibold text-slate-950">{gameSet.length}</p><p className="text-xs text-muted-foreground">desafios por tipo de evento</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5"><ShieldCheck className="h-5 w-5 text-violet-700" /><div><p className="text-sm text-muted-foreground">Aprobados</p><p className="text-2xl font-semibold text-slate-950">{moderation.bigScreen}</p><p className="text-xs text-muted-foreground">aptos para pantalla</p></div></CardContent></Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Lo que ve la gente en la fiesta</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            {(slides.length ? slides : [fallbackSlide]).slice(0, 4).map(slide => <div key={slide.id} className="rounded-lg border bg-white p-4"><Badge variant="outline">{slide.mode.replace(/_/g, ' ')}</Badge><h3 className="mt-3 font-semibold text-slate-950">{slide.title}</h3>{slide.subtitle && <p className="mt-2 text-sm text-muted-foreground">{slide.subtitle}</p>}<p className="mt-3 text-xs text-muted-foreground">{Math.round(slide.durationMs / 1000)} segundos en pantalla</p></div>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Prompts listos</CardTitle></CardHeader><CardContent className="space-y-3">{prompts.slice(0, 5).map(prompt => <div key={prompt.id} className="rounded-lg border bg-white p-3"><p className="font-medium text-slate-950">{prompt.title}</p><p className="mt-1 text-sm text-muted-foreground">{prompt.prompt}</p></div>)}</CardContent></Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Juegos y sorteos activables</CardTitle></CardHeader><CardContent className="space-y-3">{gameSet.map(game => <div key={game.id} className="flex gap-3 rounded-lg border bg-white p-4"><Trophy className="mt-1 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-semibold text-slate-950">{game.title}</p><p className="text-sm text-muted-foreground">{game.description}</p></div></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Reglas simples para que no se rompa</CardTitle></CardHeader><CardContent className="space-y-3">{[['Cliente', 'Puede ver, elegir musica, coordinar reuniones y enviar material.'], ['Invitado', 'Usa el celular: confirma, sube fotos, deja mensajes y participa.'], ['Operador', 'Aprueba u oculta antes de mostrar en pantalla gigante.'], ['AK', 'Mantiene presencia sutil: se ve profesional sin invadir la fiesta.']].map(([title, text]) => <div key={title} className="flex gap-3 rounded-lg bg-slate-100 p-4"><Users className="mt-1 h-5 w-5 shrink-0 text-slate-700" /><div><p className="font-semibold text-slate-950">{title}</p><p className="text-sm text-muted-foreground">{text}</p></div></div>)}</CardContent></Card>
        </section>

        <Card><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-950">Siguiente paso operativo</h2><p className="text-sm text-muted-foreground">Revisar el muro real, activar los desafios que correspondan y probar la pantalla antes del evento.</p></div><Button asChild><Link href={linkFor('/fiestas/nueva/muro-social', fiestaId)}><Camera className="mr-2 h-4 w-4" />Abrir muro social</Link></Button></CardContent></Card>
      </div>
    </main>
  );
}
