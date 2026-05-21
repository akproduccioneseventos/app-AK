# Auditoria de presupuestos, simuladores y venta

Fecha: 2026-05-21

## Alcance

- Vista publica y PDF de presupuesto: `/presupuestos/[id]/ver`.
- Resumen final del creador de presupuestos.
- Template formal de impresion.
- Simulador publico y simulador asistido.
- Enlaces de edicion, descarga PDF y compartido por WhatsApp.

## Hallazgos principales

1. El presupuesto mezclaba cotizacion con contrato: mostraba lineas de firma aunque el presupuesto estuviera pendiente de verificacion o sin contrato confirmado.
2. El documento entregable tenia elementos visuales comerciales demasiado coloridos para una pieza formal: verdes, violetas, rojos, promos y resaltados pensados para UI.
3. La version movil podia verse cortada porque el documento usa tablas anchas de impresion sin una politica consistente de overflow y ancho.
4. Existian dos rutas de edicion para el mismo presupuesto (`/editar` y `/edit`), lo que podia llevar a errores o formularios distintos segun el origen del enlace.
5. Los simuladores guardan el presupuesto como `Pendiente Verificacion`, que es correcto, pero el documento publico necesitaba reforzar que la reserva y las firmas pertenecen al contrato confirmado.

## Politica aplicada

- Presupuesto: cotizacion formal, clara, compartible y descargable.
- Contrato: documento de confirmacion y firma.
- Simulador: origen comercial pendiente de verificacion interna antes de cierre.
- WhatsApp: canal rapido para compartir enlace o avanzar a reunion, sin convertir la cotizacion en contrato.

## Correcciones incluidas

- La ruta antigua `/presupuestos/[id]/editar` redirige al editor canonico `/presupuestos/[id]/edit`.
- La vista de presupuesto tiene una barra persistente con WhatsApp, PDF, compartir nativo y copiar enlace.
- Los documentos de presupuesto ocultan firmas en la pieza entregable y agregan una nota formal: la reserva, confirmacion final y firmas corresponden al contrato confirmado.
- La impresion vuelve a mostrar encabezado y pie propios del documento aunque la pagina oculte headers/footers globales.
- Las tablas del presupuesto tienen ancho seguro en movil y en impresion para evitar cortes.
- Los estilos del documento se neutralizan a escala de grises, evitando que promos y estados de UI se impriman como bloques coloridos.
- El enlace compartido elimina `?imprimir=1` para no abrirle el dialogo de impresion al cliente por accidente.

## Riesgo pendiente

Todavia hay duplicacion interna entre la vista publica, el resumen paso 4 y el template formal. Esta PR aplica una politica comun de documento para cortar el problema visible; el siguiente paso tecnico ideal es unificar esas plantillas en un solo componente formal.
