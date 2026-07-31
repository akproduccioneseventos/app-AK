'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaForPortalSession, initializePortalSession } from '@/app/actions/fiesta/portal.actions';
import { getSocialPosts } from '@/app/actions/social-gallery';
import { getDedications } from '@/app/actions/social-interactive';
import { getContractedDownloads } from '@/lib/experience-ak/post-event-utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { SocialGalleryPost, Dedication } from '@/types/social-gallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ArrowLeft, 
  AlertTriangle, 
  ExternalLink,
  Camera,
  Play,
  Volume2,
  Download,
  Info,
  Sparkles,
  FolderDown,
  Video,
  PartyPopper
} from 'lucide-react';

const SESSION_KEY_PREFIX = 'portal_auth_';

const estadoLabel: Record<string, { label: string; cls: string }> = {
  'Pendiente':          { label: 'Pendiente',          cls: 'bg-slate-100 text-slate-600' },
  'En edición':         { label: 'En edición',         cls: 'bg-blue-100 text-blue-700' },
  'En revisión':        { label: 'En revisión',        cls: 'bg-amber-100 text-amber-700' },
  'Entregado parcial':  { label: 'Entregado parcial',  cls: 'bg-green-100 text-green-700' },
  'Entregado completo': { label: 'Entregado completo', cls: 'bg-green-100 text-green-700' },
};

function isVideoPost(post: SocialGalleryPost) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

export default function FotosVideoPortalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [dedications, setDedications] = useState<Dedication[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessKey = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!accessKey) { 
      sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId); 
      router.replace(`/portal-cliente/${fiestaId}`); 
      return; 
    }
    
    Promise.all([
      initializePortalSession(fiestaId, accessKey).then(session => session.success ? getFiestaForPortalSession(fiestaId) : null),
      getSocialPosts(fiestaId).catch(() => []),
      getDedications(fiestaId).catch(() => [])
    ])
      .then(([fiestaData, postsData, dedsData]) => {
        if (!fiestaData) { 
          sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId);
          setError('La sesión del portal venció o no corresponde a este evento.');
          return; 
        }
        setFiesta(fiestaData);
        setPosts(postsData || []);
        setDedications(dedsData || []);
      })
      .catch(() => setError('No se pudo cargar la información del evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId, router]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error ?? 'Error al cargar.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  const servicios = fiesta.fotografiaYFilmacion?.servicios ?? [];
  const notes = fiesta.fotografiaYFilmacion?.notasGenerales;
  const downloads = getContractedDownloads(fiesta);

  // Stats
  const totalPhotos = posts.filter(p => !isVideoPost(p) && p.sourceModule !== 'fotocabina').length;
  const totalVideos = posts.filter(p => isVideoPost(p) && p.sourceModule !== 'plataforma360').length;
  const total360 = posts.filter(p => p.sourceModule === 'plataforma360' || p.source === 'plataforma360').length;
  const totalFotocabina = posts.filter(p => p.sourceModule === 'fotocabina').length;
  const audioDeds = dedications.filter(d => !!d.audioUrl);

  const customAlbumUrl = fiesta.galeriaUrl || 'https://wfolio.com/my/disk';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">📸 Fotos & Video</p>
            <p className="text-xs text-slate-500">{fiesta.configuracion?.nombreEvento}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">📸 Recuerdos & Entregables</h1>
          <p className="text-slate-500 text-sm mt-1">Accedé a todo el material digital de tu fiesta</p>
        </div>

        {/* --- DOCK DE DESCARGA DIRECTA / DRIVE FALLBACK --- */}
        <Card className="border-purple-100 bg-purple-50/40 rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-sm text-slate-900">Álbum Digital Oficial</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Para optimizar la calidad de descarga en alta resolución sin compresión, todo el material fotográfico de tu fiesta está disponible en tu galería digital oficial.
                </p>
              </div>
            </div>
            <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold h-11 shadow-md">
                <ExternalLink className="w-4 h-4 mr-2" />
                Acceder al Álbum Digital Oficial
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* --- MATERIAL SOCIAL CONTRATADO --- */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Recuerdos Sociales de Invitados</h2>

          {/* Fotos Muro */}
          {downloads.invitadoPhotos && (
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Fotos de los Invitados</p>
                    <p className="text-xs text-slate-400 truncate">{totalPhotos} fotos compartidas en el muro</p>
                  </div>
                </div>
                <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Videos Muro */}
          {downloads.videos && totalVideos > 0 && (
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Videos del Muro</p>
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
          )}

          {/* Plataforma 360 */}
          {downloads.plataforma360 && (
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Plataforma 360°</p>
                    <p className="text-xs text-slate-400 truncate">{total360} videos 360 grabados</p>
                  </div>
                </div>
                <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold shrink-0">
                    <Download className="w-4 h-4 mr-1.5" /> Descargar
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Fotocabina */}
          {downloads.fotocabina && (
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                    <FolderDown className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">Fotocabina</p>
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
          )}
        </div>

        {/* --- DEDICATORIAS / AUDIOS DEL BUZÓN --- */}
        {downloads.recuerdosAudio && audioDeds.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Dedicatorias & Audios de Recuerdos 🎙️</h2>
            <div className="space-y-3">
              {audioDeds.map(ded => (
                <Card key={ded.id} className="rounded-2xl border-slate-100 shadow-sm bg-white">
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
                        <a href={ded.audioUrl} download={`audio-${ded.authorName}-${ded.id}.webm`} className="shrink-0">
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-500 hover:text-purple-600">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- ENTREGAS FORMALES DE FOTOGRAFÍA & FILMACIÓN --- */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Servicios de Fotografía & Filmación Oficial</h2>
          {servicios.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500 text-sm">
                <p>Aún no hay servicios de fotografía o filmación oficiales registrados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {servicios.map(servicio => {
                const cfg = estadoLabel[servicio.estado] ?? { label: servicio.estado, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <Card key={servicio.id} className="rounded-2xl border-slate-100 shadow-sm">
                    <CardHeader className="pb-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base font-black text-slate-900">{servicio.nombre}</CardTitle>
                        <Badge className={`text-xs ${cfg.cls}`}>{cfg.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2 text-sm text-slate-600">
                      {servicio.fechaEntregaEstimada && (
                        <p>📅 Entrega estimada: {new Date(servicio.fechaEntregaEstimada).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      )}
                      {servicio.notas && <p className="text-slate-500">{servicio.notas}</p>}
                      {servicio.linkEntrega && (
                        <a href={servicio.linkEntrega} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 mt-1">
                            <ExternalLink className="w-4 h-4 mr-1.5" /> Descargar archivos oficiales
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {notes && (
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-black">📝 Notas Generales</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-slate-600">{notes}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
