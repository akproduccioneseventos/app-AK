import type { CrmAppointment } from '@/types/crm';
import { buildGoogleCalendarTemplateUrl } from '@/lib/google-workspace';

export function buildWhatsAppReminderUrl(appointment: CrmAppointment): string {
  const phoneClean = appointment.clienteContacto.replace(/\D/g, '');
  const phoneUruguay = phoneClean.startsWith('598') ? phoneClean : `598${phoneClean.replace(/^0/, '')}`;

  const dateObj = new Date(appointment.fechaHora);
  const fechaFormatted = dateObj.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  const horaFormatted = dateObj.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

  const text = `¡Hola ${appointment.clienteNombre}! 👋 Te escribimos de *AK Producciones*. Te recordamos nuestra reunión agendada para el *${fechaFormatted}* a las *${horaFormatted} hs* ${appointment.lugar ? `en ${appointment.lugar}` : ''} para coordinar todos los detalles de tu evento. ¡Te esperamos! ✨`;

  return `https://wa.me/${phoneUruguay}?text=${encodeURIComponent(text)}`;
}

export function buildGoogleCalendarAppointmentUrl(appointment: CrmAppointment): string {
  const start = new Date(appointment.fechaHora);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hr appointment
  return buildGoogleCalendarTemplateUrl({
    summary: `Reunión AK Producciones - ${appointment.clienteNombre} (${appointment.eventoTipo || 'Cita Comercial'})`,
    description: `Cita agendada con ${appointment.clienteNombre}.\nContacto: ${appointment.clienteContacto}\nTipo: ${appointment.eventoTipo || 'Entrevista'}\nNotas: ${appointment.notas || 'Sin notas'}`,
    location: appointment.lugar || 'Oficina AK Producciones Salto',
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  });
}

export function buildGmailAppointmentInviteUrl(appointment: CrmAppointment): string {
  const dateObj = new Date(appointment.fechaHora);
  const fechaFormatted = dateObj.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  const horaFormatted = dateObj.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

  const subject = `Confirmación de Cita - AK Producciones (${appointment.clienteNombre})`;
  const body = `Hola ${appointment.clienteNombre},\n\nTe confirmamos tu cita con el equipo de AK Producciones:\n\n📅 Fecha: ${fechaFormatted}\n⏰ Hora: ${horaFormatted} hs\n📍 Lugar: ${appointment.lugar || 'Oficina AK Producciones Salto'}\n🎉 Tipo de evento: ${appointment.eventoTipo || 'Fiesta'}\n\nEn la reunión repasaremos el presupuesto, la tecnología y todas las ideas para tu gran día.\n\n¡Nos vemos pronto!\nEquipo AK Producciones\nWhatsApp: 098 355 530`;

  const targetEmail = appointment.clienteContacto.includes('@') ? appointment.clienteContacto : '';

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
