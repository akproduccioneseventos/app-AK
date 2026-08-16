# Traspaso para Gemini, Claude y otros agentes

## Auditoria PR 1004 - Gemini e inteligencia comercial (16 de agosto de 2026)

- Gemini 3.7 no figura como modelo oficial disponible. La rama conserva
  `gemini-3.6-flash` y los fallbacks configurados; no volver a cambiar los IDs sin
  verificar primero la documentacion oficial de Google.
- Los generadores de seguimiento comercial y postevento ahora exigen sesion,
  validan y limitan entradas, tratan los datos del cliente como no confiables y
  usan salida estructurada para postevento. Un puntaje valido de `0` ya no se
  convierte en `100` durante el fallback.
- Los generadores quedaron conectados a botones visibles en Comercial y
  Post-fiesta. El organizador debe revisar el texto antes de copiarlo o guardarlo.
- Se elimino la nueva Torre de Control porque duplicaba el Centro de Fiesta y
  abria estaciones sin los tokens requeridos. El Centro de Fiesta y el lanzador
  de entretenimiento existentes siguen siendo las fuentes oficiales.
- El `robots.txt` agregado por la rama se elimino porque habilitaba portales con
  claves. Se conserva `src/app/robots.ts` y la lista segura central de
  `src/lib/seo/paginas-publicas.ts`. El sitemap suma articulos reales del blog,
  sin duplicados y sin publicar rutas privadas.
- Prueba focalizada de guardrails: 4 comprobaciones en verde. TypeScript fue
  revisado por agente en el mismo diff; la validacion amplia final queda
  registrada en la descripcion de la PR.

Última revisión: 11 de agosto de 2026.

Trabajar sobre `main`. No hay propuestas abiertas. Antes de investigar, leer:

1. `ESTADO-ACTUAL.md`
2. `docs/YA-RESUELTO.md`

## No repetir

- No reabrir arreglos marcados como hechos en esos documentos.
- No tratar el rojo de GitHub Actions como error de código: los trabajos no
  arrancan por facturación y el dueño no agregará tarjeta.
- No declarar correctos los 19 eventos usando los archivos locales vacíos.
- No inventar publicaciones de Instagram/Facebook, pagos, correos ni resultados de
  proveedores que no hayan respondido realmente.
- **Una sola propuesta por tanda**, con todos los bloques adentro. Cada fusión
  dispara un despliegue y eso se paga. Si un bloque se traba, entregar el resto
  igual en la misma propuesta y avisar cuál faltó.

## Falsas alarmas ya verificadas: no las reportes como hallazgo

- El stock de bebidas no se devuelve al archivar una fiesta: está bien, para ese
  momento las bebidas se tomaron.
- Los recordatorios de confirmación cuentan invitados y no personas: está bien, se
  manda un mensaje por invitado.
- La lista de compras usa los invitados del presupuesto, no los confirmados: es
  decisión tomada del dueño. Él cocina lo que se contrató; si se agregan invitados,
  el presupuesto sube.
- Las fotos del muro se bajan con el enlace directo, a propósito.
- Se trabaja sólo en pesos uruguayos.

## Lo único pendiente de programar

**Un empleado se puede asignar a dos fiestas del mismo día sin que nada lo impida.**

Hoy aparece un aviso rojo (`src/app/(app)/fiestas/nueva/personal/page.tsx`, cerca
de la línea 309) que dice que la persona ya figura en otro evento, pero la
asignación se guarda igual. Si el equipo va rápido y no lee el aviso, queda un mozo
anotado en dos salones a la misma hora, y eso recién se descubre el día del evento.

Qué hacer: cuando las dos fiestas se solapan en horario, **bloquear** la asignación
en vez de avisar. Si no se solapan pero son el mismo día, dejar el aviso como está.
El bloqueo tiene que explicar en pantalla en qué otro evento está la persona y a
qué hora, para que se pueda resolver sin salir a buscarlo.

Cuidado: la comprobación tiene que hacerse también en el servidor, no sólo en la
pantalla. Hoy `fiestasDelMismoDiaConEmpleado` se llama desde el navegador.

## Lo pendiente que NO es programación

- Correr `Auditoría > Revisar ahora` con Firebase de producción para comprobar los
  19 eventos, presupuestos, facturas y pagos que no existen en los archivos locales.
- Confirmar con credenciales reales el envío de Gmail, la publicación de Instagram,
  el cobro de Mercado Pago y la generación con Gemini.
- Probar en el salón la impresora, las cámaras y tablets reales, el brazo 360 y la
  red del evento. El navegador simula esos dispositivos; no reemplaza la prueba
  física.
