import { AuthGuard } from '../auth-guard';

/**
 * Pantalla del equipo: muestra que persona del equipo trabaja en que fiesta.
 *
 * Vive fuera del grupo `(app)`, que es donde esta la guardia de sesion, asi que
 * la lleva propia. **No alcanza con el middleware**: ese solo comprueba que la
 * cookie exista, no que sea valida —no puede leer el secreto para verificar la
 * firma— y quien valida de verdad es `AuthGuard`, en el navegador. Sin este
 * archivo alcanzaba con inventarse una cookie con ese nombre.
 *
 * Poner la guardia no le cambia nada a quien ya entra bien, y las rutas
 * declaradas como publicas siguen pasando: `AuthGuard` las deja pasar.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
