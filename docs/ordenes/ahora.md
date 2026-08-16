# Lo que hay que hacer ahora

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 16 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente** y es corta. Lo de bajar el ruido salió muy
bien y ya está fusionado: gracias. Queda **un solo bloque**, que se agregó a la
orden anterior **después** de que vos ya estabas trabajando, así que es lógico
que no entrara.

**Todo va en UNA SOLA PROPUESTA.**

---

# BLOQUE ÚNICO — Cuando falta un dato, la app habla como programador

Salió de mirar **las 243 pantallas** de la aplicación, una por una. Casi todas
están bien. Lo que aparece es siempre el mismo defecto: cuando la pantalla se
abre sin el dato que necesita, en vez de explicarlo en criollo, muestra jerga.

Son cinco, todas verificadas en el código:

1. **`src/app/(app)/fiestas/nueva/readiness/page.tsx:143`** — le muestra al
   usuario, tal cual: *"No se especificó un evento. Usá el parámetro
   `?fiestaId=...` en la URL."* Con el código y todo. **Es el peor de los del
   equipo**, y sigue igual: se ve en la foto de hoy.
2. **"No se ha especificado un ID de fiesta"**, en `fiestas/nueva/tareas/client.tsx`,
   `fiestas/nueva/reuniones/imprimir/page.tsx` y
   `empresa/todos-los-servicios/[id]/editar/page.tsx`. Sale como cartel rojo de
   error cuando el usuario no hizo nada mal: sólo entró sin elegir fiesta.
3. **`src/app/(app)/empleados/[id]/editar/page.tsx:79`** — el aviso muestra el
   identificador interno: *"No se encontró el empleado con ID a2e_fotos_app"*.
   Ese número no le dice nada a nadie.
4. **`src/app/invitacion/[fiestaId]/rsvp/page.tsx:160`** — *"Evento no
   encontrado."* y nada más. **Éste es el más urgente de los cinco**, porque
   **lo ve el invitado**: abre el enlace de la invitación, algo falla, y queda
   sin saber si el enlace venció, si tiene que insistir o a quién preguntarle.
5. **`src/app/actions/social-media.ts:221`** — *"Instagram no esta conectado a
   Graph API. Configura el token y la cuenta comercial..."*. Jerga pura, y encima
   sin el acento de "está".

**Qué hacer, con el mismo criterio en las cinco:**

- **Decir qué pasa en criollo y cuál es el próximo paso**, con el botón para
  darlo. **Copiá el ejemplo que la app ya tiene bien hecho:** *"Para abrir la
  planificación gastronómica, primero elegí la fiesta"*, con el botón "Ver
  eventos activos".
- **Nunca mostrar identificadores internos, nombres de campos, ni direcciones
  web con parámetros.**
- **Si el usuario no hizo nada mal, no es un error rojo**: es un cartel tranquilo
  que explica y ofrece el camino.
- En el de la invitación: que diga que el enlace no está disponible y que le pida
  el nuevo a quien lo invitó.
- En el de Instagram: que diga que Instagram todavía no está conectado y dónde se
  conecta, sin nombrar "Graph API" ni "token".

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude.
- **No migres colores al tema.** Descartado: la app no tiene modo oscuro.
- **No vuelvas a subir el ruido** que acabás de bajar.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

Y mirá las pantallas:

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts --grep "readiness|tareas|empleados"
```

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y mové
este archivo a `hechas/` en la misma propuesta.
