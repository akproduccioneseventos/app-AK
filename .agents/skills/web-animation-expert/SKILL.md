---
name: web-animation-expert
description: Use when implementing React component transitions, page load animations, staggered lists, hover effects, and responsive motion using Framer Motion or Tailwind.
---
# Habilidad de Animación Web y Movimiento Fluido

Esta guía define las directrices y patrones de código para implementar animaciones y transiciones de alto rendimiento que hagan que la interfaz de AK Producciones se sienta viva y fluida.

---

## 1. Patrones de Entrada y Transición

### A. Fade-In y Slide-In de Carga (Entrance Animations)
Al cargar una página o sección, los elementos deben aparecer con transiciones suaves en el eje Y.

```tsx
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  }
};
```

### B. Efecto Escalonado (Staggered Children)
Para grids o listas de elementos, utilizá transiciones escalonadas para evitar una carga simultánea abrupta.

```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: 'easeOut' } 
  }
};
```

---

## 2. Animaciones al hacer Scroll (Viewport Triggered)
Las animaciones de scroll deben ejecutarse una sola vez al entrar en el viewport, evitando re-activaciones constantes.

```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.7, ease: "easeOut" }}
>
  Contenido de la sección...
</motion.div>
```

---

## 3. Efectos Hover Interactivos (Micro-interacciones)
Los botones y tarjetas interactivas deben reaccionar al cursor de manera elástica y suave, no brusca.

- **Para Botones Premium:**
  ```tsx
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "spring", stiffness: 400, damping: 15 }}
  >
    Acción
  </motion.button>
  ```
- **Para Tarjetas (Cards):**
  ```tsx
  <div className="transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10">
    Contenido
  </div>
  ```

---

## 4. Animaciones Responsivas
Evitar mover elementos en distancias largas en móviles. Adaptar la distancia de animación (`y` o `x`) según el breakpoint de pantalla.

```tsx
import { useMediaQuery } from '@/hooks/use-media-query';

const isMobile = useMediaQuery('(max-width: 768px)');

const animationProps = {
  initial: { opacity: 0, y: isMobile ? 10 : 30 },
  animate: { opacity: 1, y: 0 }
};
```

---

## 5. Rendimiento y Buenas Prácticas (Cero Lag)

1. **Propiedades Seguras:** Animar únicamente `opacity`, `transform` (es decir, `x`, `y`, `scale`, `rotate`) y `filter`. Evitar animar propiedades de maquetación (`width`, `height`, `margin`, `padding`) porque fuerzan al navegador a re-calcular el layout del sitio (Reflow), produciendo saltos o lag en móviles.
2. **Animaciones de Salida:** Usá `<AnimatePresence>` solo cuando sea estrictamente necesario para desvanecer elementos removidos del DOM (como filtros de galería o modales).
3. **Reducción de Movimiento:** Respetar la preferencia de accesibilidad del usuario. Si el navegador indica `prefers-reduced-motion`, desactivar o simplificar las animaciones a un simple fundido de opacidad.
