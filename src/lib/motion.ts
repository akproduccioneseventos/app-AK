/**
 * Estándar de movimiento y animaciones de AK Producciones.
 *
 * Basado en .claude/skills/animaciones-pro/SKILL.md:
 * - Curvas profesionales y contenidas (16 a 24 px, 0.3 a 0.5s).
 * - Sin rebotes en páginas de venta ni retrasos en elementos clave (precio, título, contacto).
 * - Soporte nativo para prefers-reduced-motion.
 */

export const SUAVE = [0.22, 1, 0.36, 1] as const; // entrar: arranca rápido y frena
export const PAREJO = [0.4, 0, 0.2, 1] as const; // mover algo ya visible
export const SALIR = [0.4, 0, 1, 1] as const; // salir acelerando y desaparecer

export const DURACION = {
  entrar: 0.4,
  salir: 0.2,
  cascada: 0.08,
  hover: 0.15,
  contador: 1.2,
} as const;

export const contenedorCascada = {
  oculto: {},
  visible: {
    transition: {
      staggerChildren: DURACION.cascada,
    },
  },
};

export const itemCascada = {
  oculto: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURACION.entrar,
      ease: SUAVE,
    },
  },
};

export const hoverSuave = {
  scale: 1.02,
  transition: {
    duration: DURACION.hover,
    ease: PAREJO,
  },
};