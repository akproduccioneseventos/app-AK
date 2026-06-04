'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Camera,
  CheckCircle2,
  Flame,
  Gamepad2,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Music,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Wine,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, ZonaDigitalAdolescentesSettings } from '@/types/fiesta';
import {
  getVisibleZonaDigitalFeatures,
  withZonaDigitalDefaults,
} from '@/lib/zona-digital-adolescentes';
import { cn } from '@/lib/utils';

const featureIcon: Record<string, React.ElementType> = {
  muro_social: ImageIcon,
  retos: Trophy,
  juegos: Gamepad2,
  fotocabina: Camera,
  plataforma360: Sparkles,
  bogue: Flame,
  espejo_magico: UserRound,
  barra: Wine,
  totems: QrCode,
  audioritmico: Music,
  ranking: Trophy,
  recap: Heart,
};

function getBackgroundClass(style: ZonaDigitalAdolescentesSettings['backgroundStyle']) {
  if (style === 'white_premium') return 'bg-[linear-gradient(180deg,#ffffff,#f8fafc)] text-slate-950';
  if (style === 'club_mode') return 'bg-[radial-gradient(circle_at_top,#dc2626_0,transparent_28%),linear-gradient(135deg,#020617,#111827_45%,#0f172a)] text-white';
  if (style === 'neon_clean') return 'bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.24),transparent_28%),linear-gradient(145deg,#020617,#111827)] text-white';
  return 'bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.20),transparent_28%),linear-gradient(145deg,#020617,#111827)] text-white';
}

