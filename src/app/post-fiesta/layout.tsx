/**
 * Los recuerdos post-fiesta los abre el cliente con la sesión del portal (o el equipo).
 * La verificación de acceso se hace en `src/app/post-fiesta/[fiestaId]/page.tsx`.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
