# Orden 309 — El blog trae noticias y tendencias del mundo, todos los días

**Pedido del dueño, 16/11/2026:** *"que busque noticias todos los días a nivel mundial y tendencias de fiestas,
eventos, bodas y 15 años; que se mezcle entre consejos y noticias/tendencias, siempre vendiendo el servicio al final"*.

Va en la **misma propuesta** que el resto de tu trabajo de hoy. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Lo que ya existe (NO rehacer)

- `src/lib/blog-ai-generator.ts` → `generateBlogPostAndSocialDraft()` (línea ~120): elige un tema de consejo
  (`selectUnusedTopic`, línea ~68), investiga con `googleSearchRetrieval` (línea ~134) y guarda en `blog-posts.json`.
- La tarea `generate-blog-post` en `src/lib/automatico/tareas-automaticas.ts` (línea ~45), `cadaHoras: 56`.
- Las reglas de no prometer: `src/lib/blog/sin-promesas.ts` (`textoQuePromete`, `corregirPromesasDelBlog`,
  `DATOS_DE_AK_PARA_EL_BLOG`). **No se tocan y aplican igual a las notas nuevas.**
- La foto sale de `fotoDeLaNota` (`src/lib/blog/foto-de-la-nota.ts`). No cambiar.

## Bloque 1 — Tipo de nota

- `src/types/blog.ts`, interfaz `BlogPost`: agregar `tipoNota?: 'consejo' | 'tendencia'` (las viejas sin campo = consejo).
- En la pantalla pública del blog (`src/lib/blog-display.ts` y la página que la usa) mostrar una etiqueta chica
  "Tendencias" en las de tipo `tendencia`. Nada más cambia en la pantalla.

## Bloque 2 — La nota de tendencias

En `src/lib/blog-ai-generator.ts`, nueva `generarNotaDeTendencias()` que reutiliza el mismo armado y guardado:

1. **Investigación**: `googleSearchRetrieval` con una búsqueda de lo publicado en los **últimos 30 días** sobre
   tendencias y novedades mundiales de bodas, quince años y fiestas (decoración, música, comida, tecnología en eventos).
   Pedir las fuentes con su enlace. **Si la búsqueda no trae al menos 2 fuentes, no se escribe la nota**: se marca la
   corrida con `marcarFallo` y el motivo, y ese día sale una de consejo.
2. **Redacción**: el mismo tono y las mismas reglas del prompt actual (línea ~150), y además:
   - Cada novedad nombra de dónde sale (la fuente), y se lista en `fuentes`. **No inventar noticias, cifras, marcas ni
     famosos** que no estén en las fuentes.
   - Se adapta a Salto: "¿cómo se aplica esto en tu fiesta?".
   - **Cierre que vende, siempre**: el último apartado lleva a AK con la llamada al Simulador de Presupuestos (la misma
     `cta` que usan hoy las notas). Sin promesas (vale `sin-promesas.ts`).
3. `topicKey` = tema + mes, para no repetir la misma tendencia.

## Bloque 3 — Todos los días, mezclado

- Tarea `generate-blog-post`: `cadaHoras: 24` (una nota por día).
- Alterna: **día par consejo, día impar tendencia** (por fecha de Uruguay, `hoyEnUruguay`). Si la de tendencia no sale
  por falta de fuentes, ese día sale la de consejo.
- **Gasto**: una nota por día con la IA en su parte gratis y el tope de la app; no se contrata nada.
- Las notas se publican igual que hoy (no cambiar cómo se publican).

## Qué NO tocar

Las reglas de `sin-promesas.ts`, la foto de la nota, el formato de la nota en la portada, y cualquier texto que hoy
ve el cliente fuera del blog.

## Qué tiene que comprobar la prueba

`src/__tests__/el-blog-trae-tendencias-con-fuentes.test.ts`, con la IA de mentira:
- Día impar con 3 fuentes → se guarda una nota `tipoNota: 'tendencia'` con esas 3 `fuentes` y el último apartado
  con la llamada al simulador.
- Día impar con 1 fuente → **no** se guarda nota de tendencia; se guarda una de consejo.
- Día par → nota de consejo.
- Una nota de tendencia con "garantizado" en el texto sale corregida por `corregirPromesasDelBlog`.

```comprobar
archivo: src/__tests__/el-blog-trae-tendencias-con-fuentes.test.ts
usa: generarNotaDeTendencias en src/lib/blog-ai-generator.ts
usa: tipoNota en src/types/blog.ts
prueba: src/__tests__/el-blog-trae-tendencias-con-fuentes.test.ts
```
