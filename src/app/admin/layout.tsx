import { AuthGuard } from '../auth-guard';

/**
 * Estas cuatro pantallas (finanzas, ventas, carga de historicos y asistente)
 * quedaron fuera del grupo `(app)`, que es donde vive la guardia de sesion. Sin
 * este archivo entraban sin control real:
 *
 * El middleware protege todo lo que no este en la lista publica, pero **solo
 * comprueba que exista la cookie de sesion, no que sea valida** — no puede leer
 * el secreto para verificar la firma. Quien valida de verdad es `AuthGuard`, en
 * el navegador. Como estas pantallas no lo tenian, alcanzaba con inventarse una
 * cookie con ese nombre para abrir `/admin/finanzas` y ver la plata de todas las
 * fiestas, o `/admin/ventas` y mover el embudo.
 *
 * Las funciones que traen las fiestas no piden sesion a proposito, porque las
 * usan tambien las pantallas del invitado: por eso el candado va aca y no ahi.
 *
 * Va solo la guardia, sin el marco de navegacion: estas pantallas ya venian sin
 * el y se veian bien asi. Agregarselo cambiaria como se ven sin necesidad.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
