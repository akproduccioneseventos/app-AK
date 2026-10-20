"use client";

import { Fragment, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

interface LandingSpaContainerProps {
  hero: ReactNode;
  stats?: ReactNode;
  difference: ReactNode;
  services: ReactNode;
  technology: ReactNode;
  salon: ReactNode;
  team?: ReactNode;
  process?: ReactNode;
  gallery: ReactNode;
  blog?: ReactNode;
  video?: ReactNode;
  testimonials: ReactNode;
  faq: ReactNode;
  cta: ReactNode;
  footer: ReactNode;
  floatingActions?: ReactNode;
  winSech?: ReactNode;
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
        {/* Bloque 1: Hero + verificador de fecha */}
        {dashboardSection("hero", hero)}

        {/* Bloque 2: Tipos de evento */}
        {dashboardSection("services", services)}

        {/* Bloque 3: Tranquilidad + trayectoria + equipo */}
        {dashboardSection(
          "difference",
          <Fragment>
            {difference}
            {stats}
            {team}
            {process}
          </Fragment>,
        )}

        {/* Bloque 4: Salón Club Uruguay con ficha técnica */}
        {dashboardSection("salon", salon)}

        {/* Bloque 5: Ecosistema tecnológico unificado */}
        {dashboardSection("technology", technology)}

        {/* Bloque 6: Galería unificada (fotos, videos y video-testimonios) */}
        {dashboardSection(
          "gallery",
          <Fragment>
            {gallery}
            {video}
          </Fragment>,
        )}

        {/* Bloque 7: Prueba social + método en 3 pasos */}
        {dashboardSection(
          "testimonials",
          <Fragment>
            <div id="landing-testimonials-faq" className="contents">
              {testimonials}
            </div>
          </Fragment>,
        )}

        {/* Bloque 8: Preguntas frecuentes + guías (un solo carrusel) */}
        {dashboardSection(
          "faq",
          <Fragment>
            {faq}
            <div id="landing-blog" className="contents">
              {blog}
            </div>
          </Fragment>,
        )}

        {/* Bloque 9: Cierre (simulador, calendario y pie de página) */}
        {dashboardSection(
          "cta",
          <Fragment>
            <div id="landing-cta-footer" className="contents">
              {cta}
              {footer}
            </div>
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
