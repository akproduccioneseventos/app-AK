'use client';

import React, { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Camera, Music, MessageSquare, Vote, Loader2, Upload, Send, Star, Gift, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GuestBotWidget } from '@/components/evento/guest-bot-widget';
import { getPublicGuestEvent } from '@/app/actions/public-guest-portal';
import {
  getEventoEnVivoData,
  addFotoEnVivo,
  addSolicitudCancion,
  addMensajeEnVivo,
  votarEnVivo,
  registerGuestLiveInterest,
} from '@/app/actions/evento-en-vivo';
import type { EventoEnVivoData, VotacionEnVivo } from '@/types/fiesta';

const REFRESH_INTERVAL = 15_000;

export default function InvitadosPage() {
  const { fiestaId } = useParams<{ fiestaId: string }>();
  const searchParams = useSearchParams();
  const guestId = searchParams.get('guestId') || '';
  const guestAccessToken = searchParams.get('token') || '';
  const { toast } = useToast();

  const [fiestaName, setFiestaName] = useState('');
  const [data, setData] = useState<EventoEnVivoData>({
    fotos: [],
    solicitudesCanciones: [],
    mensajes: [],
    votaciones: [],
  });
  const [loading, setLoading] = useState(true);
  const [votadoIds, setVotadoIds] = useState<Set<string>>(new Set());

  // Photo form
  const [fotoAutor, setFotoAutor] = useState('');
  const [fotoMensaje, setFotoMensaje] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Song form
  const [songNombre, setSongNombre] = useState('');
  const [songCancion, setSongCancion] = useState('');
  const [songArtista, setSongArtista] = useState('');
  const [sendingSong, setSendingSong] = useState(false);
  const [myRequestIds, setMyRequestIds] = useState<Set<string>>(new Set());

  // Message form
  const [msgAutor, setMsgAutor] = useState('');
  const [msgTexto, setMsgTexto] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // CRM Sorteo Form
  const [crmNombre, setCrmNombre] = useState('');
  const [crmPhone, setCrmPhone] = useState('');
  const [crmFecha, setCrmFecha] = useState('');
  const [crmConsent, setCrmConsent] = useState(false);
  const [sendingCrm, setSendingCrm] = useState(false);
  const [crmSuccess, setCrmSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    const [fiesta, eventoData] = await Promise.all([
      getPublicGuestEvent(fiestaId),
      getEventoEnVivoData(fiestaId),
    ]);
    if (fiesta) setFiestaName(fiesta.configuracion?.nombreEvento || fiesta.configuracion?.nombreAgasajado || 'Evento');
    setData(eventoData);
    setLoading(false);
  }, [fiestaId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Photo file handler
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'Máximo 2MB por foto.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setFotoBase64(result);
      setFotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFotoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fotoBase64 || (!fotoAutor.trim() && !guestId)) {
      toast({ title: 'Completá los campos', description: 'Nombre y foto son obligatorios.', variant: 'destructive' });
      return;
    }
    setUploadingFoto(true);
    const result = await addFotoEnVivo(fiestaId, {
      url: fotoBase64,
      autor: fotoAutor.trim() || 'Invitado',
      mensaje: fotoMensaje.trim() || undefined,
    }, guestId || undefined, guestAccessToken || undefined);
    setUploadingFoto(false);
    if (result.success) {
      toast({ title: '¡Foto enviada!', description: 'Tu foto ya está en el álbum del evento.' });
      setFotoAutor('');
      setFotoMensaje('');
      setFotoPreview(null);
      setFotoBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleSongSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!songNombre.trim() || !songCancion.trim()) {
      toast({ title: 'Completá los campos', description: 'Nombre y canción son obligatorios.', variant: 'destructive' });
      return;
    }
    setSendingSong(true);
    const result = await addSolicitudCancion(fiestaId, {
      invitadoNombre: songNombre.trim(),
      cancion: songCancion.trim(),
      artista: songArtista.trim() || undefined,
    });
    setSendingSong(false);
    if (result.success) {
      toast({ title: '¡Pedido enviado!', description: 'Tu solicitud fue enviada al DJ.' });
      // Refresh to get the new ID
      const freshData = await getEventoEnVivoData(fiestaId);
      setData(freshData);
      // Find the most recent request from this user
      const mine = freshData.solicitudesCanciones
        .filter(s => s.invitadoNombre === songNombre.trim())
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (mine[0]) setMyRequestIds(prev => new Set([...prev, mine[0].id]));
      setSongCancion('');
      setSongArtista('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleMsgSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgAutor.trim() || !msgTexto.trim()) {
      toast({ title: 'Completá los campos', description: 'Nombre y mensaje son obligatorios.', variant: 'destructive' });
      return;
    }
    setSendingMsg(true);
    const result = await addMensajeEnVivo(fiestaId, {
      autor: msgAutor.trim(),
      mensaje: msgTexto.trim(),
    });
    setSendingMsg(false);
    if (result.success) {
      toast({ title: '¡Mensaje enviado!', description: 'Tu mensaje aparecerá en el muro del evento.' });
      setMsgTexto('');
      fetchData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCrmSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!crmNombre.trim() || !crmPhone.trim()) {
      toast({ title: 'Completa los campos', description: 'Nombre y celular son obligatorios.', variant: 'destructive' });
      return;
    }
    setSendingCrm(true);
    const result = await registerGuestLiveInterest(fiestaId, {
      nombre: crmNombre,
      telefono: crmPhone,
      birthdayMonthDay: crmFecha || undefined,
      marketingConsent: crmConsent,
    });
    setSendingCrm(false);
    if (!result.success) {
      toast({ title: 'No se pudo registrar', description: result.error, variant: 'destructive' });
      return;
    }
    setCrmSuccess(true);
    toast({
      title: '¡Participando!',
      description: result.leadSaved
        ? 'Ya participas y guardamos tu permiso para enviarte ideas de AK.'
        : 'Ya participas. Tus datos se usan solo para esta actividad.',
    });
  };

  const handleVotar = async (votacion: VotacionEnVivo, opcionId: string) => {
    if (votadoIds.has(votacion.id)) return;
    setVotadoIds(prev => new Set([...prev, votacion.id]));
    const result = await votarEnVivo(fiestaId, votacion.id, opcionId, guestId || undefined, guestAccessToken || undefined);
    if (result.success) {
      toast({ title: '¡Voto registrado!', description: 'Gracias por participar.' });
      fetchData();
    } else {
      setVotadoIds(prev => { const n = new Set(prev); n.delete(votacion.id); return n; });
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const activeVotaciones = data.votaciones.filter(v => v.activa);

  const sortedMensajes = [...data.mensajes].sort((a, b) => {
    if (a.destacado && !b.destacado) return -1;
    if (!a.destacado && b.destacado) return 1;
    return b.timestamp.localeCompare(a.timestamp);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-950 to-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-purple-950/90 backdrop-blur border-b border-purple-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight truncate max-w-[60vw]">{fiestaName}</h1>
        </div>
        <Badge className="bg-red-600 text-white animate-pulse shrink-0">🔴 En Vivo</Badge>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Tabs defaultValue="fotos">
          <TabsList className="grid grid-cols-5 w-full bg-purple-900/50 mb-4">
            <TabsTrigger value="fotos" className="text-xs data-[state=active]:bg-purple-600">
              <Camera className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="musica" className="text-xs data-[state=active]:bg-purple-600">
              <Music className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Música</span>
            </TabsTrigger>
            <TabsTrigger value="mensajes" className="text-xs data-[state=active]:bg-purple-600">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Mensajes</span>
            </TabsTrigger>
            <TabsTrigger value="votaciones" className="text-xs data-[state=active]:bg-purple-600">
              <Vote className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Votaciones</span>
            </TabsTrigger>
            <TabsTrigger value="sorteo" className="text-xs data-[state=active]:bg-purple-600">
              <Gift className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sorteo</span>
            </TabsTrigger>
          </TabsList>

          {/* FOTOS */}
          <TabsContent value="fotos" className="space-y-4">
            <Card className="bg-purple-900/30 border-purple-700 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📸 Subí tu foto</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFotoSubmit} className="space-y-3">
                  <div>
                    <Label className="text-purple-200 text-sm">Tu nombre *</Label>
                    {guestId ? (
                      <Input disabled placeholder="Tu nombre se agrega automáticamente" className="bg-purple-800/40 border-purple-600 text-purple-300 placeholder:text-purple-300 mt-1 opacity-50" />
                    ) : (
                      <Input
                        value={fotoAutor}
                        onChange={e => setFotoAutor(e.target.value)}
                        placeholder="¿Cómo te llamás?"
                        className="bg-purple-800/40 border-purple-600 text-white placeholder:text-purple-400 mt-1"
                      />
                    )}
                  </div>
                  <div>
                    <Label className="text-purple-200 text-sm">Foto *</Label>
                    <div
                      className="mt-1 border-2 border-dashed border-purple-600 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {fotoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fotoPreview} alt="Preview" className="max-h-40 mx-auto rounded object-contain" />
                      ) : (
                        <div className="text-purple-400 space-y-1">
                          <Upload className="w-8 h-8 mx-auto" />
                          <p className="text-sm">Toca para seleccionar una foto</p>
                          <p className="text-xs">Máximo 2MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div>
                    <Label className="text-purple-200 text-sm">Mensaje (opcional)</Label>
                    <Input
                      value={fotoMensaje}
                      onChange={e => setFotoMensaje(e.target.value)}
                      placeholder="Un mensaje para la foto..."
                      className="bg-purple-800/40 border-purple-600 text-white placeholder:text-purple-400 mt-1"
                    />
                  </div>
                  <Button type="submit" disabled={uploadingFoto} className="w-full bg-purple-600 hover:bg-purple-500">
                    {uploadingFoto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Enviar foto
                  </Button>
                </form>
              </CardContent>
            </Card>

            {data.fotos.length > 0 && (
              <div>
                <p className="text-purple-300 text-sm mb-2">📷 {data.fotos.length} foto{data.fotos.length !== 1 ? 's' : ''} en el álbum</p>
                <div className="grid grid-cols-3 gap-2">
                  {[...data.fotos].reverse().map(foto => (
                    <div key={foto.id} className="relative aspect-square rounded-lg overflow-hidden bg-purple-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={foto.url} alt={foto.mensaje || foto.autor} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-xs text-white truncate">{foto.autor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* MÚSICA */}
          <TabsContent value="musica" className="space-y-4">
            <Card className="bg-purple-900/30 border-purple-700 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">🎵 Pedí tu canción</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSongSubmit} className="space-y-3">
                  <div>
                    <Label className="text-purple-200 text-sm">Tu nombre *</Label>
                    <Input
                      value={songNombre}
                      onChange={e => setSongNombre(e.target.value)}
                      placeholder="¿Cómo te llamás?"
                      className="bg-purple-800/40 border-purple-600 text-white placeholder:text-purple-400 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-purple-200 text-sm">Canción *</Label>
                    <Input
                      value={songCancion}
                      onChange={e => setSongCancion(e.target.value)}
                      placeholder="Nombre de la canción"
                      className="bg-purple-800/40 border-purple-600 text-white placeholder:text-purple-400 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-purple-200 text-sm">Artista (opcional)</Label>
                    <Input
                      value={songArtista}
                      onChange={e => setSongArtista(e.target.value)}
                      placeholder="Nombre del artista"
                      className="bg-purple-800/40 border-purple-600 text-white placeholder:text-purple-400 mt-1"
                    />
                  </div>
                  <Button type="submit" disabled={sendingSong} className="w-full bg-purple-600 hover:bg-purple-500">
                    {sendingSong ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Enviar pedido
                  </Button>
                </form>
              </CardContent>
            </Card>

            {myRequestIds.size > 0 && (
              <div className="space-y-2">
                <p className="text-purple-300 text-sm">Tus pedidos:</p>
                {data.solicitudesCanciones
                  .filter(s => myRequestIds.has(s.id))
                  .map(s => (
                    <div key={s.id} className="bg-purple-900/30 border border-purple-700 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Music className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.cancion}</p>
                        {s.artista && <p className="text-xs text-purple-400 truncate">{s.artista}</p>}
                      </div>
                      <Badge className={`ml-auto shrink-0 text-xs ${s.reproducida ? 'bg-green-700' : 'bg-yellow-700'}`}>
                        {s.reproducida ? '✓ Reproducida' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* MENSAJES */}
          <TabsContent value="mensajes" className="space-y-4">
            <Card className="bg-purple-900/30 border-purple-700 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">💬 Dejá tu mensaje</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMsgSubmit} className="space-y-3">
                  <div>
                    <Label className="text-purple-200 text-sm">Tu nombre *</Label>
                    <Input
                      value={msgAutor}
                      onChange={e => setMsgAutor(e.target.value)}
                      placeholder="¿Cómo te llamás?"
                      className="bg-purple-800/40 border-purple-600 text-white placeholder:text-purple-400 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-purple-200 text-sm">Mensaje *</Label>
                    <Textarea
                      value={msgTexto}
                      onChange={e => setMsgTexto(e.target.value)}
                      placeholder="Escribí tu mensaje para el festejado/a..."
                      rows={3}
                      className="bg-purple-800/40 border-purple-600 text-white placeholder:text-purple-400 mt-1 resize-none"
                    />
                  </div>
                  <Button type="submit" disabled={sendingMsg} className="w-full bg-purple-600 hover:bg-purple-500">
                    {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Enviar mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>

            {sortedMensajes.length > 0 && (
              <div className="space-y-2">
                {sortedMensajes.map(m => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-4 py-3 border ${
                      m.destacado
                        ? 'bg-yellow-900/40 border-yellow-600'
                        : 'bg-purple-900/30 border-purple-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{m.autor}</span>
                      {m.destacado && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <p className="text-sm text-purple-100">{m.mensaje}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* VOTACIONES */}
          <TabsContent value="votaciones" className="space-y-4">
            {activeVotaciones.length === 0 ? (
              <div className="text-center py-12 text-purple-400">
                <Vote className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No hay votaciones activas por el momento.</p>
              </div>
            ) : (
              activeVotaciones.map(v => {
                const totalVotos = v.opciones.reduce((sum, o) => sum + o.votos, 0);
                const yaVote = votadoIds.has(v.id);
                return (
                  <Card key={v.id} className="bg-purple-900/30 border-purple-700 text-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">🗳️ {v.pregunta}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {v.opciones.map(o => {
                        const pct = totalVotos > 0 ? Math.round((o.votos / totalVotos) * 100) : 0;
                        return (
                          <div key={o.id}>
                            {yaVote ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{o.texto}</span>
                                  <span className="text-purple-300">{pct}% ({o.votos})</span>
                                </div>
                                <div className="h-2 bg-purple-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-400 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                className="w-full justify-start border-purple-600 text-white hover:bg-purple-700"
                                onClick={() => handleVotar(v, o.id)}
                              >
                                {o.texto}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      {yaVote && (
                        <p className="text-xs text-purple-400 text-center pt-1">
                          Total de votos: {totalVotos}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* SORTEO (CRM) */}
          <TabsContent value="sorteo" className="space-y-4">
            <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-purple-500/50 text-white shadow-xl shadow-purple-900/20">
              <CardHeader className="text-center pb-2">
                <Gift className="w-12 h-12 text-pink-400 mx-auto mb-2 animate-bounce" />
                <CardTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">¡Sorteo Exclusivo!</CardTitle>
                <p className="text-sm text-purple-200 mt-2">Dejanos tu fecha de cumpleaños para participar por un premio sorpresa hoy mismo, y te regalamos algo para tu próximo cumple.</p>
              </CardHeader>
              <CardContent>
                {crmSuccess ? (
                  <div className="text-center py-6 bg-purple-900/40 rounded-xl border border-purple-500/30">
                    <PartyPopper className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                    <h3 className="font-bold text-lg text-white">¡Ya estás participando!</h3>
                    <p className="text-sm text-purple-200 mt-1">Mucha suerte en el sorteo de hoy.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCrmSubmit} className="space-y-4 mt-2">
                    <div>
                      <Label className="text-purple-200 text-sm">Tu Nombre *</Label>
                      {guestId ? (
                        <Input disabled placeholder="Tu nombre se agrega automáticamente" className="bg-purple-950/60 border-purple-500/50 text-purple-300 mt-1 h-12 rounded-xl opacity-50" />
                      ) : (
                        <Input
                          value={crmNombre}
                          onChange={e => setCrmNombre(e.target.value)}
                          placeholder="Nombre completo"
                          className="bg-purple-950/60 border-purple-500/50 text-white mt-1 h-12 rounded-xl"
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-purple-200 text-sm">Celular para avisarte si ganas *</Label>
                      <Input
                        value={crmPhone}
                        onChange={e => setCrmPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        inputMode="numeric"
                        placeholder="099123456"
                        className="bg-purple-950/60 border-purple-500/50 text-white mt-1 h-12 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-purple-200 text-sm">Fecha de cumpleanos (opcional)</Label>
                      <Input
                        type="date"
                        value={crmFecha}
                        onChange={e => setCrmFecha(e.target.value)}
                        className="bg-purple-950/60 border-purple-500/50 text-white mt-1 h-12 rounded-xl block [color-scheme:dark]"
                      />
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-500/40 bg-purple-950/40 p-3">
                      <Checkbox
                        checked={crmConsent}
                        onCheckedChange={value => setCrmConsent(Boolean(value))}
                        className="mt-0.5"
                      />
                      <span className="text-xs leading-5 text-purple-100">
                        Quiero recibir por WhatsApp ideas, beneficios y simulaciones para mi proximo evento. Participar no depende de aceptar esta opcion.
                      </span>
                    </label>
                    <Button type="submit" disabled={sendingCrm} className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 font-bold text-lg shadow-lg shadow-pink-900/20">
                      {sendingCrm ? <Loader2 className="w-5 h-5 animate-spin" /> : '¡Quiero Participar!'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {fiestaName && <GuestBotWidget fiesta={{ clienteNombre: fiestaName } as any} />}
    </div>
  );
}
