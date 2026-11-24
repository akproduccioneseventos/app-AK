# Orden 344 — La presentación LED: que no se tape nada, cada servicio con su foto, sin promesas y con la seña real

**Para Gemini. Va en la MISMA propuesta que la 343 y la 345 (rama `gemini/orden-343`).** Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Usá
las habilidades `animaciones-pro` y `vende`.

## Por qué (pedido del dueño, 24/11/2026)
*"Revisá el presupuesto LED de acuerdo al catálogo que yo te había pasado, porque creo que hay que mejorarlo; no está
bien."* El catálogo impreso es el de la orden `docs/ordenes/hechas/presentacion-01-lo-que-cuenta-el-catalogo.md` (logos
con nombre, "Hay equipo", el salón Club Uruguay con sus argumentos, fotos por tipo de evento). Eso **ya está** y no se
rehace. Claude recorrió la presentación entera en 1600×900 (pantalla LED, fiesta de 15 de 120 invitados) y encontró lo de
abajo.

## Bloque 1 — Lo que se tapa: los botones de abajo pisan el contenido
Los botones fijos "Anterior / Siguiente" y los puntos (`src/app/presentacion-led/page.tsx` ~1065-1100) quedan **encima**
del contenido en: Datos del evento (pisan "Duración de la fiesta"), Entradas y Menú (la segunda fila de platos), cada
lámina de servicios (`categoria-servicios-slide.tsx`: el botón "Siguiente" tapa "Agregar a propuesta" de la última
tarjeta), Regalos (la última fila), Plan de pagos (tapa la tarjeta "AK Producciones") y "Siguiente paso" (las preguntas
frecuentes quedan cortadas abajo).
- Cada lámina deja **libre la franja de los botones** (un espacio abajo del alto de la barra) y lo que no entra se
  acomoda (dos columnas, tarjetas más bajas, o desplazamiento interno), **nunca debajo de la barra**.
- La prueba lo mide: en 1600×900 y 1280×720, el rectángulo de la barra no se cruza con ningún botón ni tarjeta de la
  lámina.

