'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CLIENT_PRELOADED_FAQS = [
  {
    id: 'c_faq_1',
    question: '¿Hasta cuándo puedo modificar el menú o la cantidad de invitados?',
    answer: 'Podés ajustar la cantidad de invitados y las preferencias de menú hasta 15 días antes de la fecha del evento. Esto nos permite coordinar las compras de suministros con la máxima frescura.',
  },
  {
    id: 'c_faq_2',
    question: '¿Cómo funciona la entrega de la música para el DJ?',
    answer: 'En el módulo "Música" de tu portal podés agregar las canciones infaltables y las que preferís que no suenen. Tu lista se sincroniza en tiempo real con el DJ del evento.',
  },
  {
    id: 'c_faq_3',
    question: '¿Cómo acceden mis invitados a la invitación digital y muro social?',
    answer: 'Desde tu portal tenés los enlaces directos y el código QR de tu evento. Podés compartirlo por WhatsApp a tus invitados para que confirmen asistencia y suban fotos.',
  },
  {
    id: 'c_faq_4',
    question: '¿Cuándo se realiza la reunión final de coordinación?',
    answer: 'Aproximadamente 10 días antes del evento coordinamos la reunión final donde repasamos el cronograma exacto, minutos clave (ingreso, vals, brindis) y detalles técnicos.',
  },
  {
    id: 'c_faq_5',
    question: '¿Cómo gestiono los pagos o cuotas restantes?',
    answer: 'El saldo restante del evento se abona en las cuotas pactadas hasta 5 días hábiles antes de la fecha. Podés solicitar tu recibo o consultar el estado de tu cuenta directamente por WhatsApp.',
  },
];

export default function PortalFaqPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [userQuestions, setUserQuestions] = useState<Array<{ q: string; status: string }>>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const qText = newQuestion.trim();
    if (!qText) return;
    setIsSubmitting(true);
    try {
      const { addChatMessage } = await import('@/app/actions/social-gallery');
      const fiestaId = params.id;
      await addChatMessage(fiestaId, `❓ Consulta de Cliente: ${qText}`, 'Cliente VIP Portal');
      setUserQuestions(prev => [...prev, { q: qText, status: 'Enviada al equipo' }]);
      setNewQuestion('');
      toast({
        title: '✅ Consulta enviada',
        description: 'Tu pregunta fue recibida por nuestro equipo. Te responderemos a la brevedad.',
      });
    } catch {
      toast({
        title: 'Error al enviar',
        description: 'No se pudo enviar la consulta. Verificá tu conexión e intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="rounded-xl font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Portal
          </Button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Portal de Clientes</span>
        </div>

        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-red-900 to-slate-900 text-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">Preguntas Frecuentes</CardTitle>
                <p className="text-xs text-slate-300 mt-1">Guía práctica y respuestas para organizar tu evento con AK Producciones</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Dudas habituales de clientes</h3>
              <div className="space-y-3">
                {CLIENT_PRELOADED_FAQS.map((faq, idx) => {
                  const isOpen = openIdx === idx;
                  return (
                    <div key={faq.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all">
                      <button
                        onClick={() => setOpenIdx(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-800 text-sm hover:bg-slate-50 transition"
                      >
                        <span>{faq.question}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-red-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {userQuestions.length > 0 && (
              <div className="space-y-3 border-t pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Tus consultas enviadas</h3>
                <div className="space-y-2">
                  {userQuestions.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">{item.q}</p>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-red-600" /> ¿Tenés otra consulta específica?
              </h3>
              <form onSubmit={handleAskQuestion} className="space-y-3">
                <Textarea
                  placeholder="Escribí tu pregunta sobre tu evento..."
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs min-h-20"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !newQuestion.trim()}
                  className="bg-red-700 hover:bg-red-800 text-white font-black text-xs uppercase tracking-wider rounded-xl h-10 px-6"
                >
                  Enviar consulta
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
