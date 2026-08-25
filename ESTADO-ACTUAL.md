# Acá quedé

Hoja corta de traspaso entre IA. Lo histórico está en `docs/YA-RESUELTO.md`.

**Última actualización:** 24 de agosto de 2026.
**Base revisada:** `45f70ebd94b4ad303bf1d29d126b1154ed5bc8ba`.
**Entrega:** rama `codex/certificacion-final-fotos-offline`; la PR queda abierta para
que el dueño la fusione manualmente.

## Qué corrige esta entrega

- Touchpix conserva fotos cuando vence la credencial y reintenta con la credencial
  fresca de la misma estación, sin cambiar la identidad del invitado.
- Las capturas llevan SHA-256 para evitar duplicados si se pierde una respuesta.
- Una foto ya guardada no vuelve a la cola si falla solo el estado posterior.
- Muro social y muro en vivo no superponen rondas de refresco cuando una acción tarda.
- El lanzador E2E ya no congela Next.js por dejar sus logs sin leer y no espera el DOM
  indefinidamente cuando una ruta no responde.
- La referencia geométrica LED fue conciliada mirando escritorio y móvil; se mantuvo
  la tolerancia estricta de 2 px.

## Evidencia sobre el candidato

- ESLint: aprobado.
- TypeScript completo con 8 GB: aprobado.
- Acentos: aprobados.
- Jest: 339/339 suites, 2186/2186 pruebas.
- Build de producción: aprobado, 282/282 páginas estáticas, salida 0.
- Playwright: 600 ejecuciones, 94 aprobadas, 506 omitidas por matriz/proyecto,
  0 fallas reales.
- Dependencias de producción: 0 vulnerabilidades críticas; quedan 9 altas y
  62 moderadas reportadas por npm. La alta principal es transitiva de
  `sharp/libvips` y npm no ofrece una corrección compatible.

## Lo que no se debe declarar probado

- Reglas Firestore en este candidato: Java no está instalado y las reglas no cambiaron.
- Gmail, Meta/Instagram, Mercado Pago y FCM con cuentas reales.
- Cámaras, impresoras, plataforma 360, espejos y Touchpix físico.

Esos controles requieren credenciales, dinero o equipos externos. La PR puede
evaluarse para fusión por código, build y navegador, pero no equivale a certificar
hardware o servicios reales no disponibles en esta máquina.

## Reglas para la siguiente IA

- No fusionar la PR automáticamente.
- No repetir esta auditoría si el SHA no cambió; reutilizar la evidencia anterior.
- Si la rama cambia, validar primero el diff y los flujos afectados.
- No incluir los JSON temporales que generan las pruebas locales.
