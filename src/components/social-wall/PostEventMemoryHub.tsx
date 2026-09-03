'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera,
  Play,
  Volume2,
  Download,
  ExternalLink,
  Heart,
  MessageSquare,
  Sparkles,
  Music,
  FolderDown,
  Video,
  PartyPopper,
  Info,
  Share2,
  Check,
  MessageCircle
} from 'lucide-react';
import type { SocialGalleryPost, Dedication } from '@/types/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { getContractedDownloads } from '@/lib/experience-ak/post-event-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SUAVE, DURACION } from '@/lib/motion';

interface PostEventMemoryHubProps {
  fiesta: PublicSocialEvent;
  posts: SocialGalleryPost[];
  dedications: Dedication[];
}

function isVideoPost(post: SocialGalleryPost) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

/**
 * A donde va cada boton "Descargar" de las tarjetas del evento.
 *
 * **Va a la galeria publica de la fiesta, filtrada por estacion.** No a la
 * descarga interna `/api/fiestas/[fiestaId]/download-recuerdos`, que **pide
 * sesion de administrador** y le contestaria "no autorizado" al cliente.
 *
 * Y NO va al album del fotografo: ese es otro material -el trabajo editado- y
 * tiene su propia tarjeta mas abajo. Confundirlos fue justo el error que se
 * arreglo el 2 de septiembre de 2026: las cuatro tarjetas de la fiesta
 * apuntaban al album profesional, asi que **sin ese enlace cargado el cliente
 * veia "247 fotos compartidas en vivo" y ningun boton**, y con el enlace
 * cargado el boton lo llevaba al material equivocado.
 */
function enlaceALaGaleria(fiestaId: string, estacion?: string) {
  const base = `/evento/galeria/${fiestaId}`;
  return estacion ? `${base}?estacion=${estacion}` : base;
}

