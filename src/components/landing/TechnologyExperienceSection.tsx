"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Ticket,
} from "lucide-react";
import { AK_WHATSAPP_NUMBER } from "@/lib/public-contact";

interface TechnologyExperienceSectionProps {
  whatsappNumber?: string;
}

const TECH_FEATURES = [
  {
    icon: Smartphone,
    title: "Portal del cliente",
    description:
      "Presupuesto, acuerdos, tareas y decisiones del evento en un mismo lugar.",
  },
  {
    icon: Ticket,
    title: "Invitación digital",
    description:
      "Confirmación de asistencia, mapa, información útil y acceso mediante QR.",
  },
  {
    icon: LayoutDashboard,
    title: "Experiencia en vivo",
    description:
      "Fotos y dedicatorias de los invitados visibles durante la celebración.",
  },
] as const;

export default function TechnologyExperienceSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
}: TechnologyExperienceSectionProps) {
  const reduceMotion = useReducedMotion();
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hola, me interesa conocer la tecnología para clientes e invitados de AK Producciones.",
  )}`;
  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.55, ease: "easeOut" as const },
      };

  return (
    <section
      id="tecnologia"
      className="border-y border-slate-200 bg-white py-20 text-slate-950 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <motion.div {...reveal} className="max-w-xl text-left">
            <p className="text-xs font-black uppercase tracking-widest text-red-400">
              Tecnología útil
            </p>
            <h2 className="mt-4 font-headline text-4xl font-black leading-tight sm:text-5xl">
              Menos coordinación. Más experiencia.
            </h2>
            <p className="mt-5 text-base font-medium leading-7 text-slate-600 sm:text-lg">
              La tecnología acompaña la fiesta sin convertirse en una
              complicación. El cliente organiza mejor y los invitados participan
              desde el celular con una experiencia simple y privada.
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.025, y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link
                  href="/simulador-de-presupuesto"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-700 px-7 text-sm font-black text-white shadow-md shadow-red-950/20 transition-colors hover:bg-red-800"
                >
                  Armar presupuesto
                </Link>
              </motion.div>
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.025, y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Consultar por WhatsApp sobre tecnología AK (abre en nueva ventana)"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Consultar
                </a>
              </motion.div>
            </div>
          </motion.div>

          <motion.figure
            {...reveal}
            whileHover={reduceMotion ? undefined : { scale: 1.015 }}
            transition={{ duration: 0.4 }}
            className="relative min-h-[360px] overflow-hidden rounded-3xl bg-zinc-900 shadow-xl sm:min-h-[470px]"
          >
            <Image
              src="/media/catalogo-servicios/tecnologia_fiesta.png"
              alt="Tecnología interactiva durante una fiesta de AK Producciones"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 text-sm font-bold text-white sm:p-8 sm:text-base">
              Invitación QR, participación en vivo y portal del evento conectados.
            </figcaption>
          </motion.figure>
        </div>

        <motion.div
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-40px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
          className="mt-14 grid gap-4 sm:grid-cols-3"
        >
          {TECH_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                variants={reduceMotion ? undefined : {
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
                className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 p-7 transition-all hover:border-red-300 hover:bg-white hover:shadow-lg"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100/80 text-red-700 transition-colors group-hover:bg-red-700 group-hover:text-white">
                  <Icon className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
