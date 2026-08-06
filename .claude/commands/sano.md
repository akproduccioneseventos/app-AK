---
description: Corre los cinco controles de salud de la app en el orden que funciona y devuelve un veredicto en criollo.
---

Verificá que la aplicación esté sana. **El orden importa**: correrlos al revés
da fallas falsas que hacen perder horas.

Corré los seis pasos, uno detrás del otro, sin saltear ninguno:

0. `npm run check:acentos` — acentos rotos. Es instantáneo y va primero porque es
   el más barato: si salta, no tiene sentido seguir. Una sola propuesta llegó a
   meter 902 acentos rotos, que además de verse mal en pantalla rompen las
   comparaciones de texto con eñes en silencio.
1. `npx tsc --noEmit` — el revisor de tipos. Tiene que dar cero errores.
2. `npx jest --silent` — las pruebas unitarias. Todas en verde.
3. `npm run build` — la aplicación tiene que compilar.
4. Las pruebas de navegador, **contra la versión compilada**:
   `npm run test:e2e:production`. Nunca contra el servidor de desarrollo, que
   recompila cada pantalla al visitarla y a veces se queda sin memoria.
5. `npm run test:rules` — la seguridad de la base de datos.

## Reglas duras mientras corren

- **Nunca recompiles mientras corre una prueba de navegador**: produce fallas
  falsas.
- **Nunca corras una sola prueba filtrando por nombre** en un archivo donde las
  pruebas dependen entre sí: inventa fallas que no existen.
- Si algo que antes andaba falla y nadie lo tocó, casi siempre es el servidor de
  prueba sirviendo una versión vieja. Reiniciá el servidor **antes** de ponerte a
  leer código buscando el defecto.
- Si la misma prueba falla dos veces seguidas, **pará**. No hay tercer intento
  arreglando otra cosa. Contá qué falla y listo.
- Filtrá las salidas largas (`| tail -20`) en vez de volcarlas enteras.

## Cómo informar el resultado

En criollo, sin tecnicismos y sin bloques de comandos. Para el dueño, que no es
programador:

- Si dio todo bien: decilo en una línea, con los números (cuántas pruebas).
- Si algo falló: **qué le pasaría al usuario en pantalla**, no el mensaje de
  error. Y si lo podés arreglar vos, arreglalo en vez de contarlo.

Cuando termines, actualizá `ESTADO-ACTUAL.md` con el resultado.
