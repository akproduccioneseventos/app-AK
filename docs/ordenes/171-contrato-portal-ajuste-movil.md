# Orden 171: corregir el contrato del portal en celular

> **Se programa con la orden 176 (para Gemini), que tiene el camino exacto.**

**Estado actual:** CERRADA la disposicion movil comprobada por151, fuente2e5363f259461a31bf6b31807872c227855415de,1PASS Pixel7: titulo2lineas, sello/etiqueta separados y texto contenido en boton. Fuentes relacionadas sin cambio hasta main894d. No certifica logica legal ni todas las variantes del contrato. El retest142 parcial queda como historico; ver154-cierre.md.
**Prioridad:** P2, afecta lectura y descarga/impresion en el portal del cliente.
**Base auditada:** app `d10f332a17241de5a4705a560336585853073a76`, copia QA compilada en `a635b27071ecea22092eba2a285892c84c6f9d08`; `src` coincide con `origin/main` `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.

## Problema observado

En el portal del cliente, al abrir `/portal/[fiestaId]/contrato` en un telefono de 390 px y dejar la constancia de firma digital, hay tres defectos visibles en el bloque del contrato:

- El titulo `Contrato de Servicio` ocupa tres lineas.
- El nombre/sello digital del titular se superpone al texto `Firma del Titular`, por lo que tapa parte de la etiqueta.
- El texto `IMPRIMIR / DESCARGAR CONTRATO (PDF)` desborda horizontalmente el boton rojo.

Medidas del navegador a 390 px: sello `{left:229.83,right:324.73,top:592.02,bottom:707.09}`; etiqueta `{left:215,right:342,top:679.5,bottom:695.5}`; boton de 244 px frente a un texto de 336 px. La captura muestra los tres defectos.

## Criterio de aceptacion

En 390 px, el encabezado debe ocupar como maximo dos lineas, el sello no debe cubrir ninguna etiqueta y el texto completo del boton debe quedar dentro del boton. Mantener visible y util el estado de firma y la accion de imprimir/descargar. Revisar tambien escritorio para evitar regresiones.

El recorrido usa un evento ficticio, una clave de QA y un contrato que indica explicitamente que no tiene validez ni genera cobros. No reutilizar ni cambiar la identidad del cliente, sus pagos o la logica legal del contrato para resolver un problema de disposicion.

## Contraste con otras tandas

No se encontro este defecto en los antecedentes consultados. Las correcciones previas de nombre de firma y boton imprimible no cubren el solapamiento ni el desborde observados. **NO CONTRASTADO CON LA TANDA PRIVADA ACTIVA DE CLAUDE/GEMINI**: contrastar sus HEAD/diffs antes de programar y no duplicar trabajo si ya esta corregido.

## Comprobacion

```comprobar
archivo: src/app/portal/[fiestaId]/contrato/page.tsx
no-usa: absolute -top-12 left-1/2 en src/app/portal/[fiestaId]/contrato/page.tsx
prueba: docs/evidencias/151-mobile-source.spec.ts
```
