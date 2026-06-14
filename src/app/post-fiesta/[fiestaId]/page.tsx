import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowRight, 
  Camera, 
  Heart, 
  MessageCircle, 
  PartyPopper, 
  Share2, 
  Sparkles, 
  Star,
  Download,
  Video,
  Play,
  FolderDown,
  ExternalLink,
  Info
} from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getSocialPosts } from '@/app/actions/social-gallery';
import { getDedications } from '@/app/actions/social-interactive';
import { getContractedDownloads } from '@/lib/experience-ak/post-event-utils';
import { buildUltimateEventSystem } from '@/lib/experience-ak/ultimate-event-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type PageProps = {
  params: {
    fiestaId: string;
  };
};

function isVideoPost(post: any) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

export default async function PostFiestaPage({ params }: PageProps) {
  const fiesta = await getFiestaById(params.fiestaId);
  if (!fiesta) notFound();

  const [posts, dedications] = await Promise.all([
    getSocialPosts(params.fiestaId),
    getDedications(params.fiestaId),
  ]);

  const report = buildUltimateEventSystem(fiesta);
  const eventName = fiesta.configuracion?.nombreEvento || 'Fiesta AK';
  const customAlbumUrl = fiesta.galeriaUrl || 'https://wfolio.com/my/disk';
  const feedbackUrl = `/feedback/${encodeURIComponent(fiesta.id)}`;
  const downloads = getContractedDownloads(fiesta);

  // Compute stats
  const totalPhotos = posts.filter(p => !isVideoPost(p) && p.sourceModule !== 'fotocabina').length;
  const totalVideos = posts.filter(p => isVideoPost(p) && p.sourceModule !== 'plataforma360').length;
  const total360 = posts.filter(p => p.sourceModule === 'plataforma360' || p.source === 'plataforma360').length;
  const totalFotocabina = posts.filter(p => p.sourceModule === 'fotocabina').length;
  const audioDeds = dedications.filter(d => !!d.audioUrl);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/20">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-slate-900 px-6 py-20 text-white sm:px-12">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,#6366f1_0%,transparent_30%),radial-gradient(circle_at_80%_10%,#4f46e5_0%,transparent_25%)]" />
        <div className="relative mx-auto max-w-5xl space-y-6">
          <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-full px-3 py-1 font-semibold text-xs border-none">
            Recuerdos Premium AK
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200">
            {eventName}
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300">
            Gracias por celebrar con nosotros. Esta página reúne todos los recuerdos interactivos, fotos, audios de dedicatorias y el cierre oficial de tu experiencia digital.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="rounded-xl bg-indigo-600 font-bold hover:bg-indigo-700 h-11 text-white shadow-lg shadow-indigo-500/10">
              <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Ir a Google Drive / Wfolio
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-white/20 bg-white/5 font-bold text-white hover:bg-white hover:text-slate-900 h-11 backdrop-blur-md">
              <Link href={feedbackUrl}>
                <Star className="mr-2 h-4 w-4" /> Dejar testimonio
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Grid of Key Features */}
      <section className="mx-auto max-w-5xl px-6 py-10 sm:px-12 grid gap-6 md:grid-cols-3">
        {[
          { icon: Heart, title: 'Momentos en Pantalla', text: 'Todas las fotos, videos y recuerdos que subieron tus invitados recopilados.' },
          { icon: MessageCircle, title: 'Buzón de Audios', text: 'Escuchá y descargá las dedicatorias y mensajes de voz privados de tus invitados.' },
          { icon: Share2, title: 'Compartir Carpeta', text: 'Facilidad de acceso a wfolio y Google Drive para descargas masivas de alta calidad.' },
        ].map((item) => (
          <Card key={item.title} className="rounded-3xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black text-slate-800">{item.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main Memory Download Hub */}
      <section className="mx-auto max-w-5xl px-6 pb-12 sm:px-12 space-y-6">
        <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
          <CardHeader className="p-6 sm:p-8">
            <div className="flex gap-2 items-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
              <p className="text-xs font-black uppercase tracking-widest">Memory Hub del Evento</p>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 mt-2">Descarga de Recuerdos Digitales</CardTitle>
            <CardDescription className="text-sm">Descargá el material de la fiesta compilado externamente para cuidar tu consumo de datos de Firebase.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              
              {/* Fotos del Muro */}
              {downloads.invitadoPhotos && (
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Fotos de Invitados</p>
                      <p className="text-xs text-slate-400">{totalPhotos} fotos en total</p>
                    </div>
                  </div>
                  <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-xl font-bold border-slate-200 hover:border-indigo-200">
                      Descargar
                    </Button>
                  </a>
                </div>
              )}

              {/* Videos del Muro */}
              {downloads.videos && totalVideos > 0 && (
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Videos de Invitados</p>
                      <p className="text-xs text-slate-400">{totalVideos} clips de video</p>
                    </div>
                  </div>
                  <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-xl font-bold border-slate-200 hover:border-indigo-200">
                      Descargar
                    </Button>
                  </a>
                </div>
              )}

              {/* Plataforma 360 */}
              {downloads.plataforma360 && (
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Plataforma 360°</p>
                      <p className="text-xs text-slate-400">{total360} videos procesados</p>
                    </div>
                  </div>
                  <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-xl font-bold border-slate-200 hover:border-indigo-200">
                      Descargar
                    </Button>
                  </a>
                </div>
              )}

              {/* Fotocabina */}
              {downloads.fotocabina && (
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FolderDown className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Fotos de Fotocabina</p>
                      <p className="text-xs text-slate-400">{totalFotocabina} retratos en total</p>
                    </div>
                  </div>
                  <a href={customAlbumUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-xl font-bold border-slate-200 hover:border-indigo-200">
                      Descargar
                    </Button>
                  </a>
                </div>
              )}

            </div>

            {/* Audio Voice Messages */}
            {downloads.recuerdosAudio && audioDeds.length > 0 && (
              <div className="pt-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Mensajes de Voz Grabados ({audioDeds.length})</h3>
                <div className="grid gap-3 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
                  {audioDeds.map(ded => (
                    <div key={ded.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{ded.authorName}</span>
                        <span className="text-slate-400">
                          {new Date(ded.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      {ded.message && ded.message !== "🎙️ Mensaje de voz" && (
                        <p className="text-[11px] text-slate-500 italic">"{ded.message}"</p>
                      )}
                      {ded.audioUrl && (
                        <div className="flex items-center gap-2">
                          <audio src={ded.audioUrl} controls className="h-6 flex-1 outline-none" />
                          <a href={ded.audioUrl} download={`audio-${ded.authorName}-${ded.id}.webm`}>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-slate-500 hover:text-indigo-600">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Notice */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start mt-4">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tus archivos multimedia y carpetas de descarga están vinculadas directamente a Google Drive o wfolio, asegurando que puedas guardar tu material completo y en alta resolución sin sobrecargas de datos en la plataforma.
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Post-event Plan summary */}
        <Card className="rounded-[2.5rem] border-slate-100 bg-slate-100/50">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                  <p className="text-xs font-black uppercase tracking-widest">Plan Post-Fiesta Automático</p>
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Pasos para el cierre de tu experiencia digital</h2>
              </div>
              <Button asChild variant="outline" className="rounded-xl bg-white font-bold border-slate-200 hover:bg-slate-50">
                <Link href={`/q/${encodeURIComponent(fiesta.id)}`}>
                  QR del Evento <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {report.postEventPlan.map((item, index) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Paso {index + 1}</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-10 text-center text-xs text-slate-400">
        <PartyPopper className="mx-auto mb-3 h-6 w-6 text-indigo-500" />
        <p>Experiencia digital premium creada por AK Producciones.</p>
      </footer>
    </main>
  );
}