export default function ZonaDigitalPublicPage() {
  const params = useParams<{ fiestaId: string }>();
  const fiestaId = decodeURIComponent(params.fiestaId);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [followAcknowledged, setFollowAcknowledged] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const current = await getFiestaById(fiestaId);
      setFiesta(current);
      setIsLoading(false);
    }
    load();
  }, [fiestaId]);

  const settings = useMemo(() => withZonaDigitalDefaults(fiesta?.zonaDigitalAdolescentes), [fiesta]);
  const visibleFeatures = useMemo(
    () => getVisibleZonaDigitalFeatures(settings, fiesta?.modulosContratados),
    [settings, fiesta?.modulosContratados]
  );
  const challenges = settings.challenges.filter(item => item.enabled);
  const games = settings.games.filter(item => item.enabled);
  const socialNetworks = settings.socialNetworks.filter(item => item.enabled);
  const emojis = settings.emojiReactions.filter(item => item.enabled);
  const selectedChallenge = challenges.find(item => item.id === selectedChallengeId) ?? challenges[0];
  const canDownload = !settings.showSocialFollowGate || followAcknowledged;

  if (isLoading) {
    return <div className="ak-live-stage flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-red-500" /></div>;
  }

  if (!fiesta || !settings.enabled) {
    return (
      <main className="ak-live-stage flex min-h-screen items-center justify-center p-6 text-white">
        <Card className="ak-live-panel max-w-md text-white">
          <CardContent className="space-y-4 p-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-red-400" />
            <h1 className="text-2xl font-black">Zona digital no activa</h1>
            <p className="text-white/70">Cuando AK la active, aca vas a ver retos, juegos y fotos de la fiesta.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className={cn('min-h-screen overflow-hidden px-4 py-5 sm:px-6', getBackgroundClass(settings.backgroundStyle))}>
      <div className="relative mx-auto max-w-6xl space-y-5">
        <div className="flex justify-start">
           <Button asChild variant="outline" className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link href={`/evento/hub/${fiestaId}`}>? Volver al Hub</Link>
           </Button>
        </div>
        <section className="ak-live-panel p-5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="mb-4 border-white/20 bg-white/15 text-current">AK Producciones</Badge>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{settings.title}</h1>
              <p className="mt-3 max-w-2xl text-base opacity-80 sm:text-lg">{settings.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-red-600 text-white">{settings.hashtag}</Badge>
                <Badge variant="outline" className="border-current text-current">{visibleFeatures.length} experiencias</Badge>
                <Badge variant="outline" className="border-current text-current">{challenges.length} retos</Badge>
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 text-slate-950 shadow-xl">
              <Label className="text-xs font-black uppercase text-slate-400">Tu apodo</Label>
              <Input value={nickname} onChange={event => setNickname(event.target.value)} placeholder="Ej: Mesa 7, Sofi, Team XV" className="mt-2" />
              <p className="mt-2 text-xs text-slate-500">Solo se usa para retos y ranking de esta fiesta.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card className="border-white/10 bg-white/95 text-slate-950 shadow-2xl">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-red-600">Reto destacado</p>
                  <h2 className="text-2xl font-black">{selectedChallenge?.title ?? 'Reto de la fiesta'}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedChallenge?.description ?? 'Elegis un reto y lo subis al muro.'}</p>
                </div>
                <div className="text-5xl">{selectedChallenge?.emoji ?? '??'}</div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {challenges.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedChallengeId(item.id)}
                    className={cn(
                      'rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg',
                      selectedChallenge?.id === item.id ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-3xl">{item.emoji}</span>
                      <Badge variant="outline">+{item.points}</Badge>
                    </div>
                    <p className="mt-2 font-black">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button asChild className="rounded-full bg-red-600 hover:bg-red-700">
                  <Link href={`/evento/social/${fiestaId}`}><Camera className="mr-2 h-4 w-4" /> Subir al muro</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/evento/barra/${fiestaId}`}><Wine className="mr-2 h-4 w-4" /> Barra</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/evento/muro-en-vivo/${fiestaId}`}><Sparkles className="mr-2 h-4 w-4" /> Pantalla</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/10 text-current shadow-2xl backdrop-blur">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase opacity-60">Emoji mood</p>
                <h2 className="text-2xl font-black">Como esta la fiesta?</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {emojis.map(item => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(item.emoji)}
                    className={cn(
                    'rounded-lg border border-white/15 bg-white/10 p-4 text-4xl transition hover:scale-105',
                      selectedEmoji === item.emoji && 'bg-white text-slate-950'
                    )}
                    aria-label={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-sm font-bold">Puntos estimados</p>
                <Progress value={selectedChallenge ? Math.min(100, selectedChallenge.points / 1.5) : 30} className="mt-3 h-2" />
                <p className="mt-2 text-xs opacity-70">{nickname || 'Tu apodo'} puede aparecer en el ranking de pantalla.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleFeatures.map(item => {
            const Icon = featureIcon[item.id] ?? Sparkles;
            let href = `/evento/hub/${fiestaId}`;
            if (item.id === 'muro_social') href = `/evento/social/${fiestaId}`;
            if (item.id === 'fotocabina') href = `/evento/fotocabina/${fiestaId}`;
            if (item.id === 'plataforma360') href = `/evento/plataforma-360/${fiestaId}`;
            if (item.id === 'bogue') href = `/evento/fotocabina/${fiestaId}`;
            if (item.id === 'espejo_magico') href = `/evento/espejo-magico/${fiestaId}`;
            if (item.id === 'barra') href = `/evento/barra/${fiestaId}`;
            if (item.id === 'totems') href = `/evento/hub/${fiestaId}`;
            if (item.id === 'audioritmico') href = `/evento/muro-en-vivo/${fiestaId}`;
            if (item.id === 'ranking') href = `/evento/zona-digital/${fiestaId}`;
            if (item.id === 'recap') href = `/evento/galeria/${fiestaId}`;

            return (
              <Link key={item.id} href={href} className="block group">
                <Card className="h-full border-white/10 bg-white/95 text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl hover:border-red-500/50">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-black">{item.label}</h3>
                    <p className="text-sm text-slate-500">{item.description}</p>
                    {item.requiresHardware && <Badge variant="outline">estacion fisica</Badge>}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
          <Card className="border-white/10 bg-white/95 text-slate-950 shadow-xl">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Gamepad2 className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl font-black">Juegos activos</h2>
              </div>
              <div className="space-y-3">
                {games.map(game => (
                  <div key={game.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{game.emoji} {game.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{game.prompt}</p>
                      </div>
                      <Badge variant="outline">+{game.points}</Badge>
                    </div>
                    {!!game.options?.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {game.options.map(option => <Badge key={option} className="bg-slate-100 text-slate-700">{option}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950 text-white shadow-xl">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Share2 className="h-6 w-6 text-red-400" />
                <h2 className="text-2xl font-black">Compartir y seguir AK</h2>
              </div>
              <p className="text-sm text-white/70">
                Para descargar fotos con marco AK, primero pasa por las redes oficiales. Despues comparti con el hashtag de la fiesta.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {socialNetworks.map(network => (
                  <Button key={network.id} asChild variant="outline" className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white hover:text-slate-950">
                    <a href={network.url} target="_blank" rel="noreferrer">{network.label} {network.handle}</a>
                  </Button>
                ))}
              </div>
              {settings.showSocialFollowGate && (
                <button
                  type="button"
                  onClick={() => setFollowAcknowledged(true)}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black transition',
                    followAcknowledged ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white hover:bg-red-700'
                  )}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {followAcknowledged ? 'Listo para descargar' : 'Ya pase por las redes'}
                </button>
              )}
              <Button disabled={!canDownload} className="w-full rounded-full bg-white text-slate-950 hover:bg-white/90">
                Descargar marco / sticker AK
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="ak-live-panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-1 h-5 w-5 text-red-400" />
            <div>
              <h2 className="text-xl font-black">Reglas simples</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {settings.safetyRules.map(rule => (
                  <div key={rule} className="rounded-lg bg-white/10 p-3 text-sm opacity-85">{rule}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