## Bloque 2 — Cada servicio con su foto, no la misma para todo
- En las láminas de servicios (`categoria-servicios-slide.tsx`) se repite **la misma foto** ("Party of the year" de la
  Vogue) en Foto álbum 100 fotos, Fotografía 2 horas, Vogue, Espejo mágico, Filmación de exteriores y Filmación de la
  fiesta; y la foto grande de la izquierda es la misma (la de la mesa con el cartel de AK) en Entretenimiento y Otros
  servicios. **Cada servicio muestra su propia foto**: la del catálogo de fotos por servicio (`getCatalogoFotos`, campo
  de servicio) o la `imagenUrl` del servicio; si no tiene ninguna, la de ejemplo del tema correcto (regla del dueño: *"si
  no hay foto, va una de ejemplo"*), **nunca la de otro servicio**. La foto grande de cada lámina es una destacada de esa
  categoría.
- En **Regalos** (`regalos-slide.tsx`) los ocho regalos (álbum digital, fuegos fríos, invitaciones, lluvia de burbujas,
  mesa de café, organización, pantalla gigante, video de vida) muestran **la misma foto de comida**. Igual que arriba:
  cada regalo con la suya.
- Donde hoy aparece una imagen rota con su texto alternativo ("Imagen lateral beneficios", "Foto del salón", "Foto
  emocional de un evento exitoso", "Foto de contratación / forma de pago"): si la foto cargada en Ajustes no abre, se usa
  una propia de AK del tema (salón → `/media/catalogo-servicios/` del Club Uruguay; las otras → una foto destacada de
  fiestas), **nunca el recuadro roto**.

## Bloque 3 — Textos: sin promesas y con las cifras decididas
Decisiones del dueño (CLAUDE.md, 28/9 y 13/11): no se escribe "garantía", "24/7", promesas absolutas, ni cifras
distintas de **"+200"** y **"+7 años"**.
- `testimonios-slide.tsx` ~68: "Más de 500 familias eligieron…" → **"Más de 200 fiestas nos eligieron…"**.
- `beneficios-slide.tsx`: "Resolución inmediata ante cualquier imprevisto" → **"Un equipo atento a cada imprevisto"**;
  "Puntualidad en cada etapa" → **"Cada etapa coordinada"**; "Calidad premium en servicios y ejecución" →
  **"Servicios propios, con equipo propio"**.
- `equipo-slide.tsx` ~163: "Tranquilidad Absoluta" → **"Tranquilidad"**, y su frase sin "lo que otros tercerizan". El
  número de personas del título (~79, "10 profesionales") y de la frase tienen que ser **el mismo** y salir del contenido
  por tipo (`contenido-por-tipo.ts`, `equipo.cantidadPersonas`).
- El 15% de ajuste, si aparece, dice **"ajuste anual del 15% acumulativo"** sin montos de años futuros (orden 345).

## Bloque 4 — El plan de pagos con la seña real (plata: lo revisa Claude)
`plan-pagos-slide.tsx` ~34-52 arma la cuota de reserva como **30%** del total. **Está mal:** la seña es **$5.000 y se
cambia en Ajustes** (`bookingDepositAmount` en `src/types/settings.ts` ~27, por omisión 5000 ~50; lo lee
`getBudgetDisplaySettings`, que la presentación ya carga); **el 30% es la penalidad por cancelar**, no la seña (decisión
del dueño, 11/11/2026).
- Reserva = **la seña de Ajustes** (monto fijo). El resto del total se reparte en el segundo pago y el saldo final con los
  porcentajes de hoy sobre lo que queda (40/60 de lo que resta, o como lo arme el plan de pagos del presupuesto si existe:
  usá la misma función que el presupuesto manual, no una cuenta aparte).
- Sin servicios elegidos, en vez de "—" se ve **"Seña para reservar la fecha: $5.000"** y "El resto, en cuotas antes de
  la fiesta".

## Bloque 5 — El cierre, más corto y sin repetir
- "Contratarnos" (`contratarnos-slide.tsx`) hoy es una lámina casi vacía con una foto rota y otro botón "Generar
  Presupuesto Manual" (verde-violeta) que ya está en "Siguiente paso". Juntá las dos en **una sola lámina de cierre**: datos
  del evento, total estimado, **un** botón "Generar presupuesto" (rojo de marca), WhatsApp, y las preguntas frecuentes
  que entren sin cortarse. La otra se saca del recorrido (sin borrar el archivo si lo usa otro lado).
- `formas-de-pago-slide.tsx` no se usa en `page.tsx`: si no la llama nadie, se borra (regla de no dejar código muerto).

## Lo que NO hay que hacer
- No tocar los logos, el "Hay equipo", el salón ni el contenido por tipo: ya están como el catálogo.
- No cambiar precios ni cómo se calculan los totales de los servicios (sólo el reparto del plan de pagos del bloque 4).
- No sacar el 10% promocional ni el Club Uruguay 50% OFF.

## Qué tiene que comprobar la prueba
- `tests/e2e/la-presentacion-led-no-tapa-nada.spec.ts`: recorre todas las láminas (15 años, 120 invitados) en 1600×900 y
  1280×720 y en cada una ningún botón o tarjeta se cruza con la barra de abajo; ninguna imagen queda rota
  (`naturalWidth > 0`); en las láminas de servicios no hay dos tarjetas con la misma foto; en Regalos tampoco.
- `src/__tests__/el-plan-de-pagos-de-la-led-usa-la-sena.test.ts`: con seña $5.000 y total $300.000, la reserva es $5.000
  (no $90.000); con la seña cambiada en Ajustes a $8.000, la reserva es $8.000.
- `src/__tests__/la-led-no-promete.test.ts`: los textos de las láminas no contienen "500 familias", "Absoluta",
  "inmediata" ni "garant".

```comprobar
no-usa: 500 familias en src/app/presentacion-led/slides/testimonios-slide.tsx
no-usa: Tranquilidad Absoluta en src/app/presentacion-led/slides/equipo-slide.tsx
no-usa: Resolución inmediata en src/app/presentacion-led/slides/beneficios-slide.tsx
# Bloque 4
usa: bookingDepositAmount en src/app/presentacion-led/slides/plan-pagos-slide.tsx
no-usa: PORCENTAJE_RESERVA = 30 en src/app/presentacion-led/slides/plan-pagos-slide.tsx
# Bloque 1
prueba: tests/e2e/la-presentacion-led-no-tapa-nada.spec.ts
prueba: src/__tests__/el-plan-de-pagos-de-la-led-usa-la-sena.test.ts
prueba: src/__tests__/la-led-no-promete.test.ts
```
