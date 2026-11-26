# Orden 366 — Robot, vuelta 11: Sofía no congela precios ni dice "seña del 30%", y un fallo de impresión no se anuncia como foto perdida

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 365 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`.

## Por qué
Undécima vuelta del robot (26/11/2026), sobre los textos de la web pública y de las estaciones. En la web no quedan palabras
prohibidas visibles, todos los WhatsApp usan `AK_WHATSAPP_NUMBER` y no hay inglés ni nombres de personal. "Oficina" y las
cifras fijas ya están pedidas (órdenes 355, bloque 8, y 349, bloque 6). Claude confirmó cada punto en el código.

## Bloque 1 — Lo que dice Sofía respeta las decisiones del dueño (pregunta 239)
Sofía, la asistente del simulador (`src/app/actions/simulador-copilot.ts` ~31, que lee `copilot-config.json` con el respaldo de
`src/types/copilot.ts`), tiene escrito en sus instrucciones:
- `src/types/copilot.ts` ~21 y `src/data/copilot-config.json` ~2: *"para eventos del año en curso **congelamos el precio** tras la
  **seña del 30%**"*.
- `src/types/copilot.ts` ~48 y `src/data/copilot-config.json` ~6 (pregunta frecuente): *"se requiere abonar una **seña del 30%**
  del costo total"*.
Las dos contradicen decisiones del dueño (27/08: no se congela precio, hay ajuste anual del 15%; 11/11: **la seña es $5.000 y se
cambia en Ajustes, el 30% es la penalidad por cancelar**). Arreglo:
1. Sacar "congelamos el precio" de las dos copias. Si la pregunta es por precios altos, Sofía dice que se puede reservar la fecha
   con una seña y pagar el resto en cuotas.
2. La seña no se escribe en el texto: se arma con el monto de Ajustes (el mismo que pide la orden 356, `seniaDelContrato` /
   `{{MONTO_SENA}}`) al armar las instrucciones en `simulador-copilot.ts`. Si no se puede leer, Sofía dice "una seña" sin monto.
3. La copia guardada en la base (`copilot-config.json`) puede ser la del dueño: se corrige **sólo** el texto de esas dos frases,
   sin tocar el resto de lo que él escribió.

## Bloque 2 — Un fallo de impresión no se anuncia como foto perdida
1. **Fotocabina**, `src/app/evento/fotocabina/[fiestaId]/page.tsx`: `handleImprimir` (~857-890) guarda el fallo de impresión en
   `errorMsg`, el mismo estado que usa la subida. Con eso el título dice "No se pudo publicar" (~1866) y el texto "Tu foto no llegó
   al muro" (~1878), aunque la foto se haya subido o no haya muro (`hayMuro` ~257). Separá el fallo de impresión en su propio
   estado (`avisoDeImpresion`) con su aviso ("No se pudo imprimir. Probá de nuevo o pedile ayuda al equipo"), que no cambie el
   título ni el texto del muro, y que se limpie al empezar la captura siguiente (error 10 de CLAUDE.md).
2. **Vogue**, `src/app/evento/bogue/[fiestaId]/page.tsx` ~1384: lo mismo con `uploadError`. El recuadro del QR muestra "Fallo
   conexión" (~1476-1478) por un bloqueo de la ventana de impresión. Mismo arreglo: estado aparte.

## Barrido en toda la app
- Instrucciones de la IA que contradicen decisiones del dueño (pregunta 239): `grep -rniE "congelamos|seña del [0-9]+ ?%|garantiz|24 ?hs|24/7" src/types src/data src/ai src/lib/asistente src/app/actions`
  y mirar cada prompt o respuesta guardada, no sólo las pantallas.
- Un mismo estado de error compartido por dos fallas distintas (pregunta 240): en `src/app/evento/*/[fiestaId]/page.tsx`, buscar
  dónde `imprimirRecuerdo(` guarda su aviso: ¿en el mismo estado que la subida?
Plata (la seña): se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar la personalidad de Sofía ni sus otras respuestas.
- No decir precios que no estén en la lista (decisión del 14/11).

## Qué tiene que comprobar la prueba
- `src/__tests__/sofia-no-congela-ni-inventa-la-senia.test.ts`: las instrucciones que arma `simulador-copilot.ts` no contienen
  "congelamos" ni "30%", y con la seña de Ajustes en $5.000 contienen "$5.000".
- `tests/e2e/la-impresion-fallida-no-dice-foto-perdida.spec.ts`: en la fotocabina, con la impresión bloqueada (`window.open`
  devolviendo `null`) y la foto subida, la pantalla no dice "No se pudo publicar" ni "no llegó al muro", y sí el aviso de impresión.

```comprobar
no-usa: congelamos el precio en src/types/copilot.ts
no-usa: congelamos el precio en src/data/copilot-config.json
no-usa: seña del 30% en src/types/copilot.ts
usa: avisoDeImpresion en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: avisoDeImpresion en src/app/evento/bogue/[fiestaId]/page.tsx
prueba: src/__tests__/sofia-no-congela-ni-inventa-la-senia.test.ts
prueba: tests/e2e/la-impresion-fallida-no-dice-foto-perdida.spec.ts
```
