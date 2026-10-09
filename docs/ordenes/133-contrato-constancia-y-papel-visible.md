# Orden 133: constancia identificable y papel disponible

## Version y responsable

9/10/2026. Main final contrastado: `859fd23b1175646edc0209cab114241327d302ba`.
Rama de auditoria: `codex/auditoria-83-contrato-estaciones-20261009`.
PR 1275/1276 fueron fusionadas por otra sesion durante esta auditoria. No subir
a la rama cerrada ni repetir BAR82-CANCEL, cuya correccion ya esta presente.
Al consultar GitHub al final no habia PR abiertas. NO CONTRASTADO CON LA TANDA DE
PROGRAMACION EN CURSO que no este subida: contrastar antes de programar.

Gemini: corregir solo la vista del contrato. Claude revisa cualquier consecuencia
contractual, de dinero o permisos y compila. Codex no programa el producto aqui.
No tocar las acciones de firma, cobros ni permisos para resolver estos dos casos.

## Hallazgos comprobados

Area: contrato. Reproduccion E2E PC en build aislado
`497ee725cb4d8cce6d1c97422fd674cbbe86c051`. La pantalla y las acciones de
documentos no cambiaron entre ese build y main final; los resultados no equivalen
a haber probado toda la app actual ni la web publicada autenticada.

### CT83-NOMBRE (P2): constancia con nombre guardado, firma visible vacia

En `src/app/portal/[fiestaId]/contrato/page.tsx`, `ClientContractPage`, la variable
`firma` transforma `firmaDigitalConstancia` en una firma digital pero omite
`signedBy`. El consumidor visual usa `firma.signedBy`: queda el rotulo
"Firmado Digitalmente" sin el nombre del titular.

Reproduccion: evento ficticio con constancia de Titular Ficticio Prueba Ochenta
Tres, abrir contrato con cookie de portal valida. El nombre existe en el registro
y no en la pantalla. Captura `83-contrato-constancia.png`, sonda
`83-contrato-recorrido.spec.ts`, caso "nombre del titular".

Correccion: mostrar el nombre de la constancia sin inventarlo a partir del evento
ni publicar IP u otros datos privados. Conservar la prioridad del contrato fisico
si existe. No cambiar la informacion persistida para disimular un problema visual.

### CT83-PAPEL (P2): la constancia esconde el acceso al papel obligatorio

El `CardFooter` completo esta condicionado por `!firma?.isSigned`. Incluye el
boton "IMPRIMIR / DESCARGAR CONTRATO (PDF)". Al dejar constancia digital se oculta
tambien ese boton, aunque el aviso sigue exigiendo el papel para confirmar reserva.

Reproduccion: mismo evento firmado digitalmente, sin contrato fisico. La pantalla
avisa que falta el papel; el boton de imprimir no existe. Caso "papel obligatorio"
de la misma sonda falla con locator sin elemento, no por un archivo externo.

Correccion: separar el formulario que no debe permitir firmar dos veces del
acceso al documento. Despues de constancia mantener impresion/descarga y aviso
del papel pendiente. No agregar atajo "Confirmar reserva" ni marcar contratado.

## Aceptacion y limites

- Nombre y huella se guardan; recargar conserva la constancia; no cambia estado
  a Contratada ni crea `contratoFirmaInfo.isSigned` por la firma digital.
- Nombre guardado visible despues de constancia, en PC y movil.
- Impresion del papel accesible antes y despues de constancia; comprobar el clic
  y el documento producido, no solo la existencia de un boton.
- Corte de la solicitud de firma: aviso de fallo, reintento habilitado y nombre
  conservado. No mostrar constancia exitosa si no se guardo.
- Pruebas con datos ficticios; no firmar documentos ni reservar eventos reales.
- No prometer descarga directa si se sigue utilizando el dialogo de impresion
  del navegador. Documento real largo y contrato fisico conservan su validacion.

La sonda en docs es evidencia de auditoria y se copia a tests/e2e solo dentro del
entorno aislado. La prueba productiva propuesta abajo esta PENDIENTE de incorporar,
corregir y ejecutar sobre el SHA de entrega; no esta aprobada por existir esta orden.

```comprobar
archivo: src/app/portal/[fiestaId]/contrato/page.tsx
usa: firmaDigitalConstancia y firma.signedBy en ClientContractPage de src/app/portal/[fiestaId]/contrato/page.tsx
prueba: tests/e2e/contrato-constancia-mantiene-papel.spec.ts (PENDIENTE)
```
