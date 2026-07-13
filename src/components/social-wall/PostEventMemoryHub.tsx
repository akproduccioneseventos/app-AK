'use client';

import React from 'react';
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
  Info
} from 'lucide-react';
import type { SocialGalleryPost, Dedication } from '@/types/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { getContractedDownloads } from '@/lib/experience-ak/post-event-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PostEventMemoryHubProps {
  fiesta: PublicSocialEvent;
  posts: SocialGalleryPost[];
  dedications: Dedication[];
}

function isVideoPost(post: SocialGalleryPost) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

export default function PostEventMemoryHub({ fiesta, posts, dedications }: PostEventMemoryHubProps) {
  const downloads = getContractedDownloads(fiesta);
  
  // Calculate statistics
  const totalPhotos = posts.filter(p => !isVideoPost(p) && p.sourceModule !== 'fotocabina').length;
  const totalVideos = posts.filter(p => isVideoPost(p) && p.sourceModule !== 'plataforma360').length;
  const total360 = posts.filter(p => p.sourceModule === 'plataforma360' || p.source === 'plataforma360').length;
  const totalFotocabina = posts.filter(p => p.sourceModule === 'fotocabina').length;
  const audioDeds = dedications.filter(d => !!d.audioUrl);
  const textDeds = dedications.filter(d => !d.audioUrl);

  const customAlbumUrl = fiesta.galeriaUrl || 'https://wfolio.com/my/disk';
  const eventName = fiesta.configuracion?.nombreEvento || 'Nuestra Fiesta';

  return (
    <div className="w-full max-w-lg mx-auto py-8 px-4 space-y-8 text-slate-950">
      {/* Welcome / Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex p-3 bg-indigo-50 rounded-2xl text-indigo-600 animate-pulse">
          <PartyPopper className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">¡Gracias por acompañarnos!</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
          La fiesta ha terminado, pero los recuerdos se quedan para siempre. Aquí podés revivir los momentos más divertidos del evento.
        </p>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
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

      {/* Album Digital Direct Link Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
            <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold h-11 shadow-md">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir al Álbum Digital
              </Button>
            </a>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contracted Downloads Sections */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Descargas del Evento</h2>

        {/* 1. Fotos de Invitados */}
        {downloads.invitadoPhotos && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
                <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 2. Videos */}
        {downloads.videos && totalVideos > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
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
                <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 3. Plataforma 360 */}
        {downloads.plataforma360 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
                <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 4. Fotocabina */}
        {downloads.fotocabina && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
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
                <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Audio Dedications List (Direct Download allowed here) */}
      {downloads.recuerdosAudio && audioDeds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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
                    <p className="text-xs text-slate-500 leading-relaxed italic">"{ded.message}"</p>
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
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Para evitar cargos adicionales y optimizar la descarga de archivos grandes, las carpetas de descarga dirigen directamente al servicio de Google Drive / Wfolio contratado por el organizador.
        </p>
      </div>
    </div>
  );
}
