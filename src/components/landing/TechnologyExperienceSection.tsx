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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/simulador-de-presupuesto"
                className="inline-flex h-12 items-center justify-center rounded-md bg-red-700 px-6 text-sm font-bold text-white transition-colors hover:bg-red-800"
              >
                Armar presupuesto
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Consultar por WhatsApp sobre tecnología AK (abre en nueva ventana)"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 text-sm font-bold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                <MessageSquare className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                Consultar
              </a>
            </div>
          </motion.div>

          <motion.figure
            {...reveal}
            className="relative min-h-[360px] overflow-hidden rounded-2xl bg-zinc-900 sm:min-h-[470px]"
          >
            <Image
              src="/media/catalogo-servicios/tecnologia_fiesta.png"
              alt="Tecnología interactiva durante una fiesta de AK Producciones"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 text-sm font-bold text-white sm:p-8 sm:text-base">
              Invitación QR, participación en vivo y portal del evento
              conectados.
            </figcaption>
          </motion.figure>
        </div>

        <motion.div
          {...reveal}
          className="mt-14 grid border-y border-slate-200 sm:grid-cols-3"
        >
          {TECH_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`py-7 sm:px-7 ${index > 0 ? "border-t border-slate-200 sm:border-l sm:border-t-0" : ""}`}
              >
                <Icon className="h-6 w-6 text-red-400" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
