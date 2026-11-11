# Orden 275 — Videos para redes de cada fiesta, armados solos y publicados con un toque (11/11/2026)

**Para Gemini, en la computadora del dueño.** Va **en la misma entrega que las órdenes 274 y 273**, rama
`gemini/orden-274-editor-fiesta-entera`, sin fusionar. Repasá `docs/ANTES-DE-ENTREGAR.md`.

**Decisiones del dueño (11/11/2026), y no se discuten:**

- **Se arman en su computadora**, con el AK Editor: costo cero. No en el servidor de la app.
- **Se publican con un toque suyo**, nunca solos. En los XV salen menores: el toque le deja frenar una foto.
- **Sólo con fotos de fiestas cuyo cliente dio permiso de usar fotos para promoción.** El control ya existe:
  `fotosPromocionalesDeFiesta(eventId)` en `src/lib/asistente/comercial-borrador.ts` (~159). **No se arma otro.**

**Lo que ya existe y no se toca:**

- el video resumen vertical del álbum (`src/lib/video-resumen/generar-video-resumen.ts`);
- los borradores posfiesta (`generarBorradoresPosfiesta` en `src/lib/presencia-digital/autogenerador-semanal.ts` ~52);
- el publicador (`publishPostInternal` y `procesarPosteosProgramados` en `src/lib/presencia-digital/publicador.ts`);
- el interruptor `borradores_redes_posfiesta` de las reglas de la IA.

## Bloque 1 — En la app: bajar el material para redes de una fiesta

- Ruta nueva `src/app/api/fiestas/[id]/material-redes/route.ts`, con `requirePermiso(PERMISOS.CRM)`, como
  `enviarABorradorDeContenido` en `src/app/actions/creador-anuncios.ts` (~186).
- Devuelve un `.zip` con:
  - **sólo** las fotos y videos de `fotosPromocionalesDeFiesta(id)`, en carpetas por estación según el `sourceModule`
    de cada una: `fotocabina/`, `plataforma-360/`, `vogue/`, `espejo/`, `pantalla-gigante/`, `barra/`, `muro/`;
  - el mismo `estilo.json` de la orden 273 (plantilla y colores de la web, nombres y fecha).
- **Si la fiesta no tiene permiso de promoción**, no baja nada y dice: "Esta fiesta no tiene permiso para usar las
  fotos en redes".
- En la ficha de la fiesta, dentro de Presencia digital, un botón "Bajar material para redes".

## Bloque 2 — En el AK Editor: modo "Redes"

Se carga ese `.zip`. Por cada estación con material, y una más con "la noche completa", arma **tres formatos**:

- **Reel e historia, 9:16 (1080×1920), de 15 a 30 s**: para Instagram, Facebook y TikTok;
- **cuadrado, 1:1 (1080×1080)**: para el muro de Facebook;
- **vertical de muro, 4:5 (1080×1350)**: para el muro de Instagram.

Cada video lleva:

- las mejores fotos o clips de esa estación, con caras y sin desenfoque (usá el análisis que ya existe);
- **los cambios al ritmo de la música** (lo mismo que el Video de Vida);
- movimiento hacia la cara y transiciones de la plantilla;
- el logo de AK y, en el último segundo, una placa de cierre con "AK Producciones" y el contacto de "Marca AK";
- **música de la carpeta "Música para redes"** que el dueño carga una vez.

  **Avisá en pantalla, en criollo:** Instagram y Facebook pueden silenciar un video con música que tenga dueño. Lo
  seguro es música libre o la que el dueño tenga permiso de usar.

Para la barra, "Los tragos de la noche": los tragos que se sirvieron, con las fotos de la barra.

