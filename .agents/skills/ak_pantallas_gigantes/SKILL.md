# Habilidad Experta: Adaptación de Pantallas y Diseño Visual (Tótems, Espejo y Murales)

Esta guía de habilidades establece las reglas de diseño y maquetación responsiva para las pantallas del ecosistema de eventos de **AK Producciones**, con especial enfoque en la adaptación de proporciones verticales (tótems/selfies) y horizontales (pantalla gigante LED/proyector).

---

## 1. Reglas para Pantallas Verticales (Tótems y Espejo Mágico)

* **Proporción y Contenedores:** Las pantallas verticales de tótems y espejos físicos deben respetar el ratio nativo 9:16. El contenedor principal de la vista debe limitarse a un ancho máximo relativo a la altura de la pantalla (`max-w-[56.25vh]`) para prevenir estiramientos y asegurar que el contenido se dibuje en el área visible física.
* **Layouts de Fotos:** Las fotos y previsualizaciones de selfies se deben maquetar con una proporción de aspecto `aspect-[4/5]` enmarcadas en tarjetas con bordes estilizados y redondeados, emulando la estética Polaroid o tarjetas flotantes modernas.
* **Fondos Dinámicos:** Los fondos de los tótems deben admitir configuraciones de ambiente fluido:
  * **Aurora:** Degradados neón en constante movimiento (drift) usando desenfoques blur gigantes.
  * **Spotlights:** Luces con origen superior que rotan simulando focos de discoteca.
  * **Social Rain / Photo Float:** Fotos de invitados en caída o flotación suave con opacidad baja.

---

## 2. Reglas de Adaptación en la Pantalla Gigante (Muro en Vivo)

Al mostrar selfies o fotos de tótems (proporción vertical 9:16 o 4:5) en una pantalla gigante horizontal (proporción 16:9), se deben aplicar obligatoriamente los siguientes criterios de encuadre para evitar distorsiones y barras negras:

1. **Efecto de Relleno Difuminado (Blur Backdrop):** 
   * Se debe renderizar un duplicado de la foto en pantalla completa de fondo (`fill`), escalado (`scale-110`), desenfocado (`blur-2xl`) y con opacidad reducida (`opacity-40`). 
   * Esto llena los laterales vacíos de la pantalla horizontal con los colores dominantes del propio retrato.
2. **Contenedor Principal (Main Portrait Foto):**
   * La foto original debe dibujarse en el centro exacto por encima del fondo difuminado, configurada con ajuste de contenedor (`object-contain`).
   * **Prohibición de Recortes (No Crop):** Jamás utilizar `object-cover` en la foto principal para retratos verticales, ya que recortaría la cabeza o las piernas de los invitados en la pantalla gigante.
3. **Efecto Flash y Polaroid en Nuevas Capturas:**
   * Cuando ingresa una foto nueva, la pantalla debe pausar el carrusel y mostrar la foto con un marco Polaroid blanco de bordes redondeados y una rotación aleatoria leve (entre -3 y 3 grados).
   * Se debe activar un overlay blanco de transición rápida con opacidad (`animate-pulse` o transición similar) para simular el flash de una cámara fotográfica.

---

## 3. Directrices Visuales y de Rendimiento

* **Paleta de Colores y Sombras:** Uso exclusivo de colores oscuros premium (`slate-950`, `black`), acentos con gradientes neón (`indigo`, `purple`, `cyan`) y sombras difusas multinivel (`shadow-2xl`, `backdrop-blur`).
* **Optimización de Carga:** El carrusel y mosaico en vivo deben usar la propiedad `unoptimized` para imágenes Next.js que provienen de URLs dinámicas de Firestore, reduciendo la latencia de carga en tiempo real durante el evento.
