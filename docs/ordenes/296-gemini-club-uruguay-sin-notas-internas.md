# Orden 296 — Club Uruguay: el cliente no ve notas internas (13/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 295** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 106.

Sale de una revisión comercial de la página `/club-uruguay` (13/11/2026). Los bloques 1 a 3 arreglan notas internas a
la vista del cliente y datos viejos. **Los bloques 4 a 7 los aprobó el dueño el 13/11/2026** ("a todo sí"): foto de
apertura, historia más corta, frases sin tono defensivo y galería con el lugar.

## Lo que NO se toca

- **El 50% de bonificación del Club Uruguay**: es decisión del dueño (el tachado es siempre el doble del precio). Se
  cambia sólo la etiqueta de arriba, no el número ni la condición.
- Los botones ("Coordinar una visita" por WhatsApp y "Calcular en el simulador"), sus enlaces y el reloj del simulador.
- Las preguntas frecuentes y la dirección del Club.
- No se agrega ningún sello de "verificado" ni cifras nuevas de capacidad: se usan sólo las que ya están.

## Barrido en toda la app (Claude, 13/11/2026)

- **Descripción interna en las fotos:** `"Foto cargada desde el módulo maestro de salones."` se muestra debajo de cada
  foto y en el visor (`ClubUruguayInteractive.tsx` ~345 y ~426). Está en `src/app/club-uruguay/page.tsx` ~86 **y** en la
  portada, `src/app/page.tsx` ~359.
- **Etiquetas de trabajo:** "Condición comercial del dueño" (`club-uruguay/page.tsx` ~416), "Sin cuentas regresivas
  inventadas ni modificaciones en el simulador" (~422), "(informadas, no habilitación legal certificada)" (~174),
  "Por confirmar:" (`ClubUruguayInteractive.tsx` ~217 y ~267).
- **Dato viejo:** "conmemora su sesquicentenario en 2025" (`club-uruguay/page.tsx` ~204), leído en noviembre de 2026.
- **Título de la pestaña repetido:** el armazón (`src/app/layout.tsx` ~69) ya agrega `| AK Producciones`, y estas
  páginas también lo ponen en su `title`, así que la pestaña dice "AK Producciones" dos veces: `club-uruguay/page.tsx`,
  `bodas/page.tsx`, `entrar/page.tsx`, `simulador-ak/layout.tsx`, `evento/fotocabina/layout.tsx`,
  `evento/plataforma-360/layout.tsx`, `evento/bogue/layout.tsx`, `evento/hub/layout.tsx`, y en el panel
  `(app)/empresa/presencia-digital/page.tsx` y `(app)/contabilidad/crm/marketing-ads/page.tsx`.
- Descartado: el resto de las páginas públicas no tiene notas internas a la vista (búsqueda de "módulo maestro",
  "del dueño", "Por confirmar:", "no habilitación", "inventad" en `src/app` y `src/components`, sin contar comentarios).

## Bloque 1 — Sacar las notas internas (P2, lo ve el cliente)

- `description` de las fotos del maestro (en las dos páginas): `undefined` (sin texto). El visor ya no muestra nada si
  no hay descripción.
- Etiqueta "Condición comercial del dueño" → **"Beneficio con AK Producciones"**.
- Sacá la frase "Sin cuentas regresivas inventadas ni modificaciones en el simulador." entera (el resto del párrafo queda).
- `(informadas, no habilitación legal certificada)` → sacá el paréntesis; queda "50 a 250 personas según el montaje".
- "Por confirmar:" → **"Se coordina:"** (los dos lugares).

## Bloque 2 — El aniversario dicho en pasado (P3)

"conmemora su sesquicentenario en 2025" → **"en 2025 cumplió 150 años"**. No cambies el resto del párrafo.

## Bloque 3 — "AK Producciones" una sola vez en la pestaña (P3)

En los archivos del barrido, sacá el `| AK Producciones` final del `title` (el armazón lo agrega solo). Donde el título
**no** pasa por el armazón (`openGraph`, `twitter`), dejalo como está.

## Bloque 4 — La foto de apertura muestra el lugar (aprobado por el dueño)

`getClubUruguayHeroPhoto` (`src/lib/salon-helper.ts` ~41) hoy cae siempre en `HERO_CLUB_URUGUAY_PHOTO` (una foto con
equipos y postes adelante). Orden nuevo, el primero que exista gana:
1. una foto marcada `isHero && aprobada` (como ahora);
2. **la primera foto del módulo de Salones del Club** (`salon.fotos[0]`, la que carga el equipo): pasala como argumento
   desde `src/app/club-uruguay/page.tsx` ~91 y `src/app/page.tsx` ~362;
3. `HERO_CLUB_URUGUAY_PHOTO` como respaldo.
Probá el recorte de la apertura a 390 px y a 1280 px (`object-position` centrado).

