> **ORDEN CERRADA — archivada el 27 de agosto de 2026.**
>
> Se verificó bloque por bloque contra el código de la versión principal:
>
> - **Bloque 1 (el reloj del simulador): HECHO.** Está puesto y con el texto correcto
>   (habla de la promoción, no de congelar la tarifa).
> - **Bloque 2 (el Club Uruguay ofrecido siempre): NO SE HIZO.** En la Presentación LED
>   el Club sólo aparece cuando el cliente dice que no tiene salón. **Pasó a la orden 13.**
> - **Bloque 3 (el paquete integral con el ahorro en pesos): HECHO.**
> - **Bloque 4 (los extras contratables en el portal del cliente): HECHO.**
> - **Bloque 5 (el plan de pagos y la aclaración del alquiler del Club): HECHO.** La
>   aclaración de que el alquiler se paga aparte en el Club está en el presupuesto, en
>   el simulador, en el PDF y en las preguntas frecuentes. El texto mal escrito
>   *"todabia"* ya no existe, y hay una prueba que impide que vuelva.
>
> **Lo único que quedaba de esta orden es el bloque 2, y vive ahora en
> `docs/ordenes/13-el-club-uruguay-que-se-ofrece-siempre.md`.**

---

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

**Volvé a poner el contador** que aparece después de generar el presupuesto.
**Es una decisión de marketing del dueño**, ya anotada en `CLAUDE.md`. **No se
vuelve a sacar ni se reporta como problema en ninguna auditoría.**

**CORREGIDO EL 27 DE AGOSTO DE 2026 — para qué sirve el reloj.** Esta orden decía
que el contador "congela la tarifa". **Está mal y el dueño lo corrigió.** El reloj
está para que la gente **acceda a la promoción** —el descuento y los regalos—
mientras corre. Palabras suyas: *"el reloj es lo que ayuda a que accedan a
promoción de descuento 10% y regalos"*.

**Y la frase "hablá con AK por WhatsApp para congelar la tarifa" quedó PROHIBIDA**,
junto con toda promesa de precio sostenido en el tiempo y de plazo de respuesta.
Palabras del dueño: *"promesas no, y menos congelar precio: yo trabajo con
ajuste."* El ajuste anual del 15% va siempre y congelar un precio lo contradice.
Sí se puede decir por dónde se contesta y qué da una promoción vigente, y **sí se
puede decir que la fecha se reserva con una seña**.

---

## BLOQUE 2 — El Club Uruguay, ofrecido siempre

Hoy en la Presentación LED el Salón Club Uruguay **sólo aparece si el cliente dice
"no tengo salón"**. El que llega con otro salón medio decidido **nunca ve las
fotos**, y es justo al que se le puede dar vuelta la cabeza.

- Una pantalla propia del Club, **disponible en cualquier momento de la
  presentación**: fotos que luzcan, capacidad y el descuento.
- Que se pueda ofrecer sin borrar lo que el cliente ya eligió.

**MUY IMPORTANTE, palabras del dueño:** *"El Club Uruguay se ofrece, pero no es
obligación contratarlo."*

- **Se muestra como una opción, nunca como un requisito.** El cliente puede traer
  su propio salón y AK le arma la fiesta igual. Eso es parte de lo que vende:
  flexibilidad.
- **Nada de textos que presionen** ni que den a entender que sin el Club el
  servicio es menor. Nada de "recomendado" con letra que culpe al que dice que no.
- **Si el cliente ya eligió otro salón, se le muestra igual pero sin insistir**:
  una vez, con las fotos, y si dice que no, no se le vuelve a poner adelante.
- **El presupuesto tiene que quedar bien armado con cualquiera de las dos
  opciones**, sin huecos ni renglones raros si no se contrata el Club.
- Y que quede claro, como ya está hoy: **el alquiler del Club se paga aparte,
  directamente en el Club.** No es plata que cobra AK.

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

## REGLA QUE MANDA SOBRE TODA ESTA ORDEN

**No se cambia lo que ya funciona.** El dueño lo pidió expresamente hoy, después de
que se le cambiaran dos textos y se le sacara el reloj del simulador sin
consultarle.

- **Hacé lo que dice esta orden y nada más.**
- **Si mientras trabajás ves algo que "estaría mejor de otra manera" pero anda:
  NO lo toques.** Anotalo en una línea al final de tu reporte y que decida el dueño.
- **Lo único que se arregla sin preguntar es lo que está roto de verdad**: algo que
  falla en una fiesta, una cuenta que da mal, o alguien que ve lo que no le
  corresponde.
- **Los textos que ve el cliente y las decisiones de marketing** (descuentos,
  promesas, carteles de urgencia) **no se tocan nunca sin permiso.**

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
