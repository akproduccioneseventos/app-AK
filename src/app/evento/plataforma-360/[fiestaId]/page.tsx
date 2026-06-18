'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Play, CheckCircle, ArrowLeft, Smartphone, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { uploadSocialPost, getSocialPosts } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';

export default function Plataforma360Page() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    setPageUrl(window.location.href);
    getFiestaById(fiestaId).then(setFiesta).catch(() => {});
    loadRecentVideos();
  }, [fiestaId]);

  const loadRecentVideos = async () => {
    try {
      const posts = await getSocialPosts(fiestaId);
      const videos = posts.filter(p => p.sourceModule === 'plataforma360' || p.source === 'plataforma360' || p.imageUrl.endsWith('.mp4')).slice(0, 4);
      setRecentVideos(videos);
    } catch(e) {}
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 60 * 1024 * 1024) {
      alert('El video es muy pesado. Máximo 60MB.');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setShowSuccess(false);

    // Fake progress simulation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 5;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Plataforma 360');
      formData.append('source', 'entertainment');
      formData.append('sourceModule', 'plataforma360');

      const res = await uploadSocialPost(formData);
      
      clearInterval(interval);
      
      if (res.success) {
        setProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setShowSuccess(true);
          loadRecentVideos();
          setTimeout(() => setShowSuccess(false), 3000);
        }, 500);
      } else {
        throw new Error(res.error || 'Error de subida');
      }
    } catch(err) {
      clearInterval(interval);
      setIsUploading(false);
      setProgress(0);
      alert('Hubo un error al subir el video.');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#3b0764_0%,_#09090b_60%)] text-white pb-20 selection:bg-purple-500/30">
      
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => router.push(`/evento/hub/${fiestaId}`)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-purple-300 tracking-widest uppercase">Experiencia 360</p>
        <div className="w-9" />
      </div>

      <div className="max-w-md mx-auto px-4 space-y-10">
        
        {/* HERO */}
        <div className="relative pt-10 pb-4 text-center">
          {/* Animated rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[1px] border-purple-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[1px] border-fuchsia-500/40 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-tr from-purple-600 to-fuchsia-500 rounded-full opacity-20 blur-2xl animate-pulse" />
          
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200">
              ¡Vivilo en 360°!
            </h1>
            <p className="text-purple-200 text-lg">Subí tu boomerang o video 360 al muro del evento</p>
          </div>
        </div>

        {/* UPLOAD SECTION */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-1">¡Video subido!</h2>
                <p className="text-emerald-100/80">Ya está proyectándose en las pantallas</p>
              </motion.div>
            ) : isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-6"
              >
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-purple-200">Subiendo video...</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'tween', ease: 'linear' }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center relative"
              >
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <div className="w-full border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-8 transition-colors flex flex-col items-center bg-purple-500/5 group">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">Toca para grabar</h3>
                  <p className="text-sm text-purple-200/60">Acepta videos o boomerangs (Max 60MB)</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* INFO CARDS */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-blue-50">Grabá con tu celu en modo boomerang o video panorámico</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Play className="w-6 h-6 text-pink-400" />
            </div>
            <p className="text-sm font-medium text-pink-50">Subilo al muro y se proyecta en la pantalla gigante</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-amber-50">¡El DJ puede destacar los mejores en el sorteo!</p>
          </div>
        </div>

        {/* RECENT VIDEOS PREVIEW */}
        {recentVideos.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-center">Últimos videos</h3>
            <div className="grid grid-cols-2 gap-3">
              {recentVideos.map(post => (
                <div key={post.id} className="aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 relative">
                  <video src={post.imageUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 pt-8">
                    <p className="text-xs font-bold truncate">{post.authorName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR CODE */}
        <div className="pt-8 flex flex-col items-center text-center opacity-80">
          <p className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-4">Compartir link</p>
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            {pageUrl && <QRCodeSVG value={pageUrl} size={100} level="M" />}
          </div>
        </div>

      </div>
      <KioskUnlockButton />
    </div>
  );
}