## Bloque 5 — La historia en un bloque corto (aprobado por el dueño)

En `src/app/club-uruguay/page.tsx` ~201-210, reemplazá título y párrafos por:
- Título: **"Historia que se vuelve parte de tu fiesta"**.
- Texto: **"El Club Uruguay forma parte de la historia de Salto: en 2025 cumplió 150 años. Su identidad le da un marco
  propio a cada celebración, y con AK Producciones la fiesta se organiza alrededor de tu estilo y de cómo querés vivir
  ese día."**
Sale "museo intocable", "señorial", "protocolar" y "sesquicentenario". El mural se puede nombrar en una frase si ya
estaba, sin decir que tiene una protección oficial.

## Bloque 6 — Frases sin tono defensivo (aprobado por el dueño)

- `club-uruguay/page.tsx` ~181: "La consulta por WhatsApp inicia la conversación… no es una cita confirmada
  automáticamente." → **"Escribinos y coordinamos una visita según disponibilidad."**
- ~321: "Diferenciamos con honestidad las instalaciones…" → dos subtítulos, **"El lugar"** (lo que aporta el Club) y
  **"La organización de tu fiesta"** (lo que se contrata con AK), con las listas que ya están debajo.
- `ClubUruguayInteractive.tsx` ~306: "Inspeccioná fotos reales… zoom accesible." → **"Conocé el lugar y mirá cómo se
  transforma para una fiesta. Tocá las fotos para verlas en detalle."**
- `ClubUruguayInteractive.tsx` ~241: "Formato contenido" → **"Para reuniones más chicas"**.
- `ClubUruguayInteractive.tsx` ~289: el párrafo "Aclaración sobre aforos y fotografías…" se saca; las capacidades ya
  figuran arriba.
- Donde la página nombra el servicio de video, decí **"filmación"**.

## Bloque 7 — La galería muestra el lugar primero (aprobado por el dueño)

En `src/app/club-uruguay/page.tsx` ~92, el orden de `allPhotos` pasa a ser: la de apertura, **después las fotos del
módulo de Salones** (`masterPhotos`, que es donde el equipo sube salón, patio, hall y balcón), y al final las de fiestas
(`curated`). Títulos de las del módulo: "El lugar" y "Vista N" (sin la descripción interna del bloque 1). No hay límite de
cantidad: si el equipo sube más fotos en Salones, aparecen solas.

## Pruebas

- `src/__tests__/el-cliente-no-ve-notas-internas.test.tsx`: renderizá `ClubUruguayInteractive` con una foto sin
  descripción y comprobá que no aparece "módulo maestro" ni "Por confirmar"; y leé `src/app/club-uruguay/page.tsx` y
  `src/app/page.tsx` y comprobá que no tienen "módulo maestro", "Condición comercial del dueño", "cuentas regresivas
  inventadas" ni "no habilitación legal".
- `src/__tests__/la-apertura-del-club-muestra-el-lugar.test.ts`: con `salon.fotos = ['/a.jpg']` y sin foto `isHero`,
  `getClubUruguayHeroPhoto` devuelve `/a.jpg`; sin fotos del módulo, devuelve `HERO_CLUB_URUGUAY_PHOTO`; y en la lista de
  la galería las del módulo van antes que las de fiestas.
- En `tests/e2e/club-uruguay-visita-y-galeria.spec.ts`, sumá: se ve "Historia que se vuelve parte de tu fiesta" y no se ve
  "museo intocable"; el título de la pestaña contiene "AK Producciones" **una
  sola vez**, y la página no muestra "Condición comercial del dueño".

```comprobar
no-usa: módulo maestro de salones en src/app/club-uruguay/page.tsx
no-usa: módulo maestro de salones en src/app/page.tsx
no-usa: Condición comercial del dueño en src/app/club-uruguay/page.tsx
no-usa: cuentas regresivas inventadas en src/app/club-uruguay/page.tsx
no-usa: no habilitación legal certificada en src/app/club-uruguay/page.tsx
no-usa: Por confirmar: en src/components/club-uruguay/ClubUruguayInteractive.tsx
no-usa: conmemora su sesquicentenario en src/app/club-uruguay/page.tsx
no-usa: | AK Producciones' en src/app/bodas/page.tsx
prueba: src/__tests__/el-cliente-no-ve-notas-internas.test.tsx
prueba: src/__tests__/la-apertura-del-club-muestra-el-lugar.test.ts
usa: Historia que se vuelve parte de tu fiesta en src/app/club-uruguay/page.tsx
no-usa: museo intocable en src/app/club-uruguay/page.tsx
no-usa: Diferenciamos con honestidad en src/app/club-uruguay/page.tsx
no-usa: zoom accesible en src/components/club-uruguay/ClubUruguayInteractive.tsx
usa: coordinamos una visita según disponibilidad en src/app/club-uruguay/page.tsx
```
