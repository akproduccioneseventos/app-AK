'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Facebook,
  Link as LinkIcon,
  ChevronRight,
  Plus,
  Loader2,
  X,
  CheckCircle,
} from 'lucide-react';
import { blogPosts, type BlogPost, type BlogCategory } from '@/data/blog-posts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const CATEGORIES: { label: string; value: BlogCategory | 'Todos' }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Organización', value: 'Organizacion' },
  { label: 'Presupuesto', value: 'Presupuesto' },
  { label: 'Catering', value: 'Catering' },
  { label: 'XV Años', value: 'XV anos' },
  { label: 'Bodas', value: 'Bodas' },
  { label: 'Checklists', value: 'Checklists' },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'Todos'>('Todos');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedPost, setImportedPost] = useState<BlogPost | null>(null);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'Todos') return blogPosts;
    return blogPosts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facebookUrl) return;
    setImporting(true);
    // Simulate AI parsing of the Facebook post for SEO optimization
    setTimeout(() => {
      setImporting(false);
      const simulatedSlug = 'evento-exitoso-salto-uruguay';
      const mockPost: BlogPost = {
        slug: simulatedSlug,
        title: 'Claves de un evento exitoso en Salto, Uruguay',
        excerpt: 'Sincronizado e inspirado de tu última publicación de Facebook. Optimizamos el contenido para SEO local.',
        category: 'Organizacion',
        readTime: '3 min',
        publishedAt: new Date().toISOString().split('T')[0],
        accent: 'from-blue-600 to-indigo-950',
        icon: Sparkles,
        takeaway: 'La organización local y los detalles del catering son indispensables en el litoral.',
        sections: [
          {
            heading: 'La diferencia está en la planificación coordinada',
            body: [
              'Tomado directamente de las redes: en AK Producciones nos encargamos de que cada detalle de decoración y pista de baile esté 100% sincronizado.',
              'No te preocupes por coordinar 10 proveedores por separado. Nosotros te entregamos la fiesta lista para disfrutar.',
            ],
          },
        ],
        checklist: [
          'Verificar salón disponible en Salto.',
          'Coordinar catering integral con anticipación.',
          'Revisar los requerimientos de la pantalla LED.',
        ],
      };
      setImportedPost(mockPost);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white font-sans">
      {/* Decorative Blur Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute bottom-10 left-10 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[150px]" />
      </div>

      {/* Header / Nav */}
      <header className="relative border-b border-white/10 backdrop-blur-md bg-slate-950/40 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
              AK PRODUCCIONES
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Importar de Facebook
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white font-bold"><Link href="/">
                Volver
              </Link></Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-16 z-10">
        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <BookOpen className="h-3.5 w-3.5" />
            Blog Comercial & SEO
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            Inspiración y Guías para tu Fiesta
          </h1>
          <p className="text-white/60 text-lg md:text-xl">
            Consejos de expertos, listas de verificación y tendencias para organizar bodas, cumpleaños de XV y corporativos sin estrés en Salto, Uruguay.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200
                ${
                  selectedCategory === cat.value
                    ? 'bg-white border-white text-slate-950 shadow-lg shadow-white/10 scale-105'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post, idx) => {
              const Icon = post.icon || BookOpen;
              return (
                <motion.div
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                >
                  <Link href={`/blog/${post.slug}`} className="block h-full group">
                    <Card className="h-full border border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col">
                      <div className={`h-2.5 bg-gradient-to-r ${post.accent || 'from-indigo-500 to-purple-600'}`} />
                      <CardHeader className="p-6 pb-2">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                            {post.category}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Clock className="h-3 w-3" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors leading-tight line-clamp-2">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-2 pb-6 flex-1 flex flex-col justify-between">
                        <p className="text-sm text-white/60 leading-relaxed line-clamp-3 mb-6">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                          <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{post.publishedAt}</span>
                          </div>
                          <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all">
                            Leer más
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
            <BookOpen className="h-12 w-12 mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-black">No hay artículos disponibles</h3>
            <p className="text-white/45 text-sm mt-1">Elegí otra categoría o importá uno nuevo de Facebook.</p>
          </div>
        )}
      </main>

      {/* Facebook Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Blur accent */}
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" />

              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedPost(null);
                  setFacebookUrl('');
                }}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Facebook className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-black">Importador de Facebook (SEO local)</h2>
              </div>
              <p className="text-xs text-white/60 mb-6 leading-relaxed">
                Pegá el enlace de tu publicación de Facebook de AK Producciones. Nuestra IA optimizará el contenido y lo formateará como un post de blog estructurado para mejorar el posicionamiento en buscadores de Salto.
              </p>

              {!importedPost ? (
                <form onSubmit={handleImport} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
                      Enlace de la publicación
                    </label>
                    <Input
                      type="url"
                      required
                      placeholder="https://www.facebook.com/akproduccioneseventos/posts/..."
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30 h-11 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={importing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Optimizando SEO local...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generar Artículo Optimizado
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 flex gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-emerald-300">¡Artículo generado con éxito!</p>
                      <p className="text-xs text-emerald-400/80 mt-0.5">Listo para indexar en Google (Salto, Uruguay).</p>
                    </div>
                  </div>

                  <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      {importedPost.category}
                    </span>
                    <h4 className="font-black text-white mt-1 leading-snug">{importedPost.title}</h4>
                    <p className="text-xs text-white/50 mt-2 leading-relaxed">{importedPost.excerpt}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      asChild
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-11 rounded-xl"
                    >
                      <Link
                        href={`/blog/${importedPost.slug}`}
                        onClick={() => setIsImportModalOpen(false)}
                        className="flex-1 flex items-center justify-center"
                      >
                        Ver Artículo
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportedPost(null);
                        setFacebookUrl('');
                      }}
                      className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold h-11 rounded-xl"
                    >
                      Importar otro
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
