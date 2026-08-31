# La Mirada de Crítico — Pantalla por Pantalla

**Para el dueño y el equipo. Escrita el 31 de agosto de 2026.**

> *"Que lo que es, sea; para lo que existe, que funcione; si se puede mejorar en todo, desde estética a funcionalidad; y si está en el lugar equivocado se debe reorganizar, como un crítico."*

---

## 1. ROTO — Lo que no funcionaba (con archivo y línea)
*Todo lo de esta lista fue reparado y verificado con pruebas.*

1. **Acceso a "¿Dónde me siento?" huérfano (`src/lib/guest-portal/public-event-navigation.ts:128`):**
   - El invitado que entraba a la red social o al hub digital no tenía cómo buscar su mesa sin que alguien le alcanzara un QR impreso por separado. Se añadió la herramienta `mesa` enlazada a `/evento/mi-mesa/[fiestaId]`.
2. **Cronograma de la fiesta en vivo vacío (`src/app/evento/social/[fiestaId]/page.tsx:1120`):**
   - Durante la noche la red social no mostraba el cronograma porque buscaba propiedades viejas en vez de `event.programa`. Arreglado para reflejar el itinerario en vivo.
3. **Catálogo de invitaciones limitado a 2 opciones (`src/components/invitacion/templates/index.ts:1`):**
   - Zola y Joy ofrecen cientos de estilos; la app sólo tenía Grazia y Allegria. Se diseñaron y exportaron 6 plantillas nuevas (`XvModerna`, `XvClasica`, `BodaMinimalista`, `BodaCampo`, `FiestaNoche`, `Corporativo`).
4. **Buzón nocturno con fondo blanco encandilante (`src/app/evento/buzon/[fiestaId]/page.tsx:1`):**
   - En un salón a oscuras la pantalla blanca molestaba a los invitados. Se oscureció (`bg-zinc-950 text-white`).
5. **Tiras de fotocabina atadas a un solo formato (`src/lib/entretenimiento/tira-fotocabina.ts:1`):**
   - Faltaban los layouts estándar del rubro. Se agregaron `strip_3` (2x6), `single_photo` (10x15) y `strip_4` (collage).

---

## 2. INCÓMODO — Cuántos pasos tiene hoy y cuántos podría tener
*Propuestas de simplificación ordenadas por impacto en la operación diaria.*

1. **Carga y ordenamiento del Video de Vida (`/fiestas/nueva/video-vida`):**
   - *Hoy:* 4 pasos (subir fotos, esperar previsualización individual, arrastrar una a una, guardar).
   - *Podría ser:* 1 paso con botón "Subir lote y ordenar automáticamente por fecha de captura EXIF".
2. **Creación y envío de presupuestos rápidos (`/presupuestos/nuevo`):**
   - *Hoy:* 3 pasos entre pantallas para configurar ítems, calcular totales y abrir el visor del PDF.
   - *Podría ser:* 1 paso con botón flotante "Vista previa rápida / Compartir WhatsApp" directo en la barra superior del editor.
3. **Asignación masiva de mesas para más de 80 invitados (`/fiestas/nueva/invitados`):**
   - *Hoy:* Arrastrar invitado por invitado desde la columna sin asignar.
   - *Podría ser:* Casillas de verificación múltiple + menú desplegable "Asignar seleccionados a Mesa X" (2 clics para 10 personas).
4. **Envío de tarjeta digital por WhatsApp (`/settings/whatsapp`):**
   - *Hoy:* Copiar enlace en portapapeles, abrir WhatsApp Web a mano y pegar mensaje.
   - *Podría ser:* Botón `Enviar mensaje directo` que abra `https://wa.me/?text=...` con el saludo y el enlace ya insertados.
5. **Consulta de disponibilidad de stock al comprar insumos (`/compras`):**
   - *Hoy:* Salir de compras, ir a `/insumos`, anotar stock actual y volver a compras.
   - *Podría ser:* Columna con stock disponible en depósito al lado de la cantidad sugerida para la fiesta.

---

## 3. FEO — Qué se ve mal y en qué pantalla
*Detalles visuales y de jerarquía que afectan la percepción de calidad.*

1. **Torre de Control (`/control-tower`):**
   - Exceso de bordes grises y tipografías comprimidas en los bloques de automatizaciones; faltan espaciados generosos y acentos de color suaves.
2. **Copia de seguridad y estado del sistema (`/settings/backup-final`):**
   - Bloques con tipografía monoespaciada sin estilizar que parecen mensajes de error de servidor en vez de un reporte limpio de respaldo.
3. **Check-in de invitados en puerta (`/evento/actual/checkin`):**
   - Botón de confirmación táctil sin feedback visual inmediato al tocar en tablets o pantallas con guantes/luz baja.
4. **Menú gastronómico en el portal del cliente (`/portal-cliente/[id]/menu`):**
   - En celulares angostos las descripciones largas de platos desbordan horizontalmente la tarjeta en vez de truncar con botón "ver detalle".
5. **Estado de cuenta con múltiples monedas (`/presupuestos/[id]/estado-de-cuenta`):**
   - Cuando conviven saldos en pesos uruguayos y dólares americanos, los totales aparecen con el mismo tamaño y peso visual, confundiendo el saldo pendiente real.

---

## 4. MAL UBICADO — Colgado, duplicado o en la sección equivocada
*Reorganizaciones sugeridas para mantener las 353 pantallas limpias y encontrables.*

1. **Carga de fotos de Video de Vida duplicada:**
   - `src/app/(app)/fiestas/nueva/video-vida/page.tsx` y `src/app/portal-cliente/[id]/fotos-video/page.tsx` replican la misma lógica de subida y previsualización. Deben usar el mismo componente compartido.
2. **Plantillas de Carga Operativa (`/settings/templates/carga-operativa`):**
   - Está guardada adentro de Ajustes Generales de la empresa, cuando el personal de logística la busca en `/fiestas/nueva/logistica` o en el módulo de Armado.
3. **Galería LED y Presentación LED en la raíz (`/galeria-led` y `/presentacion-led`):**
   - Rutas huérfanas en la raíz del router público; deberían vivir bajo `/evento/pantalla/...` agrupando todas las salidas para pantallas gigantes.
4. **Importar presupuesto desde texto (`/presupuestos/importar`):**
   - Pantalla sin botón de acceso en el listado de presupuestos; el comercial sólo puede llegar escribiendo la URL a mano. Debe agregarse como botón "Importar" al lado de "Nuevo Presupuesto".
