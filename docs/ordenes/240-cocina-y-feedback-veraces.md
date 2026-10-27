# Orden240 - Restricciones completas y resumen sin hallazgos inventados

Para Claude: K1/K2 (comida) y validacion del conjunto. Para Gemini: F1 (feedback).
Una sola tanda de correcciones; no fusionar documentacion sola.

Fuente main c0add57f6237f666db97e7e902ef75f6c8d97479, consumidores iguales enClaude
0c355975. NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Contrastar HEAD antes
de tocar algo. NO incluye ni repite238Codex/239, que ya estan en correccion.

Informe708 y JSON706/707:11criterios7PASS4FAIL, tres defectos reproducidos.

## K1 - AK-CODEX-706-MARISCOS - Claude

`detectarChoquesMenuYAlergias`: restriccion Alergia Mariscos y tagmariscos explicitos
devuelven lista vacia. Conectar ese caso al esquema admitido sin inventar seguridad
de un plato por texto libre. Conservar RSVP/partySize/permisos y controles existentes.
Debe producir advertencia con5personas para fixture706, no solo para gluten/lacteos.
No alterar menus, porciones, costos o fichas reales para tapar el error.

## K2 - AK-CODEX-706-REPORTE-CELIACO - Claude

El reporte/lista de alergias debe incluir isCeliac:true aunque dietaryRestriction
este ausente. Unificar lectura compatible de ambos campos para resumen/detalle,
sin doble conteo si ambos estan y conservando partySize. No rehacer el arreglo de
portapapeles; esta vez el contenido copiado con exito ya venia incompleto.
Probar formato RSVP actualGrazia, flag solo, enum solo, ambos, y no confirmados.

## F1 - AK-CODEX-707-TEMAS-SIN-ANALISIS - Gemini

Si no hubo analisis valido de encuestas, no devolver temas prefijados como
`temasRepetidos`. Mantener calculos deterministas reales. Informar analisis no
disponible, o separar claramente sugerencias generales de conclusiones de datos.
No fabricar testimonios ni convertir este arreglo en publicacion automatica.
Casos: presupuesto agotado, proveedor falla, vacio y respuesta valida. No declarar
encontrado enUI: evidencia es helper/accion; pagina guarda estado, no renderiza temas.

## Validacion

Conservar controles positivos706/707; crear regresiones sobre funciones y consumidores
reales. Completar prueba renderizada de reporte/alerta en QA ficticio (PENDIENTE).
Claude compila/valida fuente congelada; Codex no compilo ni modifico app en esta tanda.
Registrar SHA/resultado/limites; no tocar datos/cuentas/envios reales.

```comprobar
archivo: src/lib/catering/choques-alergias.ts
usa: detectarChoquesMenuYAlergias en src/app/(app)/fiestas/nueva/alergias/page.tsx
usa: getResumenFeedbackMensualAction en src/app/(app)/settings/feedback/page.tsx
prueba: docs/evidencias/706-catering-restricciones-sonda.cjs
prueba: docs/evidencias/707-feedback-respaldo-sonda.cjs
```
