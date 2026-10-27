# Orden 246 — La sección "La app de tu fiesta" de la portada, más clara y más linda (27/10/2026)

**Para Gemini. Va en la MISMA propuesta que las órdenes 242 a 245.** Antes de decir "terminé", pasá
`docs/ANTES-DE-ENTREGAR.md` y usá las skills `celular-primero` y `animaciones-pro`.

El dueño leyó la sección y no entendió partes. Pidió: *"mejorá esa sección"*.

Archivo: `src/components/landing/LaAppDeTuFiestaSection.tsx` (`#tecnologia` en la portada).

## Lo que NO se toca

- **La idea de la sección:** los 5 momentos (antes, invitación, durante, barra, después) y la muestra
  interactiva a la derecha, con los datos de prueba.
- **Los `data-testid`**, como `momento-de-la-app`.
- **`MOMENTOS_APP_FIESTA`**, que se exporta y puede usarse en otro lado. Cambiá textos, no la forma del dato.
- **Prohibido:** "garantía", "24/7", plazos, "congelar", nombres del personal y palabras en inglés.

## Bloque 1 — textos en criollo (tal cual)

| Momento | Campo | Hoy | Queda |
|---|---|---|---|
| antes | badge | "Planificación sin fricción" | "Todo en un solo lugar" |
| antes | titulo | "Portal del cliente: decisiones y acuerdos en orden" | "Tu fiesta organizada desde el celular" |
| antes | subtitulo | (igual) | "Elegís el menú, la música y la decoración, y ves qué falta, sin perder nada en chats." |
| invitacion | badge | "Acceso digital al instante" | "Invitación en el celular" |
| invitacion | titulo | "Invitación digital interactiva y confirmación ágil" | "Una invitación que tus invitados abren con un toque" |
| durante | badge | "Mural y DJ en vivo" | "Pantalla gigante" |
| durante | subtitulo | "…con moderación previa." | "Dedicatorias, fotos de los invitados y pedidos de canciones. Antes de salir en pantalla, alguien del equipo las revisa." |
| barra | badge | "Carta digital y pedidos" | "Pedís el trago desde el celular" |
| barra | titulo | "Carta de tragos digital con seguimiento de turno" | "Pedís tu trago, con o sin alcohol, y te avisa cuando está listo" |
| barra | loQueEntiende | "…con cola separada del DJ." | "No hay que hacer fila en la barra." |
| despues | titulo | "Álbum digital completo disponible al día siguiente" | "Los recuerdos de la noche, juntos en un álbum" |

**"al día siguiente" es un plazo prometido y se saca.** En la muestra:

- "DEMO EN VIVO" pasa a "EJEMPLO";
- "Modo seguro" se saca;
- "Vos (Invitado Demo)" pasa a "Vos".

Las etiquetas de las pestañas pasan a "Organizar", "Invitación", "Pantalla gigante", "Barra" y "Recuerdos".

## Bloque 2 — la barra muestra la carta real

En la muestra de "barra", usá los tragos de `defaultCartaTragosData.items` (`src/lib/fiesta-defaults.ts`), con su
foto (`imageUrl`, en `public/images/tragos/`). Muestra 4: Daiquiri de frutilla, Caipirinha con caña, Arizona y
Fernet con Coca.

- Al tocar uno aparecen los botones **"Con alcohol"** y **"Sin alcohol"**, igual que en la orden 242. En Fernet,
  "Sin alcohol" muestra "Cola con naranja".
- Después sigue lo que ya hace: "en cola" y "listo".
- Sigue siendo sólo una muestra: **no llama a ninguna acción del servidor.**

## Bloque 3 — que se vea bien en el celular

- **Las 5 pestañas** se ven completas en 390 px: dos filas o pastillas más chicas, **sin barra de desplazamiento
  escondida**. La activa queda a la vista.
- **En el celular, la muestra va arriba y la explicación abajo**, para que se vea la app primero.
- **Botones de 44 px de alto como mínimo.** Hoy los de la muestra son `py-1 text-xs`, muy chicos para tocar.
- **Cambio de momento:** con la animación de `animaciones-pro`, y respetando `useReducedMotion`, como ya se hace.

## Bloque 4 — el cierre de la columna izquierda

Dos botones: **"Coordinar una entrevista gratuita"** (el mismo panel de la orden 245) y "Simular mi presupuesto". El de
WhatsApp queda como enlace de texto chico debajo: "o escribinos por WhatsApp".

## Pruebas

**Navegador**, en `tests/e2e/la-seccion-de-la-app-se-entiende.spec.ts`. Comprobar:

- en 390×844 se ven las 5 pestañas sin desplazar de costado;
- tocar "Barra" muestra la foto de un trago real (`/images/tragos/`);
- tocar Fernet y "Sin alcohol" muestra "Cola con naranja";
- la sección no contiene "DEMO EN VIVO", "sin fricción", "al día siguiente" ni "Modo seguro".

Corré `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las últimas líneas de cada uno.

```comprobar
no-usa: sin fricción en src/components/landing/LaAppDeTuFiestaSection.tsx
no-usa: DEMO EN VIVO en src/components/landing/LaAppDeTuFiestaSection.tsx
no-usa: al día siguiente en src/components/landing/LaAppDeTuFiestaSection.tsx
usa: defaultCartaTragosData en src/components/landing/LaAppDeTuFiestaSection.tsx
usa: Coordinar una entrevista gratuita en src/components/landing/LaAppDeTuFiestaSection.tsx
prueba: tests/e2e/la-seccion-de-la-app-se-entiende.spec.ts
```
