'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CheckCircle2, Clock3, ExternalLink, Info, Instagram, Loader2, Martini, Search, Share2, Shuffle, Sparkles, Upload, Video, Wine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { BarDrinkOrder, BarTechnologyDashboard } from '@/types/barra-tecnologica';
import type { Trago } from '@/types/fiesta';
import {
  createBarDrinkOrder,
  getBarraTecnologicaDashboard,
  uploadBarMagicPhoto,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { buildInstagramUrl, getDrinkDescription, getDrinkTags } from '@/lib/barra-tecnologica';

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [meta, data] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

function isAlcoholFree(drink: Trago) {
  const text = `${drink.nombre} ${(drink.ingredientes || []).join(' ')}`.toLowerCase();
  return text.includes('sin alcohol') || text.includes('mocktail') || text.includes('virgen');
}

function getDrinkVideoUrl(drink: Trago) {
  return drink.videoUrl?.trim();
}

export default function BarraTecnologicaTouchPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState<BarTechnologyDashboard | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<Trago | null>(null);
  const [guestName, setGuestName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [note, setNote] = useState('');
  const [lastOrder, setLastOrder] = useState<BarDrinkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [shareText, setShareText] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [hasFollowedSocials, setHasFollowedSocials] = useState(false);
  const [showFollowGate, setShowFollowGate] = useState(false);
  const [query, setQuery] = useState('');
  const [drinkFilter, setDrinkFilter] = useState<'todos' | 'sinAlcohol'>('todos');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadData = useCallback(async () => {
    const result = await getBarraTecnologicaDashboard(fiestaId);
    if (result.success && result.data) {
      setDashboard(result.data);
    } else {
      toast({ title: 'No se pudo abrir la barra', description: result.error, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!fiestaId) return;
    setHasFollowedSocials(window.localStorage.getItem(`ak-bar-follow-${fiestaId}`) === 'true');
  }, [fiestaId]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const settings = dashboard?.settings;
  const visibleDrinks = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (dashboard?.drinks || [])
      .filter((drink) => (drink.stockDisponible ?? 1) > 0)
      .filter((drink) => drinkFilter === 'todos' || isAlcoholFree(drink))
      .filter((drink) => {
        if (!search) return true;
        return `${drink.nombre} ${(drink.ingredientes || []).join(' ')} ${drink.descripcion || drink.description || ''}`.toLowerCase().includes(search);
      });
  }, [dashboard, drinkFilter, query]);

  const instagramUrl = useMemo(() => buildInstagramUrl(settings?.instagramHandle), [settings?.instagramHandle]);
  const canSharePhotos = !settings?.requireSocialFollowForPhotos || hasFollowedSocials;

  const submitOrder = async () => {
    if (!selectedDrink) return;
    setIsOrdering(true);
    const result = await createBarDrinkOrder({
      fiestaId,
      drinkId: selectedDrink.id,
      guestName,
      tableNumber,
      note,
    });
    if (result.success && result.order) {
      setLastOrder(result.order);
      setSelectedDrink(null);
      setNote('');
      toast({ title: 'Pedido enviado', description: 'El barman ya lo ve en su pantalla.' });
    } else {
      toast({ title: 'No se pudo pedir', description: result.error, variant: 'destructive' });
    }
    setIsOrdering(false);
  };

  const confirmSocialFollow = () => {
    window.localStorage.setItem(`ak-bar-follow-${fiestaId}`, 'true');
    setHasFollowedSocials(true);
    setShowFollowGate(false);
    toast({ title: 'Listo', description: 'Ahora podes subir tu foto al muro social.' });
  };

  const openRandomDrink = () => {
    if (!visibleDrinks.length) return;
    const index = Math.floor(Math.random() * visibleDrinks.length);
    setSelectedDrink(visibleDrinks[index]);
  };

  const startCamera = async () => {
    if (!canSharePhotos) {
      setShowFollowGate(true);
      return;
    }
    setIsStartingCamera(true);
    setCapturedDataUrl(null);
    setUploadedPhotoUrl(null);
    setShareText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch {
      toast({ title: 'Camara no disponible', description: 'Podes subir una foto desde el celular.', variant: 'destructive' });
      setIsCameraOpen(true);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText(settings?.hashtag || '#AKProducciones', 40, canvas.height - 58);
    ctx.font = '28px Arial';
    ctx.fillText(settings?.brandText || 'Barra tecnologica AK', 40, canvas.height - 22);
    setCapturedDataUrl(canvas.toDataURL('image/jpeg', 0.92));
  };

  const uploadCapturedPhoto = async (file?: File) => {
    const finalFile = file || (capturedDataUrl ? dataUrlToFile(capturedDataUrl, `barra-ak-${Date.now()}.jpg`) : null);
    if (!finalFile) return;
    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('authorName', guestName || 'Invitado barra AK');
    formData.append('caption', `Foto desde la barra tecnologica de ${dashboard?.eventName || 'AK Producciones'}`);
    formData.append('followConfirmed', String(canSharePhotos));
    formData.append('file', finalFile);
    const result = await uploadBarMagicPhoto(formData);
    if (result.success) {
      setUploadedPhotoUrl(result.url || null);
      setShareText(result.shareText || '');
      toast({ title: 'Foto subida', description: 'Ya puede aparecer en el muro social.' });
    } else {
      toast({ title: 'No se pudo subir', description: result.error, variant: 'destructive' });
    }
    setIsUploadingPhoto(false);
  };

  const sharePhoto = async () => {
    const text = shareText || `${settings?.brandText || 'AK Producciones'} ${settings?.hashtag || '#AKProducciones'}`;
    if (navigator.share) {
      await navigator.share({ title: 'Barra tecnologica AK', text, url: uploadedPhotoUrl || window.location.href }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(`${text} ${uploadedPhotoUrl || ''}`.trim()).catch(() => undefined);
    toast({ title: 'Texto copiado', description: 'Pegalo en tu red social y etiquetanos.' });
  };

  if (isLoading) {
    return (
      <div className="ak-live-stage flex min-h-screen items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!dashboard || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-2xl font-black">Barra no disponible</h1>
          <p className="mt-2 text-slate-500">No se pudo cargar la experiencia de tragos.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.16),_transparent_32%),linear-gradient(135deg,#ffffff,#f8fafc_45%,#eef2ff)] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-white/70 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-xl" style={{ backgroundColor: settings.accentColor }}>
              <Martini className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: settings.accentColor }}>AK barra interactiva</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{settings.title}</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-500 sm:text-base">{settings.subtitle}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Compartir</p>
            <p className="text-xl font-black" style={{ color: settings.accentColor }}>{settings.hashtag}</p>
            <p className="text-sm font-bold text-slate-500">{settings.instagramHandle}</p>
          </div>
        </header>

        <section className="grid gap-3 rounded-lg border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-200/70 backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, sabor o ingrediente"
              className="h-14 rounded-2xl border-slate-200 bg-white pl-12 text-base font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={drinkFilter === 'todos' ? 'default' : 'outline'} className="h-14 rounded-2xl font-black" onClick={() => setDrinkFilter('todos')} style={drinkFilter === 'todos' ? { backgroundColor: settings.accentColor } : undefined}>Todos</Button>
            <Button variant={drinkFilter === 'sinAlcohol' ? 'default' : 'outline'} className="h-14 rounded-2xl font-black" onClick={() => setDrinkFilter('sinAlcohol')} style={drinkFilter === 'sinAlcohol' ? { backgroundColor: settings.accentColor } : undefined}>Sin alcohol</Button>
          </div>
          <Button variant="outline" className="h-14 rounded-2xl font-black" onClick={openRandomDrink}>
            <Shuffle className="mr-2 h-5 w-5" /> Sorprendeme
          </Button>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDrinks.map((drink) => (
              <motion.button
                key={drink.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedDrink(drink)}
                className="overflow-hidden rounded-lg border border-white bg-white text-left shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative h-44 bg-slate-100">
                  {drink.imageUrl ? (
                    <NextImage src={drink.imageUrl} alt={drink.nombre} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-rose-100">
                      <Wine className="h-16 w-16" style={{ color: settings.accentColor }} />
                    </div>
                  )}
                  {settings.showAlcoholFreeTag && isAlcoholFree(drink) && (
                    <Badge className="absolute left-3 top-3 bg-emerald-600 text-white">Sin alcohol</Badge>
                  )}
                  {settings.showDrinkVideo && getDrinkVideoUrl(drink) && (
                    <Badge className="absolute right-3 top-3 gap-1 bg-slate-950/80 text-white"><Video className="h-3 w-3" /> Video</Badge>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl font-black">{drink.nombre}</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">Ver</span>
                  </div>
                  {settings.showDrinkDescription ? (
                    <p className="line-clamp-2 text-sm font-semibold text-slate-500">{getDrinkDescription(drink)}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    {getDrinkTags(drink).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">{tag}</span>
                    ))}
                  </div>
                  {settings.showIngredients && drink.ingredientes?.length ? (
                    <p className="line-clamp-2 text-sm font-semibold text-slate-500">{drink.ingredientes.join(' · ')}</p>
                  ) : (
                    <p className="text-sm font-semibold text-slate-400">Toca para pedirlo al barman</p>
                  )}
                </div>
              </motion.button>
            ))}
          </section>

          <aside className="sticky top-4 h-fit space-y-4 rounded-lg border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: settings.accentColor }}>Paso 1</p>
              <h2 className="text-2xl font-black">Tus datos</h2>
              <p className="text-sm text-slate-500">{settings.guestPrompt}</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Tu nombre" className="h-12 rounded-2xl text-lg" />
              </div>
              <div>
                <Label>Mesa o referencia</Label>
                <Input value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} placeholder="Mesa 8, barra, VIP..." className="h-12 rounded-2xl text-lg" />
              </div>
            </div>

            {lastOrder && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> Pedido enviado</div>
                <p className="mt-1 text-sm font-semibold">{lastOrder.drinkName} para {lastOrder.guestName}</p>
                <p className="mt-1 text-xs text-emerald-700">Codigo: {lastOrder.id.slice(-6).toUpperCase()}</p>
              </div>
            )}

            {settings.requireSocialFollowForPhotos && (
              <div className={`rounded-3xl border p-4 ${hasFollowedSocials ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <div className="flex items-center gap-2 font-black">
                  {hasFollowedSocials ? <CheckCircle2 className="h-5 w-5" /> : <Instagram className="h-5 w-5" />}
                  {hasFollowedSocials ? 'Redes confirmadas' : 'Fotos con redes'}
                </div>
                <p className="mt-1 text-sm font-semibold">{hasFollowedSocials ? 'Ya podes subir fotos al muro.' : settings.socialFollowPrompt}</p>
                {!hasFollowedSocials && (
                  <Button variant="outline" className="mt-3 w-full rounded-2xl font-black" onClick={() => setShowFollowGate(true)}>
                    <Instagram className="mr-2 h-4 w-4" /> Seguir para subir foto
                  </Button>
                )}
              </div>
            )}

            {settings.allowPhotoCapture && (
              <Button className="h-14 w-full rounded-2xl text-base font-black" style={{ backgroundColor: settings.accentColor }} onClick={startCamera} disabled={isStartingCamera}>
                {isStartingCamera ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Camera className="mr-2 h-5 w-5" />}
                Sacarme foto AK
              </Button>
            )}
          </aside>
        </div>
      </section>

      <AnimatePresence>
        {selectedDrink && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }} className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: settings.accentColor }}>Confirmar pedido</p>
                  <h2 className="text-3xl font-black">{selectedDrink.nombre}</h2>
                  {selectedDrink.ingredientes?.length ? <p className="mt-1 text-sm font-semibold text-slate-500">{selectedDrink.ingredientes.join(' · ')}</p> : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDrink(null)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border bg-slate-50">
                {settings.showDrinkVideo && getDrinkVideoUrl(selectedDrink) ? (
                  <video src={getDrinkVideoUrl(selectedDrink)} controls playsInline className="max-h-72 w-full bg-slate-950 object-contain" />
                ) : selectedDrink.imageUrl ? (
                  <div className="relative h-56">
                    <NextImage src={selectedDrink.imageUrl} alt={selectedDrink.nombre} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-100 via-white to-rose-100">
                    <Wine className="h-16 w-16" style={{ color: settings.accentColor }} />
                  </div>
                )}
                {settings.showDrinkDescription && (
                  <div className="space-y-3 p-4">
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                      <Info className="h-4 w-4" /> Que lleva
                    </div>
                    <p className="text-sm font-semibold leading-6 text-slate-600">{getDrinkDescription(selectedDrink)}</p>
                    {settings.showIngredients && selectedDrink.ingredientes?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDrink.ingredientes.map((ingredient) => (
                          <span key={ingredient} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{ingredient}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Label>Nota para el barman</Label>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej: sin hielo, menos dulce, para retirar en barra..." className="min-h-24 rounded-2xl" />
              </div>
              <div className="mt-5 flex gap-3">
                <Button variant="outline" className="h-12 flex-1 rounded-2xl font-bold" onClick={() => setSelectedDrink(null)}>Cancelar</Button>
                <Button className="h-12 flex-1 rounded-2xl font-black" style={{ backgroundColor: settings.accentColor }} onClick={submitOrder} disabled={isOrdering}>
                  {isOrdering ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Clock3 className="mr-2 h-5 w-5" />}
                  Enviar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFollowGate && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }} className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: settings.accentColor }}>Paso social</p>
                  <h2 className="text-3xl font-black">Segui a AK para compartir</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowFollowGate(false)}><X className="h-5 w-5" /></Button>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{settings.socialFollowPrompt}</p>
              <div className="mt-5 space-y-3">
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="block">
                  <Button className="h-12 w-full rounded-2xl font-black" style={{ backgroundColor: settings.accentColor }}>
                    <Instagram className="mr-2 h-5 w-5" /> Abrir Instagram <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Button variant="outline" className="h-12 w-full rounded-2xl font-black" onClick={confirmSocialFollow}>
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Ya segui, quiero subir mi foto
                </Button>
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-400">La app no entra a tu cuenta: solo te pide confirmar el paso antes de publicar.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCameraOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="w-full max-w-3xl overflow-hidden rounded-lg border-none bg-white shadow-2xl">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: settings.accentColor }}>Espejo barra AK</p>
                    <h2 className="text-2xl font-black">Foto para el muro social</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={stopCamera}><X className="h-5 w-5" /></Button>
                </div>
                <div className="relative overflow-hidden rounded-lg bg-slate-950">
                  {capturedDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={capturedDataUrl} alt="Foto capturada" className="max-h-[62vh] w-full object-contain" />
                  ) : (
                    <video ref={videoRef} className="max-h-[62vh] w-full object-contain" playsInline muted />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
                    <p className="text-2xl font-black">{settings.hashtag}</p>
                    <p className="font-semibold">{settings.brandText}</p>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex flex-col gap-2 sm:flex-row">
                  {!capturedDataUrl ? (
                    <Button className="h-12 flex-1 rounded-2xl font-black" style={{ backgroundColor: settings.accentColor }} onClick={capturePhoto}>
                      <Camera className="mr-2 h-5 w-5" /> Capturar
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="h-12 flex-1 rounded-2xl font-bold" onClick={() => setCapturedDataUrl(null)}>Repetir</Button>
                      <Button className="h-12 flex-1 rounded-2xl font-black" style={{ backgroundColor: settings.accentColor }} onClick={() => uploadCapturedPhoto()} disabled={isUploadingPhoto}>
                        {isUploadingPhoto ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                        Subir al muro
                      </Button>
                    </>
                  )}
                  <label className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-700">
                    <Upload className="mr-2 h-5 w-5" /> Subir foto
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => event.target.files?.[0] && uploadCapturedPhoto(event.target.files[0])} />
                  </label>
                </div>
                {uploadedPhotoUrl && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-black text-emerald-900">Foto lista para compartir</p>
                    <p className="text-sm font-semibold text-emerald-700">{shareText}</p>
                    <Button className="mt-3 rounded-2xl font-black" onClick={sharePhoto}>
                      <Share2 className="mr-2 h-4 w-4" /> Compartir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
