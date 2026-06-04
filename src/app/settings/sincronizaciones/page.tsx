'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Share2,
  ExternalLink,
  Zap,
  AlertCircle,
} from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

interface FeatureItem {
  text: string;
}

interface IntegrationCardProps {
  index: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  features: FeatureItem[];
  badgeLabel: string;
  badgeColor: 'amber' | 'blue';
  buttonLabel: string;
  buttonHref: string;
  note: string;
}

function IntegrationCard({
  index,
  icon,
  title,
  subtitle,
  features,
  badgeLabel,
  badgeColor,
  buttonLabel,
  buttonHref,
  note,
}: IntegrationCardProps) {
  const badgeClasses =
    badgeColor === 'amber'
      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30';

  const buttonClasses =
    badgeColor === 'amber'
      ? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500'
      : 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-500';

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 flex flex-col gap-6 shadow-xl"
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 border border-white/10 shadow-inner shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${badgeClasses}`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {badgeLabel}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/10" />

      {/* Feature list */}
      <ul className="flex flex-col gap-3">
        {features.map((f, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-sm text-slate-300">{f.text}</span>
          </li>
        ))}
      </ul>

      {/* Action button */}
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href={buttonHref}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${buttonClasses}`}
        >
          <ExternalLink className="h-4 w-4" />
          {buttonLabel}
        </Link>
        <p className="text-center text-xs text-slate-500">{note}</p>
      </div>
    </motion.div>
  );
}

export default function SincronizacionesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10"
        >
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Configuración
          </Link>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 tracking-wide uppercase">
            <Zap className="h-3.5 w-3.5" />
            Integraciones &amp; Automatizaciones
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Centro de Activación de Integraciones
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
            Conectá tus servicios externos para automatizar flujos de trabajo,
            notificaciones y comunicación con clientes y equipo.
          </p>
        </motion.div>

        {/* Integration cards */}
        <div className="flex flex-col gap-8">

          {/* Card 1: Google Workspace */}
          <IntegrationCard
            index={0}
            icon={<Calendar className="h-7 w-7 text-indigo-300" />}
            title="Google Calendar & Gmail"
            subtitle="Sincronización de eventos y correos de recuperación"
            features={[
              { text: 'Las fiestas se agendan automáticamente en Google Calendar' },
              { text: 'El personal recibe el evento en su calendario personal' },
              { text: 'Se pueden enviar correos de recuperación de contraseña' },
              { text: 'Notificaciones de evento por email al equipo asignado' },
            ]}
            badgeLabel="Requiere configuración"
            badgeColor="amber"
            buttonLabel="Conectar Google Account"
            buttonHref="/settings/google-workspace"
            note="Necesitás iniciar sesión con la cuenta Google de AK Producciones"
          />

          {/* Card 2: WhatsApp Business */}
          <IntegrationCard
            index={1}
            icon={<MessageCircle className="h-7 w-7 text-emerald-300" />}
            title="WhatsApp Business Bot"
            subtitle="Bot automático, CRM y atención 24/7"
            features={[
              { text: 'Responde automáticamente consultas de presupuesto y disponibilidad' },
              { text: 'Crea prospectos en el CRM cuando alguien escribe por primera vez' },
              { text: 'Notifica al equipo cuando una consulta necesita atención humana' },
              { text: 'Envía recordatorios programados de pagos y reuniones' },
            ]}
            badgeLabel="Requiere API Key de Meta"
            badgeColor="amber"
            buttonLabel="Configurar WhatsApp Business"
            buttonHref="/settings/whatsapp-business"
            note="Necesitás una cuenta Meta for Developers con el número habilitado"
          />

          {/* Card 3: Instagram & TikTok */}
          <IntegrationCard
            index={2}
            icon={<Share2 className="h-7 w-7 text-sky-300" />}
            title="Instagram & TikTok"
            subtitle="Redirecciones a perfiles de la productora"
            features={[
              { text: 'Los invitados pueden acceder a tu perfil desde el portal del evento' },
              { text: 'Los clientes ven el enlace en su portal de cliente' },
            ]}
            badgeLabel="Activo — Solo redirección"
            badgeColor="blue"
            buttonLabel="Configurar redes sociales"
            buttonHref="/settings/social-connections"
            note="No requiere API. Solo configura las URLs de tus perfiles."
          />
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-14 text-center text-xs text-slate-600"
        >
          Las integraciones se guardan de forma segura y pueden desconectarse en cualquier momento desde esta página.
        </motion.p>
      </div>
    </div>
  );
}
