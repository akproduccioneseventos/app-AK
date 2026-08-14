# Orden — Las pantallas que corren durante la fiesta

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 13 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

## Cómo se entrega

**UNA SOLA PROPUESTA con los tres bloques.** No una por bloque. Cada fusión
dispara un despliegue y se paga. Si un bloque se traba, entregá los otros dos en
la misma propuesta y avisá cuál faltó y por qué.

Antes de subir, los cuatro controles **sobre el conjunto entero**:
`npx tsc --noEmit`, `npx jest --silent`, `npm run check:acentos`, `npm run build`.
Si alguno falla, no subas. Guardá en UTF-8.

Leé `docs/YA-RESUELTO.md` antes de reportar nada y **anotá ahí todo lo que
modifiques, en la misma propuesta**, con el porqué de cada decisión.

## Por qué existe

Se auditó por primera vez todo lo que corre **con la gente adentro del salón**.
Ahí no hay margen: si algo se cuelga, se cuelga en plena fiesta. La buena noticia
es que la mayoría maneja bien los cortes de internet. Estos tres son los que no.

---

# BLOQUE A — La pantalla de impresión miente cuando se corta internet

`src/app/evento/impresion/[fiestaId]/page.tsx:59-78`

**Es el más importante de los tres.** Cuando falla la carga de fotos, muestra un
cartel que desaparece a los dos segundos y **sigue mostrando las fotos viejas de
la memoria**. El operador no tiene forma de saber que está viendo información
vieja: sigue imprimiendo tranquilo mientras las fotos nuevas de los invitados no
le llegan nunca.

**Qué hacer:** copiar el patrón que ya usa la galería
(`evento/galeria/[fiestaId]/page.tsx:30-38`), que mantiene el estado de error y
lo muestra en pantalla hasta que se recupera. Que el operador vea, de forma
permanente y visible, que perdió la conexión y desde cuándo.

# BLOQUE B — La presentación no se recupera sola

`src/app/presentacion-led/page.tsx:173-206` y `641-650`

Si se corta internet, muestra "No pudimos cargar la presentación" y **se queda
ahí hasta que alguien apriete Reintentar a mano**. Si el corte dura tres minutos
y nadie está mirando, la pantalla queda muerta mucho más tiempo del necesario.

Todas las demás pantallas de la noche ya reintentan solas: la pantalla gigante
cada 20 segundos, la galería cada 10, el tótem cada 2,5. **Hacé lo mismo acá**,
dejando igual el botón manual.

# BLOQUE C — El tótem avisa muy chiquito

`src/app/evento/totem/[fiestaId]/[totemId]/page.tsx:291-299`

Mientras el tótem espera el permiso del salón, muestra "Conectando estación..."
con una rueda semitransparente y chica, dentro del mismo botón que el código QR.
El invitado ve el QR, lo escanea y no funciona, sin entender por qué.

**Qué hacer:** que mientras no esté conectado, el QR **no se vea como
disponible**, y que el aviso se lea desde lejos. Es una pantalla que se mira
parado y de paso.

---

## Lo que está bien y NO hay que tocar

Verificado en esta auditoría: la pantalla gigante, la galería y el tótem manejan
bien los cortes de internet y reintentan solos. Los centros de mando se arman en
el servidor. No hay datos internos a la vista del invitado ni errores en jerga en
las pantallas grandes.

## Cuando termines

Avisá el número de la propuesta y anotá lo hecho en `docs/YA-RESUELTO.md`.
