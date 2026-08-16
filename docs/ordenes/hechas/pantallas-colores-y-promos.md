# Lo que hay que hacer ahora

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 13 de agosto de 2026 · **actualizada el 15 de agosto de 2026**
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Lo que está en `hechas/` ya se hizo.

**Los bloques que quedan van en UNA SOLA PROPUESTA.** Leé `LEEME.md` de esta
carpeta para las reglas y los controles.

---

## Bloques A, B y C: HECHOS y fusionados (15 de agosto de 2026)

Las tres pantallas de la noche —impresión, presentación y tótem— ya quedaron
resueltas y verificadas. **No se vuelven a tocar.** El detalle está en
`docs/YA-RESUELTO.md`.

Dos cosas para la próxima entrega, porque pasaron en ésta:

- **No commitear `public/firebase-messaging-sw.js`.** Se genera solo en cada
  compilación. Vino modificado y hubo que sacarlo a mano antes de fusionar. Es la
  segunda vez.
- **La prueba `src/__tests__/pantallas-de-la-noche.test.ts` controla el texto del
  código fuente.** Al hacer el bloque D hay que revisarla: si se le cambian
  clases de color a esas tres pantallas, la prueba avisa. Se ajusta la prueba en
  la misma propuesta, no se borra.

---

# BLOQUE D — Terminar los colores

La escala visual ya está fijada y **no se cambia**: tarjetas `rounded-xl`,
botones y campos `rounded-lg`, y los componentes compartidos usan los colores del
tema.

Falta recorrer las pantallas que todavía tienen colores escritos a mano
(`bg-amber-400`, `text-slate-800`) y pasarlas a los del tema (`bg-primary`,
`text-foreground`, `border-border`). Ya se hicieron a mano las que ve el cliente:
portal principal y sus variantes, confirmación de invitados, muro social,
invitación pública, portal del invitado, contrato, moodboard, configuración de la
fiesta y la bandeja del portal.

- **Pantalla por pantalla, nada de buscar y reemplazar masivo.** Son más de 200 y
  de golpe es imposible de revisar.
- **Anotá hasta dónde llegaste**, para poder retomarlo la próxima.
- Probá en claro y en oscuro antes de dar una pantalla por lista.
- **No toques** los colores que elige el usuario (croquis, decoración, números de
  mesa, invitaciones) ni el fondo blanco de los documentos que se imprimen.

# BLOQUE E — Las promociones se guardan sin fechas

`src/app/(app)/settings/promos/page.tsx:111-127`

Sólo se valida el título. Si se dejan vacías la fecha de inicio y la de fin, la
promoción se guarda igual y **el contador de la web nunca arranca**: queda una
promoción publicada que no cuenta nada.

Que no se pueda guardar sin las dos fechas, y que la de fin no sea anterior a la
de inicio.

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`. **Si hay conflicto ahí, quedate siempre con esa
  versión**: ya se reabrió el agujero una vez.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude. Si te cruzás con algo
  de eso, avisá y seguí.

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y **mové
este archivo a `hechas/` en la misma propuesta**. Todo junto: los dos bloques que
quedan, la anotación y el movimiento del archivo, en una sola entrega.
