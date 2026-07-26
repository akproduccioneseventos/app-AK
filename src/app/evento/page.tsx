import { redirect } from 'next/navigation';

/**
 * The generic event route is an internal convenience entry point. Public links
 * must always identify an event explicitly so one client's event is never
 * selected or disclosed to another visitor.
 */
export default function EventoRedirectPage() {
  redirect('/eventos');
}
