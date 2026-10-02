# Continuación de auditoría contra main — 2026-10-02

## Base de revisión

- Repositorio: `akproduccioneseventos/app-AK`
- SHA exacto de main revisado: `c92ee4224da3b440ad91d72f06d03c6672f44e33`
- PR abiertas al consultar GitHub: ninguna.
- Producción: no verificada en esta pasada; el endpoint de salud tuvo timeout en la comprobación anterior. No asumir que el SHA está desplegado.
- No se modificó código de la aplicación ni se ejecutó compilación.

## Orden 110: contraste, sin rehacer lo ya incorporado

- **Recetas de barra:** corregido en main respecto del defecto descrito: al comparar las 36 referencias `insumoId` con los 40 insumos del catálogo, no faltan IDs. Esto sólo acredita que las referencias existen; no verifica por sí solo unidades, cálculo real ni escritura en Firebase.
- **Voz:** el reproductor del Parte de la mañana usa `SpeechSynthesisUtterance` del navegador. No encontré `src/lib/asistente/voz-parte.ts` en main y la consulta de ruta devolvió 404. Gemini TTS no queda demostrado ni implementado por esta evidencia; seguir como pendiente de funcionalidad, no corregir otra vez el tono sintético ya retirado.
- **Catálogo público de tecnología:** `src/app/tecnologia/page.tsx` recorre `TECNOLOGIAS_AK`, pero las tarjetas renderizan nombre, descripción, ruta en texto y botón; no renderizan `item.foto` ni un ícono de respaldo. La propiedad `foto` del catálogo no tiene consumidor en esta página. La vista no está mostrando las imágenes de producto/capturas que el catálogo promete. No afirmar que los archivos son imágenes rotas en pantalla: las rutas listadas no se renderizan.
- **Prueba de imágenes:** `src/__tests__/las-imagenes-de-tecnologia-son-imagenes.test.ts` retorna temprano si no existe `public/tecnologia`; por tanto la prueba puede pasar sin verificar una sola imagen. Además, esa prueba sólo inspecciona archivos locales, no que la página los muestre. Falta prueba que falle con carpeta ausente y compruebe el uso del activo en la página.
- **Video de muestra:** no se concluye en este registro si el archivo fue quitado o si existe video de fiesta real; queda sin contrastar.

## Hallazgo de seguridad para contraste específico

- `src/app/actions/fiesta/invitados.actions.ts:getInvitados` lee `getFiestaById(fiestaId, LECTURA_COMPLETA)` y devuelve el arreglo completo de invitados, sin llamar `requireAppSession` ni validar un token de invitado.
- La acción se importa desde un componente cliente del muro social. El helper `getFiestaById` sólo recorta los datos cuando no hay sesión válida **y** no se pidió `LECTURA_COMPLETA`; este consumidor pide explícitamente lectura completa.
- Las pantallas de recepción están detrás de AuthGuard, pero eso no demuestra que la acción remota esté protegida: el propio test `pantallas-internas-con-guardia.test.ts` explica que middleware sólo comprueba presencia de cookie y que la validación efectiva es cliente. No localicé prueba focalizada que invoque `getInvitados` sin sesión.
- **Clasificación:** riesgo de autorización/privacidad confirmado en el código; explotación remota no reproducida. Puede exponer nombres, contactos, alergias, canciones u otros campos de invitados si se puede invocar la acción sin sesión. No marcar como fuga explotada hasta hacer la sonda con la acción real.
- **Contraste pendiente para Claude (permisos/datos):** probar la acción directa sin cookie, con cookie inventada y con sesión AK; exigir denegación en los dos primeros casos y acceso al equipo autorizado en el último. Comprobar que la respuesta pública del portal siga limitada al invitado con token. Añadir una prueba ejecutable de regresión sobre la acción, no sólo sobre el layout.
- Rutas verificadas: `src/app/actions/fiesta/invitados.actions.ts`, `src/app/(app)/fiestas/nueva/muro-social/page.tsx`, `src/lib/fiesta/fiesta.actions.ts`, `src/app/recepcion/layout.tsx`, `src/__tests__/pantallas-internas-con-guardia.test.ts`.

## Resultado

La lista de invitados y la autorización de acciones requieren la sonda prioritaria antes de llamar al módulo seguro. La parte visual de tecnología y Gemini TTS siguen incompletas según el código observado. No se declara la app completa ni desplegada: faltan pruebas de acción remota y verificación de producción sobre el SHA actual.

## Reproducción visual añadida — catálogo público inaccesible

