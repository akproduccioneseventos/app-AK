'use client';

import { motion } from 'framer-motion';
import { Check, ShoppingCart, MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { sharedFAQs } from '@/data/event-catalogs/shared';
import { cn } from '@/lib/utils';
import type { CompanyInfo } from '@/types/settings';
import type { ServicioEmpresa } from '@/types/empresa';

const WHATSAPP_NUMBER = '59898355530';

function isSafeEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

interface CierreSlideProps {
  companyInfo: CompanyInfo;
  selectedServices: string[];
  servicios: ServicioEmpresa[];
  selectedMenuId: string | null;
  menus: { id: string; name: string }[];
  tipoFiesta: string;
  clientData: { nombre: string; fechaEvento: string };
  onGenerateBudget: () => void;
}

export function CierreSlide({
  companyInfo,
  selectedServices,
  servicios,
  selectedMenuId,
  menus,
  tipoFiesta,
  clientData,
  onGenerateBudget,
}: CierreSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  const safeEmail = isSafeEmail(companyInfo.companyContact) ? companyInfo.companyContact : null;
  const waMessage = clientData.nombre
    ? `¡Hola AK Producciones! Estuve viendo sus servicios y me gustaría solicitar un presupuesto para ${tipoFiesta || 'mi evento'} de ${clientData.nombre}.`
    : '¡Hola AK Producciones! Estuve viendo sus servicios y me gustaría solicitar un presupuesto personalizado.';
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  const selectedServiciosData = selectedServices.map(id => servicios.find(s => s.id === id)).filter(Boolean) as ServicioEmpresa[];
  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <p className={`text-transparent bg-clip-text bg-gradient-to-r ${contenido.colorAcento} font-bold uppercase tracking-widest text-sm mb-2`}>
            ¡Estamos listos!
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-3">
            Siguiente paso 🚀
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {contenido.mensajeCierre}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Selected services summary */}
            {selectedServiciosData.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Servicios seleccionados</p>
                <div className="flex flex-wrap gap-2">
                  {selectedServiciosData.map(s => (
                    <span
                      key={s.id}
                      className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-sm border border-emerald-400/30 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      {s.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Selected menu */}
            {selectedMenu && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Menú seleccionado</p>
                <p className="text-white font-bold">{selectedMenu.name}</p>
              </div>
            )}

            {/* No selection */}
            {selectedServiciosData.length === 0 && !selectedMenu && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/50 text-sm text-center">
                  Podés generar el presupuesto y completar los detalles después.
                </p>
              </div>
            )}

            {/* Image placeholder */}
            <ImagePlaceholder
              id="cierre-foto"
              label="Foto emocional de un evento exitoso"
              aspectRatio="16/9"
            />
          </motion.div>

          {/* Right: CTAs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-4"
          >
            {/* Main CTA */}
            <motion.button
              onClick={onGenerateBudget}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full py-5 rounded-2xl text-xl font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3',
                `bg-gradient-to-r ${contenido.colorAcento}`,
              )}
            >
              <ShoppingCart className="h-6 w-6" />
              Generar Presupuesto Personalizado
            </motion.button>

            <p className="text-white/40 text-xs text-center">
              Se va a pre-llenar con los servicios que seleccionaste.
            </p>

            {/* Contact options */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-400/30 rounded-2xl px-4 py-4 transition-colors"
              >
                <MessageCircle className="h-7 w-7 text-emerald-300" />
                <span className="text-white font-semibold text-sm">WhatsApp</span>
                <span className="text-white/50 text-xs">Consultar ahora</span>
              </a>

              {safeEmail ? (
                <a
                  href={`mailto:${safeEmail}`}
                  className="flex flex-col items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-400/30 rounded-2xl px-4 py-4 transition-colors"
                >
                  <Mail className="h-7 w-7 text-indigo-300" />
                  <span className="text-white font-semibold text-sm">Email</span>
                  <span className="text-white/50 text-xs truncate w-full text-center">{safeEmail}</span>
                </a>
              ) : (
                <div className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-4">
                  <Phone className="h-7 w-7 text-white/40" />
                  <span className="text-white/60 font-semibold text-sm">Teléfono</span>
                  <span className="text-white/30 text-xs">{companyInfo.companyContact || 'Consultanos'}</span>
                </div>
              )}
            </div>

            {/* Company info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-white font-bold text-base">{companyInfo.companyName || 'AK Producciones'}</p>
              {companyInfo.companyAddress && (
                <p className="text-white/50 text-sm mt-1">{companyInfo.companyAddress}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* FAQs */}
        {sharedFAQs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <p className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
              <HelpCircle className="h-4 w-4" />
              Preguntas frecuentes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sharedFAQs.slice(0, 4).map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl"
                >
                  <p className="text-white/90 text-xs font-bold mb-1">{faq.question}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </SlideLayout>
  );
}
