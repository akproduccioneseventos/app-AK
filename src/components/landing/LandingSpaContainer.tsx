"use client";
import type { ReactNode } from "react";
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
  ["hero", "Inicio"],
  ["services", "Servicios"],
  ["technology", "Tecnología"],
  ["gallery", "Galería"],
  ["blog-video", "Blog"],
  ["cta-footer", "Contacto"],
] as const;
const DEFERRED_SECTIONS = new Set(["difference", "team-process", "cta-footer"]);
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
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.25,
  });
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
    element?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };
  const dashboardSection = (
    key: string,
    children: ReactNode,
    justify: "center" | "between" = "center",
  ) => {
    if (!children) return null;
    return (
      <motion.section
        id={`landing-${key}`}
        key={key}
        {...revealProps}
        className={`relative w-full scroll-mt-20 ${DEFERRED_SECTIONS.has(key) ? "ak-deferred-section" : ""} ${justify === "between" ? "md:flex md:min-h-screen md:flex-col md:justify-between" : ""}`}
      >
        {" "}
        {children}{" "}
      </motion.section>
    );
  };
  return (
    <div className="min-h-screen text-white selection:bg-red-700 selection:text-white">
      {" "}
      <motion.div
        style={{ scaleX: progressScale }}
        className="fixed left-0 top-0 z-[70] h-1 w-full origin-left bg-red-600"
      />{" "}
      <nav className="hidden">
        {" "}
        {NAV_ITEMS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => scrollToSection(key)}
            className="group flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-wider text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            title={label}
          >
            {" "}
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 transition-all group-hover:w-5 group-hover:bg-red-400" />{" "}
            <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all group-hover:max-w-24">
              {label}
            </span>{" "}
          </button>
        ))}{" "}
      </nav>{" "}
      <motion.div
        key="landing-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="ak-landing-experience"
      >
        {" "}
        {dashboardSection(
          "hero",
          <>
            {hero}
            {stats}
          </>,
          "between",
        )}{" "}
        {dashboardSection("difference", difference)}{" "}
        {dashboardSection("services", services)}{" "}
        {dashboardSection("technology", technology)}{" "}
        {dashboardSection("salon", salon)}{" "}
        {dashboardSection(
          "team-process",
          team || process ? (
            <div className="w-full">
              {" "}
              {team} {process}{" "}
            </div>
          ) : null,
        )}{" "}
        {dashboardSection("gallery", gallery)}{" "}
        {instagram && dashboardSection("instagram", instagram)}{" "}
        {dashboardSection(
          "blog-video",
          blog || video ? (
            <div className="w-full">
              {" "}
              {blog} {video}{" "}
            </div>
          ) : null,
        )}{" "}
        {dashboardSection(
          "testimonials-faq",
          testimonials || faq ? (
            <div className="w-full">
              {" "}
              {testimonials} {faq}{" "}
            </div>
          ) : null,
        )}{" "}
        {dashboardSection(
          "cta-footer",
          <>
            {cta}
            {footer}
          </>,
          "between",
        )}{" "}
      </motion.div>{" "}
      {floatingActions} {winSech}{" "}
    </div>
  );
}
