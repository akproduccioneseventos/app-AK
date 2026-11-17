# Orden 315 — Auditoría funcional de botones y accesos (auditor, 17/11/2026)

Informe del auditor externo. Revisó 87 de 87 rutas y probó uno por uno los módulos de la noche en la fiesta DEMO. La
navegación está sana (cero 404). Encontró 5 fallas. Va en la **misma propuesta** que 313, 310, 311, 312 y 314, y se hace
**después** de esas, salvo el bloque 2, que va junto con la 313. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

**Regla para todos los bloques:** un botón que envía algo termina **siempre** en uno de estos dos carteles: "listo"
(con lo que se guardó) o el motivo por el que no se pudo, en criollo. Eso incluye el aviso "Acceso de auditor: se puede
mirar todo, pero no guardar ni mandar nada", que hoy algunos formularios muestran y otros no.

## Bloque 1 — "Publicar" foto en el muro no manda nada (Hallazgo 2)

`src/app/evento/social/[fiestaId]/page.tsx`, `submitUpload` (línea ~1110, el botón está en la línea ~1201). El auditor tocó
Publicar dos veces: sin spinner, sin error, y **no salió ningún pedido al servidor**. Cancion y mensaje, desde la misma
sesión, sí se guardaron. **La causa no está medida:** antes de arreglar, poné un registro en cada paso de `submitUpload`
(armado del formulario, cálculo del `crypto.subtle.digest`, envío) y ubicá dónde se corta. Después:
- Todo `submitUpload` dentro de `try/catch/finally`; `setUploading(false)` en el `finally`.
- Si `crypto.subtle` no está o falla, la foto se sube igual sin la huella.
- Cartel de éxito ("Tu foto está en la pantalla grande" o "Tu foto espera aprobación", según la moderación), o el motivo.

Prueba de navegador: elegir una imagen, tocar Publicar y ver que sale el pedido y aparece uno de los dos carteles.

## Bloque 2 — El buzón de recuerdos no confirma (Hallazgo 3)

`src/app/evento/buzon/[fiestaId]/page.tsx`: al tocar "ENVIAR RECUERDO" el pedido sale, pero la pantalla vuelve al inicio sin
decir nada. Mirar la respuesta: si guardó, "Tu recuerdo quedó guardado"; si no, el motivo (incluido el de auditor). Y
del lado del operador, el panel "Buzón de Recuerdos" tiene que mostrar el saludo nuevo sin recargar a mano.

## Bloque 3 — Confirmar asistencia (RSVP) sin respuesta (Hallazgo 1)

`src/app/invitacion/[fiestaId]/rsvp/page.tsx`:
- Las opciones de "Restricción alimentaria" no se pueden elegir: hay un elemento encima que se queda con el clic. Encontralo
  (`pointer-events`, una capa absoluta) y sacalo.
- "Confirmar asistencia" sin efecto visible: mismo cartel de éxito o motivo que la otra confirmación (`/i/...`), que sí anda.
- Si un campo queda en rojo, que diga qué falta.

## Bloque 4 — El enlace "Invitado" de la consola de auditoría (Hallazgo 4)

`src/app/(app)/auditoria/page.tsx` línea ~202 apunta a `inv_1` con `token-muestra-1`, y ese invitado no existe. El invitado
real de la DEMO es `demo_guest_1`: corregí el enlace al que arma el pase QR de la DEMO (no lo escribas a mano: sacalo del
mismo lugar que el QR).

## Bloque 5 — La presentación LED se queda cargando (Hallazgo 5)

`src/app/presentacion-led/page.tsx` línea ~685: "Cargando presentación..." no termina (verificado dos veces). Ubicá qué
lectura no vuelve; con un tope de 15 segundos, mostrá un error con "Reintentar" en vez de cargar para siempre. Lo mismo en
la galería LED ("0 visuales" con spinner).

## Bloque 6 — Esperas que parecen roturas (Hallazgos 7 y 8)

`/fiestas/nueva/entretenimiento` quedó en blanco más de 15 segundos la primera vez. Mientras carga, que muestre un
esqueleto o "Cargando…", nunca la pantalla vacía. No se pide hacerla más rápida en esta orden.

## Barrido en toda la app

Hecho por Claude el 17/11:
- Botones que envían sin cartel de éxito o error: el auditor encontró 3 (foto del muro, buzón, RSVP); el bloque 1 de la
  orden 313 mide la pantalla, no los botones. **Pregunta 160** (abajo) y su barrido lo hace Gemini: buscar en
  `src/app/evento`, `src/app/invitacion`, `src/app/i` y `src/app/portal` cada `onSubmit`/`onClick` que llama al servidor
  sin `toast` ni cartel en los dos caminos, y arreglarlos con la misma regla.
- Capas que se quedan con el clic: sólo el RSVP; se suma a la regla del recorrido de la 313 (un botón visible que no recibe
  el clic es falla).
- Cargadores sin tope: ya existe el control `las-pantallas-no-quedan-cargando`; la presentación LED se le escapó porque no
  está en su lista → agregarla.

```comprobar
usa: finally en src/app/evento/social/[fiestaId]/page.tsx
no-usa: inv_1 en src/app/(app)/auditoria/page.tsx
usa: Reintentar en src/app/presentacion-led/page.tsx
```
