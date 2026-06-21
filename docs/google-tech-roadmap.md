# Hoja de Ruta Tecnológica: Integraciones Google y de Vanguardia (AK Producciones)

Este documento detalla la hoja de ruta para la implementación de tecnologías avanzadas e innovadoras en la aplicación de **AK Producciones** (2025/2026). Estas propuestas buscan automatizar procesos de salón, optimizar la interacción de las IA con el código y ofrecer una experiencia interactiva sin igual para los clientes e invitados.

---

## 1. Experiencia Interactiva y Renderizado 3D

### HTML-in-Canvas + WebGPU (Salón Virtual Interactivo)
* **Objetivo**: Permitir a los novios / organizadores diseñar la distribución del salón en 3D interactivo directamente en su navegador web móvil.
* **Detalles Técnicos**: Utilizar la API **HTML-in-Canvas** para incrustar botones e información interactiva legible por IA y traducible dentro del lienzo 3D renderizado por **WebGPU**.
* **Impacto**: Ahorra reuniones físicas de diagramación del salón y proporciona un "efecto wow" inmediato al contratar el servicio.

### WebXR Spatial Computing (Realidad Aumentada en el Salón vacío)
* **Objetivo**: Previsualizar decoración, vajilla e iluminación durante la visita física de los clientes al salón antes del evento.
* **Detalles Técnicos**: Integrar la API de WebXR en el portal del cliente para superponer elementos holográficos en 3D en la pantalla del celular.

---

## 2. Inteligencia Artificial por Voz e Interacción de Agentes

### Gemini Live API (Llamadas de Voz en Vivo con el Planeador IA)
* **Objetivo**: Permitir al cliente configurar su evento y realizar ajustes de presupuesto mediante una conversación de voz fluida y humana en tiempo real.
* **Detalles Técnicos**: Implementar el canal de audio bidireccional y de baja latencia de la **Gemini Live API**.
* **Impacto**: Máxima comodidad para el cliente. La IA actúa como un agente que actualiza la base de datos de Firestore en segundo plano según lo hablado en la llamada.

### WebMCP (Model Context Protocol para la Web)
* **Objetivo**: Hacer que la aplicación de AK Producciones sea compatible con agentes autónomos de IA de cualquier navegador.
* **Detalles Técnicos**: Exponer un esquema de herramientas y funciones web estandarizado (WebMCP) para que las IA puedan realizar consultas y rellenar datos sin APIs personalizadas.

---

## 3. Acreditación e Invitaciones Inteligentes

### Google Wallet NFC Smart Tap (Pases VIP)
* **Objetivo**: Acreditación express de invitados en la recepción del salón mediante tecnología NFC (sin necesidad de encender la pantalla del celular).
* **Detalles Técnicos**: Integrar la **Google Wallet API** para emitir pases de evento (\`eventTicketClass\` / \`eventTicketObject\`). Cuando el invitado confirme asistencia en el portal, añade el pase a su Google Wallet y hace *tap* contra el receptor del salón.
* **Impacto**: Elimina las colas de recepción y asocia automáticamente al invitado con su mesa y menú de catering.

---

## 4. Automatización del Salón e Internet de las Cosas (IoT)

### Integración con Google Nest & Matter (Domótica del Salón)
* **Objetivo**: Automatizar la ambientación física del salón (luces y sonido) basándose en el cronograma dinámico del evento.
* **Detalles Técnicos**: Vincular el cronograma (\`generate-timeline-flow\`) con dispositivos IoT que soporten el estándar Matter a través del ecosistema de Google Home.
* **Impacto**: Al marcar en la app que comienza el "Vals de Novios", el sistema atenúa las luces generales, enciende las luces robóticas y reproduce la música automáticamente.

---

## 5. Inteligencia de Audio e Imagen

### Google Cloud Speech-to-Text (Transcripción del Buzón de Recuerdos)
* **Objetivo**: Generar un libro de dedicatorias de texto automático a partir de los audios grabados por los invitados en el teléfono retro.
* **Detalles Técnicos**: Procesar los archivos de audio mediante la API de Google Cloud Speech-to-Text para obtener la transcripción escrita.

### Google Cloud Vision / Lens (Moderación del Muro Social)
* **Objetivo**: Evitar la proyección de fotos borrosas o contenido inapropiado en las pantallas LED del salón.
* **Detalles Técnicos**: Escanear cada foto subida por los invitados usando la API de Cloud Vision antes de permitir su publicación en el Muro Social.
* **Impacto**: Moderación 100% automatizada e instantánea durante la fiesta.

---

## Tabla Resumen de Tecnologías y Prioridades

| Tecnología | Categoría | Esfuerzo | Impacto |
| :--- | :--- | :--- | :--- |
| **Google Wallet NFC** | Acreditación | Alto | ⭐⭐⭐⭐⭐ Muy Alto |
| **HTML-in-Canvas WebGPU** | Gráficos 3D | Alto | ⭐⭐⭐⭐⭐ Muy Alto |
| **Gemini Live API** | Voz / IA | Medio-Alto | ⭐⭐⭐⭐⭐ Muy Alto |
| **Speech-to-Text** | Audio / IA | Bajo | ⭐⭐⭐⭐ Alto |
| **Cloud Vision API** | Moderación / IA | Bajo | ⭐⭐⭐⭐⭐ Muy Alto |
| **Matter IoT** | Domótica | Alto | ⭐⭐⭐⭐ Alto |
| **WebXR Spatial** | AR / VR | Alto | ⭐⭐⭐⭐ Alto |
| **Google Maps API** | Logística | Bajo | ⭐⭐⭐ Medio |
| **Google Calendar API** | Agenda / Interno | Bajo | ⭐⭐⭐⭐ Alto |
| **Firebase FCM** | Alertas Push | Medio | ⭐⭐⭐⭐⭐ Muy Alto |