- Abrí en el navegador real `https://akproducciones.uy/tecnologia` sin iniciar sesión.
- Resultado observable: redirigió a `/login?redirect=%2Ftecnologia` y mostró Acceso Protegido.
- En el SHA revisado, `src/lib/auth/public-paths.ts` contiene `/experiencia-ak`, pero no `/tecnologia`; por eso el middleware trata el catálogo como ruta privada.
- **Clasificación:** fallo confirmado en la web publicada al momento de la prueba; impide que un prospecto sin cuenta vea el catálogo público. No confundido con el fallo de imágenes ni con Gemini TTS.
- Reproducción visual independiente del código: la versión desplegada y su SHA no fueron identificados, así que no atribuir este comportamiento a `c92ee42` publicado hasta verificar `/api/health`.

## Segundo destino comercial bloqueado

- Desde `src/app/tecnologia/page.tsx`, cada CTA **Probalo** enlaza a `/experiencia?paso=...`; la ruta existe en `src/app/experiencia/page.tsx`.
- Abrí `https://akproducciones.uy/experiencia` sin sesión: redirige a `/login?redirect=%2Fexperiencia`.
- `src/lib/auth/public-paths.ts` tampoco declara `/experiencia` pública (sólo declara `/experiencia-ak`).
- **Clasificación:** reproducción confirmada en la web publicada y enlazada por el propio catálogo. El cliente no puede abrir la demostración desde esos botones. SHA de producción aún no identificado.

## Inspección visual de `/experiencia-ak` (navegador, viewport móvil)

- La landing alternativa sí carga sin sesión y expone CTAs a WhatsApp y simulador.
- En la captura del primer viewport, el botón blanco de **Calcular Presupuesto Online** no muestra texto legible aunque el árbol accesible conserva ese nombre; comprobación visual directa, reproducible en viewport móvil. Revisar contraste/fondo del botón antes de dar la conversión por usable.
- En los dos viewports capturados, el tratamiento es predominantemente oscuro y las tarjetas de servicios usan íconos, no fotografía o video real. Es una fricción de marca/venta observada, no un error funcional del enlace. Las animaciones visibles se limitan a transiciones de tarjetas; no validé movimiento a lo largo de toda la página.
- Código relacionado: `src/app/experiencia-ak/page.tsx`. La sección termina en servicios + CTA; su footer ofrece acceso a galería/blog, pero no se comprobó la carga de esos destinos.

## Sonda segura del simulador publicado

- `/simulador-de-presupuesto` abrió sin sesión. Pude avanzar desde la presentación al paso 2 sin cargar información personal.
- Al intentar continuar vacío, bloqueó el avance y enumeró nombre, WhatsApp uruguayo, opción de salón y fecha faltantes. No envié ni guardé datos de prospecto.
- La forma visible en la captura móvil es legible y ordenada en fondo claro. **No probé** cálculo final, proyección anual, selección de menú, paquetes, servicios dinámicos, PDF ni persistencia: esos recorridos requieren completar datos y no se ejecutaron en producción para evitar crear un lead real.


## Inspección de artículo del blog publicado

- Abrí `/public/blog/como-calcular-bebida-evento-salto` sin iniciar sesión. Carga título, bajada, artículo, checklist, FAQ, artículo relacionado y CTA de WhatsApp/simulador.
- **Fricción visual confirmada:** el encabezado principal se monta sobre una fotografía oscurecida de fondo. En la captura móvil, el título y la bajada ocupan la imagen; no es el formato solicitado de publicación con imagen separada del texto. No comprobé superposición que impida leer: el texto sí resulta legible en la captura.
- Los botones de compartir y el enlace de simulador están presentes; comprobé que el acceso del footer al simulador abre la ruta pública correcta. No envié mensajes ni datos.
- **Clasificación:** mejora de presentación pendiente, no defecto funcional bloqueante. No se verificó atribución de visitas/conversión ni analítica.


## Navegación rota desde artículo hacia la galería

- **Rol/recorrido:** prospecto; artículo público → pie de página → “Galería de Eventos Reales”.
- En `/public/blog/como-calcular-bebida-evento-salto`, activé ese enlace. La app volvió a la portada y la URL quedó `/#landing-gallery`, pero la captura quedó posicionada en “Guías útiles y consejos”; la galería no quedó visible ni enfocada. En el árbol accesible, la galería aparece como sección `galeria`, no `landing-gallery`.
- **Clasificación:** DEFECTO P2 de navegación confirmado en producción: CTA con destino que no corresponde al ancla real; obliga a buscar/desplazarse para alcanzar la galería.
- Pasos: abrir artículo sin sesión → usar “→ Galería de Eventos Reales” del footer → observar URL y sección visible. Sin envío de información ni cambios de datos.
- Evidencia: navegador real, URL final `https://akproducciones.uy/#landing-gallery`; captura muestra “Guías útiles y consejos”; sección de galería identificada posteriormente como `galeria`.
- Retest tras corrección: el enlace debe aterrizar con la galería en viewport y su título visible, tanto desde otra ruta como desde la portada.
