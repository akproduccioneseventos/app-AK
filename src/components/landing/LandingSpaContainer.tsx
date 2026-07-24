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
  blog: ReactNode;
  video: ReactNode;
  testimonials: ReactNode;
  faq: ReactNode;
  cta: ReactNode;
  footer: ReactNode;
  floatingActions: ReactNode;
  winSech: ReactNode;
}
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
    <div className="min-h-screen bg-white text-slate-950 selection:bg-red-700 selection:text-white">
      {" "}
      <motion.div
        style={{ scaleX: progressScale }}
        className="fixed left-0 top-0 z-[70] h-1 w-full origin-left bg-red-600"
      />{" "}
{" "}
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