Todo sale en `Documentos\AK Editor\<fiesta>\redes\`, con nombres claros (`fotocabina-reel.mp4`,
`fotocabina-cuadrado.mp4`…) y un `redes.json` que dice estación, formato y duración de cada uno. **Vista previa** de
cada video antes de terminarlo.

## Bloque 3 — De vuelta a la app: borradores con el texto ya escrito

- Las acciones nuevas van en `src/app/actions/videos-para-redes.ts`, con `requirePermiso(PERMISOS.CRM)`.
- En Presencia digital, un botón **"Subir los videos de la fiesta"**: se elige la carpeta `redes\` entera de una vez.
  Lee `redes.json`, sube cada video (`uploadToStorage`, `src/lib/firebase/storage.ts` ~45) y crea **un borrador por
  red y formato**.
  - Son `SocialPost` (`src/types/social-media.ts`) con `status: 'Borrador'`, `mediaType: 'video'`, `eventId` y
    `eventName`.
  - Al reel van Instagram, Facebook y TikTok; al cuadrado, Facebook; al 4:5, Instagram.
- **El texto de cada publicación lo escribe la IA**, con la guía de estilo que ya se aprende de lo aprobado
  (`aprenderDeLoAprobado('redes-sociales')` y `resumirGuiaDeEstilo`, como en `generarBorradoresPosfiesta`). Lleva la
  estación, el tipo de fiesta y los hashtags del rubro.
  - Respeta lo que no se escribe nunca (`CLAUDE.md`): sin "garantía", sin "24/7", sin precios y sin nombrar a nadie
    del personal.
  - **Sin el nombre de la quinceañera ni de los invitados, salvo que el dueño lo agregue.**
- Los borradores se guardan con `mutateGenericJsonArray('social-posts.json', …)`, **no** con `writeData` de la lista
  entera (dos subidas a la vez no se pisan).
- **Un toque para publicar:** cada borrador muestra el video, el texto (se puede editar) y "Publicar" / "Descartar".
  "Publicar" lo pasa a `Programado`, con la fecha del mejor horario (`calcularProximaFechaMejorHorario`), y lo publica
  el publicador que ya existe. **Nada se publica sin ese toque.**

## Pruebas

- `src/__tests__/el-material-para-redes-respeta-el-permiso.test.ts`:
  - una fiesta sin permiso de promoción no baja nada;
  - una con permiso baja sólo sus fotos autorizadas, en la carpeta de su estación;
  - el personal sin permiso de CRM no baja nada.
- `src/__tests__/los-videos-subidos-quedan-en-borrador.test.ts`:
  - subir tres videos crea los borradores por red, con `status: 'Borrador'`, y **ninguno queda Programado ni
    Publicado sin el toque**;
  - dos subidas a la vez no pierden borradores (la base de mentira devuelve una COPIA en cada lectura, error 11 de
    `CLAUDE.md`);
  - el texto no tiene "garantía" ni "24/7" ni precios.
- `herramientas/ak-editor/pruebas/test_redes_tres_formatos.py`: con fotos de dos estaciones arma los videos de cada
  una más "la noche completa", cada uno en sus tres medidas exactas (1080×1920, 1080×1080 y 1080×1350), con el logo en
  el último segundo.
- `tests/e2e/subir-videos-de-la-fiesta.spec.ts`: en Presencia digital, el botón "Subir los videos de la fiesta"
  aparece y, cortando la subida, la pantalla dice cuántos borradores va a crear.

```comprobar
archivo: src/app/api/fiestas/[id]/material-redes/route.ts
usa: fotosPromocionalesDeFiesta en src/app/api/fiestas/[id]/material-redes/route.ts
usa: mutateGenericJsonArray en src/app/actions/videos-para-redes.ts
archivo: herramientas/ak-editor/redes.py
prueba: src/__tests__/el-material-para-redes-respeta-el-permiso.test.ts
prueba: src/__tests__/los-videos-subidos-quedan-en-borrador.test.ts
prueba: herramientas/ak-editor/pruebas/test_redes_tres_formatos.py
prueba: tests/e2e/subir-videos-de-la-fiesta.spec.ts
```
