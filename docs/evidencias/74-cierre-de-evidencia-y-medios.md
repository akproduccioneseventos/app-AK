# Auditoría 74: batería actual, medios y cierre de evidencia

6/10/2026. Fuente main `368988bb64e823d31c9d5c4b2fb9adc114b207ef`.
GitHub consultado al cierre del contraste: ninguna propuesta abierta; main
sigue en ese SHA. Rama documental `codex/auditoria-73-20261006`.
No app programada, compilada ni fusionada por Codex. No escrituras productivas.

## Comprobado

- **608 suites / 3522 pruebas unitarias PASAN**, 0 fallidas y 0 pendientes.
  258,61 segundos de Jest, en dependencias/almacenamiento de prueba. Incluyen
  las 21 focalizadas de 73; no sumarlas otra vez. No 3522 recorridos de usuario.
- `e2e-list`, proyecto `chromium-desktop`: **491 casos declarados en 104 archivos**,
  cero errores de descubrimiento, **cero ejecutados por esa orden**. El JSON del
  reporter dice skipped por ser listado; no es aceptación ni fallo de esos casos.
- Navegador público: abre/cierra reseña de Liliana Reyes; video de testimonios
  YouTube efectivamente reproduce (0:01 / 0:09, captura); galería carga más y
  abre/cierra modal; `/privacidad` carga sin desborde horizontal en 729 px.
  Sólo esos puntos, no todos los videos, menús ni todas las pantallas móviles.
- La galería parte de 12 medios; botón anuncia el próximo total (24), después
  de pulsarlo quedan 24 y el botón anuncia 36. No confundir esos textos con
  cantidades actuales ni reportar un falso desfase del contador.
- Originales/hashes: `74-resultados/manifest.json`, unitarias e inventario
  comprimidos, salida de sonda y tres capturas. Recorder ejecutado una vez.

## Área: web/redes · Commit: 368988bb64e823d31c9d5c4b2fb9adc114b207ef

Hallazgos nuevos: **GAL74-MEDIA y GAL74-CATEGORY, P2**.
Inicio → galería → Ver más → Abrir foto: Glitter bar. Foto de toro mecánico,
caption de Glitter bar y categoría Barra de Tragos. La foto LOCAL del Git
actual también es toro; hash idéntico al blob. Dos causas distintas:
asociación asset/servicio equivocada y heurística «bar» que sobrepone tragos
a la categoría configurada Entretenimiento. No prueba de que todo el catálogo
esté mal ni de que Instagram haya perdido imágenes.

Fuente/consumidores y corrección para Gemini en orden 125 A/B. La presentación
LED puede usar el mismo fallback incorrecto: trazado en fuente, no ejecución
de ese recorrido. No cambiar sólo `alt` para aparentar una foto corregida.

## Área: web · Commit: 368988bb64e823d31c9d5c4b2fb9adc114b207ef

Hallazgo nuevo: **CONTACT74, P2**. `/privacidad` muestra correo electrónico
como WhatsApp. Página async real con configuración sintética reproduce la
misma forma en main. Ruta/consumidor/canonical fallback: orden 125 C.
No evaluación legal; no cambios a decisiones de privacidad/cookies del dueño.

Las dos sondas verdes demuestran defectos reproducidos, no arreglos. La prueba
existente de privacidad usa un teléfono explícito, y los ejemplos de categoría
no incluyen Glitter bar. Que todas las pruebas existentes pasen no contradice
los hallazgos del navegador; faltaban estos casos de aceptación.

## Pendientes anteriores, sin repetir auditoría

- CAMPO73-RACE P1, orden 124 A: cuatro intercalados pierden un cobro por snapshot
  viejo; una causa. Claude. No confundir con CAMPO01/02 directos, ya corregidos.
- GAL73 /124 B: destino de Galería HD, decisión del dueño pendiente.
- Orden 123: token al cambiar trago, operaciones ofrecidas en preparando,
  ownership del reintento conocido y escala de plantilla de salón. Política
  de cancelar/cambiar en preparando consultada, pendiente de decisión.
- RED03 /122: galería de videos concurrente. AUD01 /112 B.1 sigue registrado
  como pendiente anterior; no presentarlo como un fallo nuevo de esta sesión.
- CAMPO01/02 directos y COMPRA01 tienen corrección en #1260 y regresiones
  actuales aprobadas. No reabrir ni volver a programar sus arreglos.

## Límite concreto y siguiente entrega

Matriz vigente `74-matriz-de-cierre.md`: 14 áreas, evidencia y ensayo que falta,
sin convertir «no ejecutado» en «defectuoso». Ayudante acotado revisó las brechas
de contrato/comida/personal/automáticos y quedó cerrado; no duplicó build ni UX.

Orden 114 sigue vigente: artifact/servidor aislado con SHA y persistencia de
prueba, tres roles, sin credenciales ni clientes productivos. No levantar otra
copia Next dev inestable ni pedir de nuevo sus arreglos. No reintentar bloqueo
del cliente navegador como si fuera defecto de app: `/api/health` fue bloqueado
por el cliente con `net::ERR_BLOCKED_BY_CLIENT`; ese intento no prueba su estado.

Claude informó puerta verde de #1260 en `7dfba1da3`; la comparación de fuente
con `368988bb` es vacía. No compilación independiente de Codex ni logs originales
de esa puerta revisados. SHA del sitio publicado no identificado.

Reunir correcciones 122/123/124/125 en una tanda de código, y ejecutar los
ensayos de aceptación pendientes sobre SU SHA, no sobre otro. Decisiones del
dueño y pruebas físicas se mantienen separadas. **Cierre de este informe, NO
certificado de aplicación lista ni «cero errores».**
