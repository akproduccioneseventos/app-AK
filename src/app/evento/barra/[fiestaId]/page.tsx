'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Info,
  Instagram,
  Loader2,
  Martini,
  Search,
  Share2,
  Shuffle,
  Sparkles,
  Upload,
  Video,
  Wine,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { BarDrinkOrder, BarTechnologyDashboard } from '@/types/barra-tecnologica';
import type { Trago } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';
import {
  createBarDrinkOrder,
  getBarraTecnologicaDashboard,
  uploadBarMagicPhoto,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { getSocialPosts } from '@/app/actions/social-gallery';
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
  const [barPhotos, setBarPhotos] = useState<SocialGalleryPost[]>([]);
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
    const [dashResult, postsResult] = await Promise.all([
      getBarraTecnologicaDashboard(fiestaId),
      getSocialPosts(fiestaId).catch(() => []),
    ]);

    if (dashResult.success && dashResult.data) {
      setDashboard(dashResult.data);
    } else {
      toast({ title: 'No se pudo abrir la barra', description: dashResult.error, variant: 'destructive' });
    }

    const approvedBarPhotos = (postsResult || [])
      .filter((post) => (post.moderationStatus ?? 'approved') === 'approved')
      .filter((post) => post.source === 'bar-tech' || post.sourceModule === 'barraTecnologica');
    setBarPhotos(approvedBarPhotos);

    setIsLoading(false);
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
    // Poll data every 5 seconds to sync orders and photos
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
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
    if (!guestName.trim()) {
      toast({ title: 'Tu nombre es necesario', description: 'Por favor, ingresá tu nombre para hacer el pedido.', variant: 'destructive' });
      return;
    }
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
      loadData();
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
    
    // Draw horizontal mirror if facing user
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset

    // Overlay photo banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, canvas.height - 130, canvas.width, 130);
    
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(settings?.hashtag || '#AKProducciones', 40, canvas.height - 70);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    const activeDrinkName = selectedDrink?.nombre || lastOrder?.drinkName || 'un Trago AK';
    ctx.fillText(`Disfrutando de mi ${activeDrinkName} 🍸`, 40, canvas.height - 30);
    
    setCapturedDataUrl(canvas.toDataURL('image/jpeg', 0.92));
  };

  const uploadCapturedPhoto = async (file?: File) => {
    const finalFile = file || (capturedDataUrl ? dataUrlToFile(capturedDataUrl, `barra-ak-${Date.now()}.jpg`) : null);
    if (!finalFile) return;
    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('authorName', guestName || 'Invitado barra AK');
    
    const activeDrinkName = selectedDrink?.nombre || lastOrder?.drinkName;
    const activeDrinkId = selectedDrink?.id || lastOrder?.drinkId;
    formData.append('caption', activeDrinkName ? `Tomando un ${activeDrinkName} en la barra` : 'En la barra tecnologica de AK');
    formData.append('followConfirmed', String(canSharePhotos));
    formData.append('file', finalFile);
    
    if (activeDrinkId) formData.append('drinkId', activeDrinkId);
    if (activeDrinkName) formData.append('drinkName', activeDrinkName);

    const result = await uploadBarMagicPhoto(formData);
    if (result.success) {
      setUploadedPhotoUrl(result.url || null);
      setShareText(result.shareText || '');
      toast({ title: 'Foto subida', description: 'Ya puede aparecer en el muro social.' });
      loadData();
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-rose-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!dashboard || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-black text-rose-500">Barra no disponible</h1>
          <p className="mt-2 text-slate-400">No se pudo cargar la experiencia de tragos.</p>
        </div>
      </div>
    );
  }

  const accentColor = settings.accentColor || '#f43f5e';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30 overflow-y-auto">
      {/* Background Aurora Drift */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -left-20 top-0 h-[60vh] w-[60vh] rounded-full blur-3xl opacity-20 bg-[radial-gradient(circle,rgba(244,63,94,0.4),transparent)] animate-[pulse_8s_infinite]" />
        <div className="absolute -right-20 bottom-0 h-[60vh] w-[60vh] rounded-full blur-3xl opacity-20 bg-[radial-gradient(circle,rgba(6,182,212,0.4),transparent)] animate-[pulse_10s_infinite_reverse]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[56.25vh] flex-col justify-between bg-slate-900/60 backdrop-blur-md shadow-2xl border-x border-white/5 px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <header className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Martini className="h-7 w-7 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-500">AK Barra Interactiva</p>
                <h1 className="text-2xl font-black tracking-tight text-white truncate">{settings.title}</h1>
                <p className="text-xs font-semibold text-slate-400 mt-0.5 line-clamp-2">{settings.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
              <div className="text-left">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Tag del Evento</p>
                <p className="text-sm font-black text-rose-500">{settings.hashtag}</p>
              </div>
              {settings.instagramHandle && (
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Instagram</p>
                  <p className="text-sm font-bold text-slate-300">{settings.instagramHandle}</p>
                </div>
              )}
            </div>
          </header>

          {/* Guest Info Prompt */}
          <section className="rounded-3xl border border-white/5 bg-slate-950/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">1. Ingresa tu Nombre</h2>
              <span className="text-[10px] font-bold text-rose-400/80 animate-pulse">Obligatorio para pedir</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Escribí tu nombre aquí..."
                className="h-11 rounded-xl border-white/10 bg-slate-900 text-white placeholder-slate-500 text-sm font-bold focus:border-rose-500 focus:ring-rose-500"
              />
              <Input
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                placeholder="Mesa"
                className="h-11 w-16 text-center rounded-xl border-white/10 bg-slate-900 text-white placeholder-slate-500 text-sm font-bold focus:border-rose-500 focus:ring-rose-500"
              />
            </div>
          </section>

          {/* Search & Filters */}
          <section className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-white/5 bg-slate-950/40 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar trago o ingrediente..."
                className="h-10 rounded-xl border-none bg-transparent pl-9 text-xs font-bold text-white placeholder-slate-500"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={drinkFilter === 'todos' ? 'default' : 'ghost'}
                size="sm"
                className={`h-10 rounded-xl text-xs font-black ${
                  drinkFilter === 'todos'
                    ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setDrinkFilter('todos')}
              >
                Todos
              </Button>
              <Button
                variant={drinkFilter === 'sinAlcohol' ? 'default' : 'ghost'}
                size="sm"
                className={`h-10 rounded-xl text-xs font-black ${
                  drinkFilter === 'sinAlcohol'
                    ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setDrinkFilter('sinAlcohol')}
              >
                Sin Alcohol
              </Button>
            </div>
          </section>

          {/* Randomizer */}
          <Button variant="outline" className="h-11 w-full rounded-2xl border-white/10 bg-white/5 text-xs font-black text-rose-400 hover:bg-white/10 hover:text-white" onClick={openRandomDrink}>
            <Shuffle className="mr-2 h-4 w-4" /> Sorprendeme con un trago al azar
          </Button>

          {/* Drinks Grid */}
          <section className="grid grid-cols-2 gap-3 min-h-0">
            {visibleDrinks.map((drink) => (
              <motion.button
                key={drink.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedDrink(drink)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-slate-950/60 p-3 text-left shadow-lg transition hover:bg-slate-950/80 hover:border-white/15"
              >
                <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-slate-900">
                  {drink.imageUrl ? (
                    <NextImage src={drink.imageUrl} alt={drink.nombre} fill className="object-cover transition duration-300 group-hover:scale-105" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-rose-500/40">
                      <Wine className="h-10 w-10" />
                    </div>
                  )}
                  {settings.showAlcoholFreeTag && isAlcoholFree(drink) && (
                    <Badge className="absolute left-2 top-2 bg-emerald-600/90 text-[8px] font-bold tracking-wider text-white">Sin alcohol</Badge>
                  )}
                  {settings.showDrinkVideo && getDrinkVideoUrl(drink) && (
                    <Badge className="absolute right-2 top-2 gap-0.5 bg-cyan-600/90 text-[8px] font-bold tracking-wider text-white">
                      <Video className="h-2.5 w-2.5" /> Video
                    </Badge>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <h3 className="font-headline text-base font-black tracking-tight text-white leading-snug truncate">{drink.nombre}</h3>
                  {settings.showIngredients && drink.ingredientes?.length ? (
                    <p className="text-[10px] font-semibold text-slate-500 line-clamp-1">{drink.ingredientes.join(', ')}</p>
                  ) : (
                    <p className="text-[10px] font-semibold text-rose-400">Ver y pedir</p>
                  )}
                </div>
              </motion.button>
            ))}
          </section>

          {/* Last Order Feedback */}
          {lastOrder && (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <div className="flex items-center gap-2 text-sm font-black"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> ¡Pedido Enviado!</div>
              <p className="mt-1 text-xs font-semibold">{lastOrder.drinkName} preparado para {lastOrder.guestName}</p>
              <p className="mt-1.5 text-[10px] font-mono text-emerald-500">CODIGO: {lastOrder.id.slice(-6).toUpperCase()}</p>
            </div>
          )}
        </div>

        {/* Gallery Carousel */}
        {barPhotos.length > 0 && (
          <div className="mt-8 border-t border-white/5 pt-6 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4" /> Fotos de la Barra
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {barPhotos.map((post) => (
                <div key={post.id} className="relative w-28 aspect-[4/5] shrink-0 rounded-2xl overflow-hidden border border-white/5 bg-slate-900 shadow-md snap-start">
                  <NextImage src={post.imageUrl} alt={post.authorName} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-center min-w-0">
                    <p className="text-[9px] font-bold text-white truncate">{post.authorName}</p>
                    {post.drinkName && <p className="text-[8px] text-rose-400 font-extrabold truncate">{post.drinkName}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Drink Detail Drawer / Modal */}
      <AnimatePresence>
        {selectedDrink && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-[56.25vh] rounded-t-[2.5rem] bg-slate-900 border-t border-white/10 p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Detalle del Trago</p>
                  <h2 className="text-2xl font-black text-white">{selectedDrink.nombre}</h2>
                  {settings.showAlcoholFreeTag && isAlcoholFree(selectedDrink) && (
                    <Badge className="bg-emerald-600 text-[9px] font-bold uppercase tracking-wider text-white mt-1">Sin Alcohol</Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-slate-400 hover:text-white" onClick={() => setSelectedDrink(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-4 overflow-hidden rounded-3xl border border-white/5 bg-slate-950">
                {settings.showDrinkVideo && getDrinkVideoUrl(selectedDrink) ? (
                  <video src={getDrinkVideoUrl(selectedDrink)} controls autoPlay loop playsInline className="max-h-56 w-full bg-slate-950 object-contain" />
                ) : selectedDrink.imageUrl ? (
                  <div className="relative h-48">
                    <NextImage src={selectedDrink.imageUrl} alt={selectedDrink.nombre} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center bg-slate-950 text-rose-500/30">
                    <Wine className="h-12 w-12" />
                  </div>
                )}
              </div>

              {settings.showDrinkDescription && (selectedDrink.descripcion || selectedDrink.description) && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <Info className="h-3.5 w-3.5" /> Descripción
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-slate-300">{getDrinkDescription(selectedDrink)}</p>
                </div>
              )}

              {settings.showIngredients && selectedDrink.ingredientes?.length && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ingredientes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDrink.ingredientes.map((ingredient) => (
                      <span key={ingredient} className="rounded-full bg-white/5 border border-white/5 px-2.5 py-1 text-[10px] font-black text-slate-300">{ingredient}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nota para el barman (opcional)</Label>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej: sin hielo, con limón, más dulce..." className="min-h-16 rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-600 text-xs font-bold" />
              </div>

              <div className="mt-5 flex gap-2">
                {settings.allowPhotoCapture && (
                  <Button variant="outline" className="h-12 flex-1 rounded-2xl border-white/10 bg-white/5 font-black text-xs" onClick={startCamera} disabled={isStartingCamera}>
                    {isStartingCamera ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4 text-rose-400" />}
                    Sacarme Foto 📸
                  </Button>
                )}
                <Button className="h-12 flex-1 rounded-2xl bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] font-black text-xs hover:bg-rose-600" onClick={submitOrder} disabled={isOrdering}>
                  {isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
                  Pedir Trago
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Follow Gate */}
      <AnimatePresence>
        {showFollowGate && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }} className="w-full max-w-sm rounded-[2rem] bg-slate-900 border border-white/10 p-6 shadow-2xl text-center">
              <div className="flex items-start justify-between gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Paso Social</p>
                  <h2 className="text-xl font-black text-white mt-1">Seguinos en Redes</h2>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-slate-400" onClick={() => setShowFollowGate(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-400">{settings.socialFollowPrompt}</p>
              <div className="mt-5 space-y-2">
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="block">
                  <Button className="h-11 w-full rounded-xl bg-rose-500 text-white font-black text-xs">
                    <Instagram className="mr-2 h-4 w-4" /> Abrir Instagram <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Button>
                </a>
                <Button variant="outline" className="h-11 w-full rounded-xl border-white/10 bg-white/5 font-black text-xs" onClick={confirmSocialFollow}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" /> Ya segui, subir foto
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Capture Screen */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Espejo Mágico de Barra</p>
                    <h2 className="text-xl font-black text-white mt-0.5">Capturar mi Selfi</h2>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-slate-400" onClick={stopCamera}><X className="h-4 w-4" /></Button>
                </div>
                
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 aspect-[4/5] border border-white/5">
                  {capturedDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={capturedDataUrl} alt="Foto capturada" className="h-full w-full object-cover" />
                  ) : (
                    <video ref={videoRef} className="h-full w-full object-cover scale-x-[-1]" playsInline muted />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 to-transparent p-5 text-left pointer-events-none">
                    <p className="text-lg font-black text-rose-500">{settings.hashtag}</p>
                    <p className="text-xs font-bold text-white/80">
                      Disfrutando de mi {selectedDrink?.nombre || lastOrder?.drinkName || 'Trago AK'} 🍸
                    </p>
                  </div>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex flex-col gap-2">
                  {!capturedDataUrl ? (
                    <Button className="h-11 w-full rounded-xl bg-rose-500 text-white font-black text-xs shadow-lg" onClick={capturePhoto}>
                      <Camera className="mr-2 h-4 w-4" /> Capturar Foto
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-11 rounded-xl border-white/10 bg-white/5 font-bold text-xs" onClick={() => setCapturedDataUrl(null)}>Repetir</Button>
                      <Button className="h-11 rounded-xl bg-rose-500 text-white font-black text-xs" onClick={() => uploadCapturedPhoto()} disabled={isUploadingPhoto}>
                        {isUploadingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Subir al Muro
                      </Button>
                    </div>
                  )}
                  <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-all">
                    <Upload className="mr-2 h-4 w-4" /> Subir desde el celular
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => event.target.files?.[0] && uploadCapturedPhoto(event.target.files[0])} />
                  </label>
                </div>
                
                {uploadedPhotoUrl && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-center">
                    <p className="font-black text-emerald-300 text-xs">¡Foto Subida con Éxito!</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">{shareText}</p>
                    <Button className="mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] h-9 w-full" onClick={sharePhoto}>
                      <Share2 className="mr-2 h-3.5 w-3.5" /> Compartir Link
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
