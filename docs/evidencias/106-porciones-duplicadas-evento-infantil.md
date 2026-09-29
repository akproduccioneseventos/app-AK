# Auditoría — cantidades de la hoja de cocina, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Área: catering y números; dueño de corrección según el reparto: Claude.
Clasificación: cálculo incorrecto inferible en la candidata; Codex no ejecutó tests ni generó una hoja real.

## P1 — Cero adultos explícito se reemplaza por el total estimado y duplica las porciones

En `src/app/(app)/fiestas/nueva/orden-de-evento/page.tsx`, al construir los grupos para `armarHojaDeCocina`, se calcula:

`adultos = presupuesto?.invitadosAdultos || Number(fiesta.configuracion?.invitadosEstimados) || 0`

El operador `||` no distingue “el presupuesto dice 0 adultos” de “no hay valor”. Ejemplo con presupuesto válido: 0 adultos, 40 niños y `invitadosEstimados=40`. El código produce adultos=40, chicos=40. La hoja define `total = adultos + chicos` y cuenta el plato principal para adultos más el menú infantil para chicos: salen 80 porciones para 40 personas.

Impacto: la hoja de cocina y las cantidades previstas para un evento infantil pueden duplicarse y asignar platos al grupo equivocado.

Recomendación para Claude: usar presencia explícita del valor (nullish/validación) en vez de tratar cero como ausente y definir qué fuente usar si falta el dato. Prueba mínima: presupuesto con adultos=0, niños=40, adolescentes=0, estimado=40; esperar 0 adultos, 40 chicos, 40 total, 0 platos principales de adulto y 40 infantiles. Añadir también el caso con campo realmente ausente para validar el fallback.

## Verificación

Código consumidor inspeccionado y función `src/lib/catering/hoja-de-cocina.ts:armarHojaDeCocina` confirma que suma grupos y distribuye porciones. El E2E de Orden de Evento no crea presupuesto/cantidades ni comprueba la hoja de cocina; los tests de catering no se ejecutaron en este entorno.
