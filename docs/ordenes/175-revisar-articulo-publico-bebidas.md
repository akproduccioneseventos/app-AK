# Orden 175: revisar el articulo publico sobre bebidas

> **Se programa con la orden 176 (para Gemini), que tiene el camino exacto.**

**Responsable sugerido:** Gemini (contenido/marketing).
**Estado:** texto observado en produccion; revision y relectura pendientes.
**Prioridad:** P2, confianza editorial y cuidado de audiencias familiares.
**Base:** lectura publica de solo lectura del articulo `/public/blog/como-calcular-bebida-evento-salto`, 15 de octubre de 2026. Privadas de Claude/Gemini: **NO CONTRASTADAS**.

## Observacion

El articulo titula el calculo "exacto", afirma sin citar una fuente que en Salto la gente consume el doble de agua/refrescos con calor y propone "3 a 4 tragos promedio por adulto". La pagina vende fiestas de 15 y contiene referencias a adolescentes/mocktails, pero no separa claramente las cifras de abastecimiento del evento de una recomendacion individual de consumo, ni explicita la audiencia adulta en la seccion de alcohol.

No afirmar que las cantidades de compra sean falsas ni emitir una conclusion legal. El problema observado es el tono de certeza, la falta de fuente/contexto y la mezcla de edades y alcohol en una pagina comercial para eventos familiares.

## Cambio solicitado

- Conservar el valor logistico del articulo, presentando cifras solo como estimaciones de abastecimiento sujetas a duracion, clima, menu y mezcla real de invitados.
- Sustentar o retirar la afirmacion de que en Salto "la gente consume el doble"; no inventar estadisticas locales.
- Separar el consumo adulto del catering y la hidratacion para menores; no recomendar alcohol ni cantidades de consumo a adolescentes.
- Incorporar una nota sobria de servicio responsable, audiencia +18 donde aplique, agua disponible y opciones sin alcohol; evitar normalizar alcohol en fiestas familiares o de 15.
- Revisar el titular "calculo exacto" para que no prometa una precision inexistente.
- Releer el HTML publicado y una captura desktop/movil despues de la correccion; confirmar imagen, texto y CTA sin superposiciones. No cambiar la estructura ni el resto del sitio sin evidencia.

La JND recomienda ajustar mensajes segun eventos +18, Plus 15 o familiares y promover dispensacion responsable. Su informacion publicada indica consumo cero para adolescentes. La OMS indica que no hay una forma de consumo de alcohol libre de riesgo. Estas fuentes orientan el tono, no sustituyen revision legal.

Fuentes: [JND, Eventos Cuidados](https://www.gub.uy/junta-nacional-drogas/comunicacion/publicaciones/eventos-cuidados), [JND, alcohol y riesgos](https://www.gub.uy/junta-nacional-drogas/comunicacion/comunicados/alcohol-conocer-sus-efectos-tambien-es-forma-prevenir), [OMS, Alcohol](https://www.who.int/en/news-room/fact-sheets/detail/alcohol).

```comprobar
archivo: src/lib/blog/sin-promesas.ts
usa: como-calcular-bebida-evento-salto en src/lib/blog/sin-promesas.ts
prueba: src/__tests__/el-blog-de-bebidas-no-promete.test.ts
```
