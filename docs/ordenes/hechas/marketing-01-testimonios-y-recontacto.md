# Orden de trabajo: testimonios, recontacto y lo que se ve en Google

Fecha: 12 de agosto de 2026.

**Entregá UNA SOLA propuesta de cambio con los dos bloques adentro.** Si uno se
traba, entregá los otros igual en la misma propuesta y avisá cuál faltó y por qué.
No abras una propuesta por bloque: cada fusión dispara un despliegue y eso se paga.

Antes de arrancar, leé `docs/QUE-HAY-EN-LA-APP.md`: ahí está el inventario de lo
que existe de verdad, ya verificado. No vuelvas a auditar lo que ya está anotado, y
**actualizá esas líneas en esta misma propuesta** cuando cambies algo.

Los dos hallazgos están verificados leyendo el código, no son sospechas.

**Los otros dos bloques de esta orden ya los hizo Claude** (los testimonios reales
en la presentación y el recontacto del que no señó), porque tocaban qué se le
muestra al cliente y mensajes a clientes reales. Están anotados en
`docs/YA-RESUELTO.md`: no los rehagas.

---

## Bloque 1 — El planificador de redes dice "Publicado" cuando no publicó nada

**Dónde:** `src/app/actions/social-media.ts`, alrededor de la línea 307.

**Qué hace hoy:** cuando la aplicación importa las publicaciones de Instagram, las
guarda con `status: 'Publicado'`.

**Por qué está mal:** es cierto que esa publicación ya está en Instagram, pero en el
planificador de contenido se lee como si la aplicación la hubiera publicado. La
aplicación **no publica en ninguna red**: el contenido se redacta acá y se copia y
pega a mano. El equipo puede creer que algo ya salió cuando en realidad no salió.

**Qué hay que hacer:** distinguir en pantalla las dos cosas. Lo importado de
Instagram tiene que verse como **"Ya está en Instagram"** (o similar), con un color
distinto de lo que el equipo redactó y todavía tiene que publicar. Si hace falta un
estado nuevo, agregalo; no alcanza con cambiar el texto si el filtro y el color
siguen mezclándolos. Revisá también la pantalla `empresa/redes-sociales` para que
el conteo no sume las importadas como "trabajo hecho".

---

## Bloque 2 — Páginas de venta a las que Google no les ve título

**Contexto:** la propuesta anterior destrabó el bloqueo que impedía que el sitio
apareciera en Google, y agregó el listado de páginas. Falta la terminación.

**Qué hay que hacer:**

1. **Título y descripción propios** en las páginas de venta que no los tienen. La
   lista de cuáles están y cuáles no está en `docs/QUE-HAY-EN-LA-APP.md`. Escribilos
   pensando en lo que busca alguien en Salto: "salón para casamientos en Salto",
   "fiesta de quince años Salto", y no en jerga de la empresa.
2. **La ficha de negocio para Google** (nombre, dirección, teléfono, coordenadas,
   redes) hoy está sólo en la portada. Ponela también en las páginas de bodas,
   quince, cumpleaños y en el blog.
3. **Nada nuevo se abre a Google por tu cuenta.** La lista de páginas permitidas
   vive en `src/lib/seo/paginas-publicas.ts` y está cerrada a propósito: el portal
   del cliente, las invitaciones con la lista de invitados y las pantallas del
   equipo tienen que seguir afuera. Si creés que hay que abrir una página más,
   **preguntá antes**, no la agregues.

---

## Cómo se comprueba

1. `npm run check:acentos` limpio.
2. `npx tsc --noEmit` en cero.
3. `npx jest --silent` todo en verde.
4. `npm run build` termina bien.
5. **No toques `src/lib/testimonios/para-mostrar.ts` ni
   `src/lib/marketing/candidatos-recontacto.ts`.** Ahí viven dos reglas que ya están
   resueltas y probadas: que una opinión mala nunca se publique, y a quién se le
   puede escribir por WhatsApp.

Y anotá todo lo que hiciste en `docs/YA-RESUELTO.md` y en
`docs/QUE-HAY-EN-LA-APP.md`, en esta misma propuesta.
