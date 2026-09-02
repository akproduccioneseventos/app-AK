# Orden 33 — Cambiar cosas sin desplegar: Remote Config

**Para Gemini. Escrita el 1 de septiembre de 2026.**

## Por qué, y es de plata

**Hoy, para cambiar un texto o prender una función hay que fusionar y desplegar. Y cada
despliegue se paga.** Es la razón por la que el dueño pidió juntar el trabajo en una sola
propuesta: *"cada fusión dispara un despliegue y eso se paga"*.

**Remote Config lo resuelve:** el ajuste se cambia **desde el navegador, al instante, sin tocar
código ni desplegar nada**.

**Cuánto sale: nada en nuestra escala.** Gratis hasta 100.000 consultas por día; nosotros vamos a
estar en el 1% de eso. (Desde septiembre de 2026 pasa a cobrarse por uso, con esas 100.000
diarias sin costo.)

## Para qué sirve de verdad, con ejemplos de esta app

- **Apagar una estación que se rompió en plena fiesta**, desde el celular, sin desplegar.
- **Cambiar un texto de venta** o el de una promoción.
- **Prender el modo cine** de la pantalla gigante en todas las fiestas.
- **Cambiar el tope de imágenes de inteligencia artificial por fiesta** si un mes se gasta de
  más.
- **Poner un cartel de mantenimiento** si algo falla.

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde, `npm run limpiar:corrida`, y anotado en
`docs/YA-RESUELTO.md` con su línea en el bloque `comprobar`.

---

## BLOQUE 1 — Que ande, y que NUNCA rompa nada

Un archivo, `src/lib/firebase/ajustes-remotos.ts`, con una regla que no se negocia:

**Cada ajuste tiene su valor por defecto escrito en el código.** Si Firebase no contesta, si no
hay internet, o si nadie configuró nada, **la app funciona exactamente como hoy**. El ajuste
remoto sólo puede **cambiar** lo que ya anda, nunca ser la única fuente.

- Se lee **una vez al arrancar** y se guarda en memoria. **Nunca en un bucle**: cada consulta
  cuenta.
- **Si tarda más de 3 segundos, se sigue con los valores por defecto.** La app no espera.
- **Nunca se pone ahí nada de plata, cobros, permisos ni precios.** Eso no se cambia desde una
  consola sin dejar rastro: lo decide el dueño en la app, y queda registrado.

## BLOQUE 2 — Los primeros cinco ajustes, y nada más

**No armes veinte.** Cinco, los que se necesitan de verdad:

| Ajuste | Para qué | Por defecto |
|---|---|---|
| `estacionesApagadas` | Apagar una estación rota en plena fiesta | vacío |
| `carteLDeMantenimiento` | Avisar en pantalla si algo falla | vacío |
| `modoCinePorDefecto` | Prender el modo cine en todas | apagado |
| `topeImagenesIaPorFiesta` | Bajarlo si un mes se gasta de más | 3 |
| `mensajeDePromocion` | El texto de la promo vigente | el de hoy |

**El del tope de imágenes toca plata: se lee, pero el tope real sigue en el código.** El remoto
sólo puede **bajarlo**, nunca subirlo.

## BLOQUE 3 — Que se vea qué está pasando

Una tarjeta en Configuración → Sincronizaciones que muestre **qué ajustes están cambiados desde
afuera y cuáles están como vienen**. Si alguien apaga una estación desde la consola y se olvida,
**tiene que verse en la app**, no ser un misterio.

---

## LO QUE NO SE TOCA

- **Nada de plata, cobros, precios ni permisos** se maneja desde la consola.
- **El borrado automático de datos viejos (TTL) NO se hace**: Google lo cobra aparte, sin porción
  gratis, y no compensa.
- **Nada que se pague por mes.**

## Cómo se comprueba que esta orden está hecha

```comprobar
archivo: src/lib/firebase/ajustes-remotos.ts
usa: ajustes-remotos en src/components/app-shell.tsx
prueba: src/__tests__/ajustes-remotos-no-rompen-nada.test.ts
```

**La prueba tiene que comprobar lo más importante: que sin Firebase, o con Firebase caído, la app
funcione igual que hoy.** Ése es el riesgo de esta orden.
