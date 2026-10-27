# Orden 238 — Que el cliente hable por voz con el asistente de su portal (27/10/2026)

**Para Gemini. Una sola propuesta**, rama nueva desde `main` actualizada: `gemini/orden-238-voz-cliente`. Antes de decir
"terminé", pasá `docs/ANTES-DE-ENTREGAR.md`.

Decisión del dueño (19/10): *"al cliente sí le puede hablar; al invitado no"*. Hoy el botón **"Hablar"** del portal
(`src/components/portal/AsistenteDelCliente.tsx` ~167) sólo muestra "La llamada por voz todavía no está disponible;
escribime y te contesto" (~46). Se dejó así a propósito el 26/10 porque antes decía "conectada" sin conectar y gastaba
minutos. Ahora hay que hacerlo de verdad.

## Lo que ya existe y se REUSA

- **Ficha del cliente:** `src/app/api/asistente/voz-en-vivo/cliente/route.ts` (POST). Pide la sesión del portal de
  esa fiesta (`getFiestaForPortalSession`), reserva un minuto del tope diario por fiesta, devuelve `token` y, si no
  hay ficha, devuelve el minuto. **No se toca su control de sesión ni su tope.**
- **La llamada en el navegador:** `iniciarVozEnVivo` en `src/lib/asistente/sesion-voz-en-vivo.ts` (~103) ya hace
  micrófono, audio, cancelación (`senal`) y errores en criollo (`mensajeDeErrorDeMicrofono`, `mensajeDeCierre`). Hoy
  pide la ficha a `/api/asistente/voz-en-vivo` (~172), que es la del equipo, y ejecuta herramientas contra
  `/api/asistente/voz-en-vivo/accion` (~316-323).

## Bloque 1 — `iniciarVozEnVivo` sirve también para el cliente

- Sumá a `OpcionesVozEnVivo` (~18) dos opciones:
  - `urlFicha?: string`, que por defecto sigue siendo `/api/asistente/voz-en-vivo`;
  - `sinHerramientas?: boolean`.
- Con `sinHerramientas: true`, **nunca** se llama a `/accion`. Si el modelo pide una herramienta, se le contesta "no
  disponible en esta llamada" y la llamada sigue.
- Comprobá que la respuesta de la ruta del cliente tenga la misma forma que espera `iniciarVozEnVivo` (el campo `token`
  y los demás que lea). Si no la tiene, adaptá **la lectura**, no la ruta.
- **No cambies** cómo funciona la voz del panel del equipo.

## Bloque 2 — el botón "Hablar" del portal

En `AsistenteDelCliente.tsx`:

- **Al tocar "Hablar":** se llama `iniciarVozEnVivo({ urlFicha: '/api/asistente/voz-en-vivo/cliente', sinHerramientas: true, senal, onEstado, onTexto, onError })`.
- **Mientras conecta:** "Conectando…".
- **Conectada:** sólo cuando `onEstado` diga que está conectada, mostrar "En llamada" con un botón "Cortar". Lo que se
  dice aparece escrito en el chat (`onTexto`).
- **Si falla:** el error de `onError` va tal cual, por ejemplo el tope de minutos del día o el micrófono bloqueado, y
  el chat escrito sigue andando.
- **Al cerrar el asistente o cambiar de página:** se corta la llamada (`senal.abort()`).
- Sacá el mensaje fijo "todavía no está disponible".

## Lo que NO se toca

- **El invitado no tiene voz.** No agregues el botón en pantallas del invitado.
- No se usan servicios pagos nuevos. La voz es la de Gemini en vivo que ya usa el panel, con el tope de la ruta del
  cliente.
- La llamada del cliente no ejecuta ninguna acción, ni cobra, ni cambia nada. **Sólo conversa.**

## Pruebas — que miren el resultado

- **Jest**, en `src/__tests__/la-voz-del-cliente-habla-de-verdad.test.ts`, con las piezas del navegador simuladas
  (`piezas` de `iniciarVozEnVivo`). Comprobar:
  - (a) con `urlFicha` del cliente, el pedido va a `/api/asistente/voz-en-vivo/cliente`;
  - (b) con `sinHerramientas`, un pedido de herramienta del modelo **no** llama a `/accion`;
  - (c) sin opciones, la voz del equipo sigue pidiendo a `/api/asistente/voz-en-vivo`;
  - (d) en el componente, "En llamada" no aparece antes del estado conectado, y con la ficha rechazada (429, el tope) se
    muestra el mensaje del servidor.

  Rompé a propósito la (b) y fijate que se ponga en rojo.
- **Navegador**, en `tests/e2e/el-cliente-habla-por-voz.spec.ts`, con la ruta de la ficha simulada (429) y el micrófono
  falso (`tests/e2e/helpers/camara-falsa.ts`). Comprobar:
  - tocar "Hablar" muestra el mensaje del tope;
  - el chat escrito sigue andando.

Corré esas pruebas solas, después `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las
últimas líneas de cada uno en la propuesta.

```comprobar
usa: voz-en-vivo/cliente en src/components/portal/AsistenteDelCliente.tsx
usa: sinHerramientas en src/lib/asistente/sesion-voz-en-vivo.ts
no-usa: todavía no está disponible en src/components/portal/AsistenteDelCliente.tsx
prueba: src/__tests__/la-voz-del-cliente-habla-de-verdad.test.ts
prueba: tests/e2e/el-cliente-habla-por-voz.spec.ts
```