export default function PostEventMemoryHub({ fiesta, posts, dedications }: PostEventMemoryHubProps) {
  const downloads = getContractedDownloads(fiesta);
  const [copied, setCopied] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadedAll, setDownloadedAll] = useState(false);

  // Calculate statistics
  const totalPhotos = posts.filter(p => !isVideoPost(p) && p.sourceModule !== 'fotocabina').length;
  const totalVideos = posts.filter(p => isVideoPost(p) && p.sourceModule !== 'plataforma360').length;
  const total360 = posts.filter(p => p.sourceModule === 'plataforma360' || p.source === 'plataforma360').length;
  const totalFotocabina = posts.filter(p => p.sourceModule === 'fotocabina').length;
  const audioDeds = dedications.filter(d => !!d.audioUrl);
  const totalRecuerdos = totalPhotos + totalFotocabina + totalVideos + total360;

  // Estimación de peso para que el usuario decida si espera al Wi-Fi
  const pesoEstimado = totalRecuerdos > 0
    ? totalRecuerdos * 3.8 >= 1024
      ? `${(totalRecuerdos * 3.8 / 1024).toFixed(1)} GB`
      : `${Math.round(totalRecuerdos * 3.8)} MB`
    : '0 MB';

  const customAlbumUrl = fiesta.galeriaUrl?.trim() || '';
  const hayAlbumProfesional = customAlbumUrl.length > 0;
  const eventName = fiesta.configuracion?.nombreEvento || 'Nuestra Fiesta';

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadAll = () => {
    setDownloadingAll(true);
    setTimeout(() => {
      setDownloadingAll(false);
      setDownloadedAll(true);
      if (typeof window !== 'undefined') {
        window.location.href = enlaceALaGaleria(fiesta.id);
      }
      setTimeout(() => setDownloadedAll(false), 3500);
    }, 900);
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-4 space-y-8 text-slate-950">
      {/* Welcome / Header - Visible de entrada sin delay según Bloque 1 */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-indigo-50 rounded-2xl text-indigo-600 animate-pulse">
          <PartyPopper className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">¡Gracias por acompañarnos!</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
          La fiesta ha terminado, pero los recuerdos se quedan para siempre. Aquí podés revivir los momentos más divertidos del evento.
        </p>
      </div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURACION.entrar, ease: SUAVE }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="bg-white border border-slate-100 p-3 rounded-2xl text-center shadow-sm">
          <p className="text-2xl font-black text-indigo-600">{totalPhotos + totalFotocabina}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Fotos</p>
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-2xl text-center shadow-sm">
          <p className="text-2xl font-black text-indigo-600">{totalVideos + total360}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Videos</p>
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-2xl text-center shadow-sm">
          <p className="text-2xl font-black text-indigo-600">{audioDeds.length}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Mensajes Voz</p>
        </div>
      </motion.div>

      {/* Botón principal único según Bloque 1: Ver todas tus fotos */}
      <div>
        <a href={enlaceALaGaleria(fiesta.id)} className="block">
          <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]">
            <Camera className="w-4 h-4 mr-2" />
            Ver todas tus fotos
          </Button>
        </a>
      </div>

      {/* Compartir recuerdos en un toque con feedback visual */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: DURACION.entrar, ease: SUAVE }}
        className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900">Compartir recuerdos</h3>
            <p className="text-xs text-slate-500 mt-0.5">Compartí el panel con tu familia y amigos</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="rounded-xl border-slate-200 font-bold text-xs h-11 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                Enlace copiado
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-1.5 text-slate-600" />
                Copiar enlace
              </>
            )}
          </Button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(`¡Mirá las fotos y recuerdos de ${eventName}! ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-11 transition-all"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              WhatsApp
            </Button>
          </a>
        </div>
      </motion.div>

      {/* Descarga completa con aviso de peso antes de descargar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: DURACION.entrar, ease: SUAVE }}
        className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Descarga completa</p>
            <p className="font-black text-sm text-slate-900">{totalRecuerdos} recuerdos ({pesoEstimado})</p>
            <p className="text-xs text-slate-500">Conviene conectarte a Wi-Fi para descargar todo.</p>
          </div>
          <div className="p-2.5 bg-white rounded-2xl shadow-sm text-indigo-600 shrink-0">
            <Download className="w-5 h-5" />
          </div>
        </div>

        <Button
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11 shadow-sm transition-all"
        >
          {downloadingAll ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-bounce" />
              Preparando descarga...
            </>
          ) : downloadedAll ? (
            <>
              <Check className="w-4 h-4 mr-2 text-emerald-300" />
              ¡Listo! Abriendo descargas
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Descargar todo ({totalRecuerdos} archivos, {pesoEstimado})
            </>
          )}
        </Button>
      </motion.div>

      {/* Album Digital Direct Link Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: DURACION.entrar, ease: SUAVE }}
      >
        <Card className="border-indigo-100 bg-indigo-50/50 rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-sm text-slate-900">Álbum Digital Oficial</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Accedé al material en alta resolución de fotografía y video completo a través de wfolio / Google Drive.
                </p>
              </div>
            </div>
            {hayAlbumProfesional ? (
              <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11 shadow-md">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ir al Álbum Digital
                </Button>
              </a>
            ) : (
              <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
                El fotógrafo todavía está editando el material. Apenas esté listo, el enlace
                aparece acá.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Contracted Downloads Sections */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Descargas del Evento</h2>

        {/* 1. Fotos de Invitados */}
        {downloads.invitadoPhotos && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: DURACION.entrar, ease: SUAVE }}
          >
            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Fotos de los Invitados</p>
                    <p className="text-xs text-slate-400 truncate">{totalPhotos} fotos compartidas en vivo</p>
                  </div>
                </div>
                <a href={enlaceALaGaleria(fiesta.id, 'invitados')}>
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Ver y descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 2. Videos */}
        {downloads.videos && totalVideos > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: DURACION.entrar, ease: SUAVE }}
          >
            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Videos del Evento</p>
                    <p className="text-xs text-slate-400 truncate">{totalVideos} clips de video subidos</p>
                  </div>
                </div>
                <a href={enlaceALaGaleria(fiesta.id)}>
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Ver y descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 3. Plataforma 360 */}
        {downloads.plataforma360 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: DURACION.entrar, ease: SUAVE }}
          >
            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Plataforma 360°</p>
                    <p className="text-xs text-slate-400 truncate">{total360} videos grabados en vivo</p>
                  </div>
                </div>
                <a href={enlaceALaGaleria(fiesta.id, '360')}>
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Ver y descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 4. Fotocabina */}
        {downloads.fotocabina && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: DURACION.entrar, ease: SUAVE }}
          >
            <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <FolderDown className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Fotocabina con Marcos</p>
                    <p className="text-xs text-slate-400 truncate">{totalFotocabina} retratos guardados</p>
                  </div>
                </div>
                <a href={enlaceALaGaleria(fiesta.id, 'fotocabina')}>
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Ver y descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Audio Dedications List */}
      {downloads.recuerdosAudio && audioDeds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: DURACION.entrar, ease: SUAVE }}
          className="space-y-4"
        >
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Mensajes del Buzón de Voz 🎙️</h2>
          <div className="space-y-3">
            {audioDeds.map((ded) => (
              <Card key={ded.id} className="rounded-2xl border-slate-100 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-800">{ded.authorName}</p>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(ded.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  {ded.message && ded.message !== "🎙️ Mensaje de voz" && (
                    <p className="text-xs text-slate-500 leading-relaxed italic">&ldquo;{ded.message}&rdquo;</p>
                  )}
                  {ded.audioUrl && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <audio src={ded.audioUrl} controls className="h-8 flex-1 max-w-full outline-none" />
                      <a href={ded.audioUrl} download={`dedicacion-${ded.authorName}-${ded.id}.webm`} className="shrink-0">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-500 hover:text-indigo-600">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info footer about drive link config */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: DURACION.entrar, ease: SUAVE }}
        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start"
      >
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Para optimizar la descarga de archivos grandes, las carpetas de descarga dirigen directamente al servicio de almacenamiento contratado por el organizador.
        </p>
      </motion.div>

      {/* Pie discreto Hecho por AK Producciones */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: DURACION.entrar, ease: SUAVE }}
        className="pt-6 pb-2 text-center"
      >
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 font-medium"
        >
          Hecho por AK Producciones
        </Link>
      </motion.div>
    </div>
  );
}
