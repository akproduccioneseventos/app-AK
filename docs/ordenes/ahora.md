# LA ORDEN: lo que falta para publicar

**Para:** Gemini (Antigravity)
**Escrita:** 23 de agosto de 2026.

**Arrancá desde la versión principal de ahora**, que ya tiene adentro tu entrega
comercial anterior. Antes de tocar nada, leé `docs/MANUAL-DE-LA-APP.md` y
`docs/YA-RESUELTO.md`.

## Cómo se entrega

**UNA SOLA propuesta con los cinco bloques adentro.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó y por qué.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

**Y la regla que manda sobre todo** (`CLAUDE.md`): **la app es automática y con
inteligencia artificial al máximo.** Ante dos caminos, elegí el automático. Si algo
queda manual, que quede **a un toque**.

---

## BLOQUE 1 — URGENTE: volver a poner el reloj del simulador

**Lo sacaste en la entrega anterior porque yo lo había pedido, y estaba mal
pedido.** El dueño lo quiere de vuelta:

> *"El reloj del simulador, para que la gente se comunique, sí lo quiero."*

**Volvé a poner el contador** que aparece después de generar el presupuesto y
congela la tarifa. **Es una decisión de marketing del dueño**, ya anotada en
`CLAUDE.md`. **No se vuelve a sacar ni se reporta como problema en ninguna
auditoría.**

Dejá también la frase que agregaste ("guardá tu copia en PDF o hablá con AK por
WhatsApp para congelar la tarifa"): las dos cosas juntas funcionan mejor que
cualquiera sola.

---

## BLOQUE 2 — El Club Uruguay, ofrecido siempre

Hoy en la Presentación LED el Salón Club Uruguay **sólo aparece si el cliente dice
"no tengo salón"**. El que llega con otro salón medio decidido **nunca ve las
fotos**, y es justo al que se le puede dar vuelta la cabeza.

- Una pantalla propia del Club, **disponible en cualquier momento de la
  presentación**: fotos que luzcan, capacidad y el descuento.
- Que se pueda ofrecer sin borrar lo que el cliente ya eligió.

---

## BLOQUE 3 — El paquete integral con precio de combo

Hoy el cliente ve los servicios sueltos y suma de a uno.

- **Mostrale que todo junto sale menos que por separado**: qué incluye, qué no, y
  **el ahorro en pesos**.
- **Los precios salen del catálogo**, nunca inventados.
- Que aparezca en la Presentación LED y en el simulador.

Es la venta más fácil y más grande que se está dejando pasar.

---

## BLOQUE 4 — Extras en el portal del cliente

El cliente abre su portal a las once de la noche, emocionado con la fiesta de su
hija. **Es el mejor momento para venderle algo y hoy no hay dónde.**

1. **Una sección de extras contratables**: una hora más de banda, fotos
   adicionales, una estación más. Qué tiene contratado y qué puede sumar, con el
   precio del catálogo.
2. **Pedirlo tiene que ser un toque**, no un formulario. Toca "me interesa" y
   **queda un mensaje preparado en la bandeja de salida** para que una persona lo
   atienda.
3. **No se cobra solo ni se agrega solo al contrato.** Eso lo confirma el equipo.
4. **Que el portal abra celebrando lo que contrató**, no con un panel de números:
   qué está incluido, con íconos, en tono humano.

---

## BLOQUE 5 — El plan de pagos en el presupuesto, y los textos

1. **Mostrar el plan de pagos en el presupuesto**, no sólo el total. Ver "$120.000"
   de una asusta; ver "la seña ahora y el resto en cuotas" decide.
2. **La aclaración del Club Uruguay tiene que verse** junto al precio, no al final
   en letra chica: que quede claro que el alquiler se paga aparte en el Club. Que
   nadie se sienta sorprendido después.
3. **Repasá los carteles** del portal del cliente y del simulador: que digan **qué
   hacer**, no sólo qué pasó. Hay uno que dice *"AK todabia no cargo este dato"*,
   con falta de ortografía. Buscá si hay más así.
4. Los montos: en pesos, con separador de miles, **sin decimales**.
5. **Nunca culpar al cliente**: "No pudimos procesar el pago", no "Ingresaste mal
   los datos".

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes sin avisar.
- **El WhatsApp prepara mensajes y no los manda.** Vale para los extras del portal.
- **Ningún precio ni promoción se inventa**: salen del catálogo.
- **El reloj del simulador se queda.**
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.

## Después de esta orden

Quedan dos más, ya escritas y en orden: `docs/ordenes/publicar-en-todas-las-redes.md`
y `docs/ordenes/publicidad.md`. **No las mezcles con esta.**
