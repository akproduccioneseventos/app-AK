'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

interface LandingSpaContainerProps {
  hero: ReactNode;
  stats: ReactNode;
  difference: ReactNode;
  services: ReactNode;
  technology: ReactNode;
  salon: ReactNode;
  team: ReactNode;
  process: ReactNode;
  gallery: ReactNode;
  instagram: ReactNode;
  blog: ReactNode;
  video: ReactNode;
  testimonials: ReactNode;
  faq: ReactNode;
  cta: ReactNode;
  footer: ReactNode;
  floatingActions: ReactNode;
  winSech: ReactNode;
}

const NAV_ITEMS = [
  ['hero', 'Inicio'],
  ['services', 'Servicios'],
  ['technology', 'Tecnología'],
  ['gallery', 'Galería'],
  ['blog-video', 'Blog'],
  ['cta-footer', 'Contacto'],
] as const;

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
  instagram,
  blog,
  video,
  testimonials,
  faq,
  cta,
  footer,
  floatingActions,
  winSech,
}: LandingSpaContainerProps) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.25 });

  const revealProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

  const scrollToSection = (key: string) => {
    const element = document.getElementById(`landing-${key}`);
    element?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const dashboardSection = (
    key: string,
    children: ReactNode,
    justify: 'center' | 'between' = 'center'
  ) => (
    <motion.section
      id={`landing-${key}`}
      key={key}
      {...revealProps}
      className={`w-full relative ${
        justify === 'between' ? 'md:flex md:min-h-screen md:flex-col md:justify-between' : ''
      }`}
    >
      {children}
    </motion.section>
  );

  return (
    <div className="min-h-screen text-white selection:bg-indigo-600 selection:text-white">
      <motion.div
        style={{ scaleX: progressScale }}
        className="fixed left-0 top-0 z-[70] h-1 w-full origin-left bg-indigo-500"
      />

      <nav className="fixed right-4 top-1/2 z-[60] hidden -translate-y-1/2 flex-col gap-2 rounded-lg border border-white/10 bg-zinc-950/78 p-2 shadow-xl shadow-black/25 backdrop-blur-md xl:flex">
        {NAV_ITEMS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => scrollToSection(key)}
            className="group flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-wider text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            title={label}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 transition-all group-hover:w-5 group-hover:bg-indigo-300" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all group-hover:max-w-24">{label}</span>
          </button>
        ))}
      </nav>

      <motion.div
        key="landing-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="ak-landing-experience"
      >
        {dashboardSection('hero', <>{hero}{stats}</>, 'between')}
        {dashboardSection('difference', difference)}
        {dashboardSection('services', services)}
        {dashboardSection('technology', technology)}
        {dashboardSection('salon', salon)}
        {dashboardSection('team-process',
          <div className="w-full">
            {team}
            {process}
          </div>
        )}
        {dashboardSection('gallery', gallery)}
        {instagram && dashboardSection('instagram', instagram)}
        {dashboardSection('blog-video',
          <div className="w-full">
            {blog}
            {video}
          </div>
        )}
        {dashboardSection('testimonials-faq',
          <div className="w-full">
            {testimonials}
            {faq}
          </div>
        )}
        {dashboardSection('cta-footer', <>{cta}{footer}</>, 'between')}
      </motion.div>

      {floatingActions}
      {winSech}
    </div>
  );
}
