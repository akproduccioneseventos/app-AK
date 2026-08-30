import Link from 'next/link';
import { Sparkles, MessageCircle, Clock, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Mantenimiento Programado | AK Producciones',
  description: 'Estamos realizando tareas de mantenimiento para mejorar la plataforma. Escribinos por WhatsApp si tenés consultas urgentes.',
};

export default function MantenimientoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Estamos en mantenimiento
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Estamos aplicando mejoras y actualizaciones en la plataforma. Volvemos en unos minutos.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-3">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            ¿Tenés alguna consulta urgente sobre tu fiesta?
          </p>
          <a
            href="https://wa.me/59898355530?text=Hola%20AK%20Producciones,%20quer%C3%ADa%20hacerles%20una%20consulta%20mientras%20la%20web%20est%C3%A1%20en%20mantenimiento."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-all shadow-lg text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Escribinos por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
