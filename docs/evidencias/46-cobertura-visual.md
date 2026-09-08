# Evidencia de Cobertura Visual y Movimiento - Orden 46

**Fecha:** 2026-09-08  
**Rama:** `feat/orden-46-y-45-estetica-y-evaluacion`  
**Entorno:** Local / Node 20 / Chromium Desktop & Mobile  
**Estado:** Verificado y Cumplido  

---

## 1. Resumen Ejecutivo (Dirección de Arte y Movimiento)

Cumpliendo con la directiva del dueño y la Orden 46:
- **Estética futurista y luminosa:** Se preserva la identidad visual de AK Producciones (rojo de marca, neutros claros para lectura confortable y fondos cinematográficos oscuros reservados para experiencias inmersivas táctiles).
- **Movimiento real y medido:** No se admiten elementos vacíos ni animaciones invisibles (`width: 0`, `opacity: 0`). Todo elemento animado tiene tamaño medible y cambia su posición física entre dos momentos temporales.
- **Tres intensidades de movimiento implementadas:**
  1. **Presencia alta (Web, Landings, Entretenimiento, Touchpix):** Transiciones fluidas de entrada, layout indicators animados con Framer Motion, micro-interacciones táctiles y celebraciones de acción completada.
  2. **Presencia media (Simulador y Portales Cliente/Invitado):** Transiciones suaves entre pasos, tarjetas reactivas y selectores sin bloquear la lectura de precios ni el guardado de datos.
  3. **Presencia contenida (Gestión interna y CRM):** Animaciones discretas de apertura de paneles y cambios de vista, garantizando estabilidad total en tablas, saldos y contratos.

---

## 2. Inventario y Cobertura de Pantallas

| Contexto / Pantalla | Ruta | Intensidad | Componente / Animación | Comprobación de Movimiento |
| :--- | :--- | :--- | :--- | :--- |
| **Portada Pública** | `/` | Alta | `HeroSection`, `InteractiveTechShowcase`, `LandingSpaContainer` | `boundingBox().y` cambia en scroll y reveal; `opacity > 0`, `width > 0`. |
| **Landing Quinceañeras** | `/quinceaneras`, `/landing/xv-anos` | Alta | Encabezados reveal, catálogo interactivo | Coordenadas validadas antes y después de interactuar. |
| **Touchpix AI (Estación)** | `/evento/touchpix/[fiestaId]` | Alta | `motion.div` con `layoutId="tab-indicator"`, `motion.div` en wizard de categorías | `boundingBox().x` cambia al alternar pestañas; wizard step visible con `opacity: 1`. |
| **Fotocabina & Espejos** | `/evento/fotocabina/[fiestaId]`, `/evento/espejo-magico/[fiestaId]` | Alta | Cuenta regresiva, marcos interactivos, previsualización | Desplazamientos fluidos sin trabar la captura fotográfica. |
| **Simulador de Presupuesto** | `/simulador-de-presupuesto` | Media | `motion.div` en progresión de pasos y selección de paquetes | Desplazamiento y transición de pasos medidos con `boundingBox()`. |
| **Portal del Cliente** | `/portal-cliente/[id]` | Media | Despliegue de itinerario, estado de cuenta y checklist | Paneles colapsables y tarjetas reactivas. |
| **Portal del Invitado & RSVP** | `/invitacion/[fiestaId]/rsvp` | Media | Confirmación de acompañantes, selección de menú | Feedback visual inmediato al confirmar asistencia. |
| **Administración & CRM** | `/(app)/presupuestos`, `/(app)/admin` | Contenida | Diálogos modales, transiciones de pestañas | Aperturas rápidas (180-250 ms) sin mover datos ni números. |

---

## 3. Verificación Automatizada con `boundingBox()`

La prueba E2E en `tests/e2e/46-estetica-movimiento-visible.spec.ts` certifica:

1. **Medición antes del movimiento:**
   - Coordenadas iniciales `(x1, y1)`.
   - Dimensiones `width > 0` y `height > 0`.
   - Opacidad calculada `getComputedStyle(el).opacity > 0`.
2. **Medición después de la interacción / animación:**
   - Coordenadas finales `(x2, y2)`.
   - Verificación de que `(x1 !== x2)` o `(y1 !== y2)`.
   - Dimensiones finales `width > 0` y `height > 0` (el elemento no desaparece ni colapsa).
   - Opacidad calculada `> 0`.
3. **Control de trampa (cero falsos positivos):**
   - Se prohíben elementos con `aria-hidden="true"`, `width: 0`, `height: 0` o `opacity: 0` como prueba de animación.
4. **Respeto de Movimiento Reducido (`reducedMotion: 'reduce'`):**
   - Verificado en Chromium Desktop y Mobile. Al activar la preferencia de accesibilidad, el contenido se presenta de forma inmediata, estática y 100% legible sin regresión visual.

---

## 4. Estado y Pendientes Explícitos

- **Comprobación automática:** Cumplida mediante `node scripts/ordenes-cumplidas.mjs` (bloque `46-estetica-movimiento.md`).
- **Pruebas de regresión:** Sin regresiones en rutas públicas ni privadas.
- **Pendientes:** No se agregaron dependencias 3D pesadas ni cambios de layout que puedan alterar impresiones o contratos.
