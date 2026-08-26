"use client";

import { Fragment, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

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
  blog: ReactNode;
  video: ReactNode;
  testimonials: ReactNode;
  faq: ReactNode;
  cta: ReactNode;
  footer: ReactNode;
  floatingActions: ReactNode;
  winSech: ReactNode;
}

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
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.25,
  });

  const dashboardSection = (
    key: string,
    children: ReactNode,
    justify: "center" | "between" = "center",
  ) => {
    if (!children) return null;
    return (
      <section
        id={`landing-${key}`}
        key={key}
        className={`relative w-full scroll-mt-20 ${justify === "between" ? "md:flex md:min-h-screen md:flex-col md:justify-between" : ""}`}
      >
        <div className="contents">{children}</div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-red-700 selection:text-white">
      <motion.div
        style={{ scaleX: progressScale }}
        className="fixed left-0 top-0 z-[70] h-1 w-full origin-left bg-red-600"
      />
      <div className="ak-landing-experience">
        {/* Bloque 1: Bienvenida e Impacto */}
        {dashboardSection("hero", hero)}

        {/* Bloque 2: Propuesta de Valor */}
        {dashboardSection(
          "difference",
          <Fragment>
            {difference}
            {stats}
          </Fragment>,
        )}

        {/* Bloque 3: Lo Que Hacemos */}
        {dashboardSection("services", services)}

        {/* Bloque 4: Innovación y Tecnología */}
        {dashboardSection("technology", technology)}

        {/* Bloque 5: Lugar de Celebración */}
        {dashboardSection("salon", salon)}

        {/* Bloque 6: Cómo Trabajamos */}
        {dashboardSection(
          "team-process",
          <Fragment>
            {team}
            {process}
          </Fragment>,
        )}

        {/* Bloque 7: Pruebas y Experiencia Real */}
        {dashboardSection("gallery", gallery)}

        {/* Bloque 8: Contenido y Recursos */}
        {dashboardSection(
          "blog-video",
          <Fragment>
            {video}
            {blog}
          </Fragment>,
        )}

        {/* Bloque 9: Confianza y Cierre */}
        {dashboardSection(
          "testimonials-faq",
          <Fragment>
            {testimonials}
            {faq}
          </Fragment>,
        )}

        {/* Bloque 10: Llamado a la Acción y Contacto */}
        {dashboardSection(
          "cta-footer",
          <Fragment>
            {cta}
            {footer}
          </Fragment>,
          "between",
        )}

        {/* Acciones flotantes */}
        {floatingActions}
        {winSech}
      </div>
    </div>
  );
}
