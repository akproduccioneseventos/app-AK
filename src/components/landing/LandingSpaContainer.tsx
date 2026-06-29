'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface LandingSpaContainerProps {
  hero: React.ReactNode;
  stats: React.ReactNode;
  difference: React.ReactNode;
  services: React.ReactNode;
  technology: React.ReactNode;
  salon: React.ReactNode;
  team: React.ReactNode;
  process: React.ReactNode;
  gallery: React.ReactNode;
  blog: React.ReactNode;
  video: React.ReactNode;
  testimonials: React.ReactNode;
  faq: React.ReactNode;
  cta: React.ReactNode;
  footer: React.ReactNode;
  floatingActions: React.ReactNode;
  winSech: React.ReactNode;
}

const SECTION_LABELS: Record<string, string> = {
  servicios: 'Servicios Integrales',
  tecnologia: 'Tecnología Interactiva',
  salon: 'Salón Club Uruguay',
  galeria: 'Galería de Recuerdos',
  blog: 'Blog & Consejos SEO',
  testimonios: 'Casos de Éxito Reales',
  faq: 'Preguntas Frecuentes',
};

export function LandingSpaContainer({
  hero,
  stats,
  difference,
  services,
  technology,
  salon,
  team,
  process,
  gallery,
  blog,
  video,
  testimonials,
  faq,
  cta,
  footer,
  floatingActions,
  winSech,
}: LandingSpaContainerProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Scroll to top when active section changes to make navigation clean
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const renderSectionHeader = () => {
    if (!activeSection) return null;
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">AK Producciones</span>
          <span className="text-zinc-600">/</span>
          <h2 className="text-sm font-black uppercase tracking-wider text-white font-headline">
            {SECTION_LABELS[activeSection]}
          </h2>
        </div>
        <button
          onClick={() => setActiveSection(null)}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 hover:border-white/20 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 text-indigo-400" />
          Volver al Inicio
        </button>
      </header>
    );
  };

  const wrapWithExpander = (sectionId: string, label: string, component: React.ReactNode) => {
    return (
      <div className="relative group/section w-full">
        {component}
        <div className="absolute bottom-6 right-6 z-30 md:opacity-0 md:group-hover/section:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setActiveSection(sectionId)}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 shadow-xl shadow-indigo-900/30 hover:scale-105 transition-all pointer-events-auto active:scale-95 border border-indigo-500/30"
          >
            <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
            Ver {label} Completo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-650 selection:text-white">
      {renderSectionHeader()}

      <AnimatePresence mode="wait">
        {!activeSection ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ak-landing-experience md:h-screen md:overflow-y-auto md:snap-y md:snap-mandatory md:scroll-smooth bg-zinc-950"
          >
            {/* Slide 1: Hero & Stats */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-between relative">
              {hero}
              {stats}
            </div>

            {/* Slide 2: Diferenciales */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              {difference}
            </div>

            {/* Slide 3: Servicios */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              {wrapWithExpander('servicios', 'servicios', services)}
            </div>

            {/* Slide 4: Tecnología */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              {wrapWithExpander('tecnologia', 'tecnología', technology)}
            </div>

            {/* Slide 5: Salón Club Uruguay */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              {wrapWithExpander('salon', 'salón', salon)}
            </div>

            {/* Slide 6: Equipo & Proceso */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              <div className="w-full">
                {team}
                {process}
              </div>
            </div>

            {/* Slide 7: Galería Interactiva */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              {wrapWithExpander('galeria', 'galería', gallery)}
            </div>

            {/* Slide 8: Blog y Videos */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              <div className="w-full">
                {wrapWithExpander('blog', 'blog', blog)}
                {video}
              </div>
            </div>

            {/* Slide 9: Testimonios & FAQ */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-center relative">
              <div className="w-full">
                {wrapWithExpander('testimonios', 'testimonios', testimonials)}
                {wrapWithExpander('faq', 'FAQ', faq)}
              </div>
            </div>

            {/* Slide 10: CTA & Footer */}
            <div className="w-full md:snap-start md:min-h-screen md:flex md:flex-col md:justify-between relative">
              {cta}
              {footer}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="focused-section"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="pt-24 min-h-screen bg-zinc-950 w-full flex flex-col justify-between"
          >
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {activeSection === 'servicios' && services}
              {activeSection === 'tecnologia' && technology}
              {activeSection === 'salon' && salon}
              {activeSection === 'galeria' && gallery}
              {activeSection === 'blog' && (
                <div className="space-y-12">
                  {blog}
                  {video}
                </div>
              )}
              {activeSection === 'testimonios' && testimonials}
              {activeSection === 'faq' && faq}
            </main>

            {/* In focused mode we still render the footer at the bottom */}
            {footer}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent global layout overlays */}
      {floatingActions}
      {winSech}
    </div>
  );
}
