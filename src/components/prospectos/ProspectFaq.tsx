import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export function ProspectFaq() {
  const faqs = [
    {
      q: '¿Con cuánto tiempo de anticipación debo reservar?',
      a: 'Recomendamos reservar con al menos 6 a 12 meses de anticipación para asegurar la fecha de tu evento, especialmente en temporada alta (noviembre a marzo).',
    },
    {
      q: '¿Tengo que encargarme de contratar proveedores por separado?',
      a: '¡No! En AK Producciones te ofrecemos un servicio integral "Llave en mano". Nosotros coordinamos el catering, la técnica, el salón, la barra de tragos y más, para que tú solo disfrutes.',
    },
    {
      q: '¿Qué es el Portal de Invitados interactivo?',
      a: 'Es una web personalizada para tu fiesta donde tus invitados reciben su invitación, confirman asistencia, sugieren canciones al DJ y pueden ver el dress code y ubicación.',
    },
    {
      q: '¿Puedo armar un presupuesto a mi medida?',
      a: '¡Por supuesto! Utilizando nuestros simuladores (en este mismo portal) puedes agregar o quitar servicios y ver el costo estimado en tiempo real. Luego lo ajustamos a tus necesidades exactas.',
    },
  ];

  return (
    <section className="py-12 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white">Preguntas Frecuentes</h2>
        <p className="text-slate-400 mt-2">Todo lo que necesitas saber antes de empezar a planificar.</p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="bg-white/5 border border-white/10 rounded-2xl px-6">
            <AccordionTrigger className="text-left font-bold text-lg text-white hover:text-amber-400 py-6 hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-300 text-base leading-relaxed pb-6">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
