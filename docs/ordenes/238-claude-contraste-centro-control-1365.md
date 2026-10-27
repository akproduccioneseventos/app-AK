# Orden238 - Centro de control: resultados reales y reglas compartidas

Para Claude: revisar y coordinar/corregir antes de compilar y aceptar1365. Gemini
puede implementar interfaz/motor segun reparto. Una sola tanda; NO fusionar
documentacion sola. Codex no modifico codigo app.

Fuente probada: `b58abab75d94a732daf79b32aff54ec253ccf63c`, PR1365ABIERTA.
Main1081fd26. Complementa237Claude/cddd22c0 bloque236, no pide rehacer lo existente.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Contrastar nuevoHEAD antes de
programar, por si ya se corrigio. Rutas/simbolos siguientes comprobados enb58.

Informe `docs/evidencias/700-auditoria-centro-control-1365.md` agrupa22criterios:
5PASS/17FAIL = ocho grupos, no17bugs. Resultados y fuentes en JSON697/698/699.

1. **A: web.** `darOrdenPorVozOTexto`: resolver fiesta real sin fallbackSofia,
   verificar resultado y guardar antes de anunciar creada. Excepcion/success:false/
   inexistente no producen exito. Preservar Deshacer del editor y varias fiestas.
2. **B: respuestas.** No afirmar horario/menu del sabado ni trabajo iniciado sin
   consulta/accion real. Reusar motor existente; pedir precision ante ambiguedad.
3. **C: aprobacion.** Propagar fallo de acciones hijas, ID inexistente y escritura;
   no aprender como aplicada una accion fallida. Pantalla conserva/restaura tarjeta
   y edicion, muestra error/reintento. No feedback optimista irreversible.
4. **D: dos personas.** Mutacion atomica porID para aprobar post, sin reemplazar
   lista entera. Dos aprobaciones diferentes deben quedar guardadas.
5. **E: correo/WhatsApp.** Aprobar/abrir no significa enviado. Email no se marca
   enviado con0envios. Mantener envio manual del dueno, sin nuevas automatizaciones.
6. **F: cambiar texto.** Enlace y borrador usan texto nuevo, no enlace precomputado
   viejo. Error no pierde edicion; no enviar automaticamente para arreglarlo.
7. **G: reglas.** Autoridad compartida y mutacion porclave. Otra instancia ve
   apagada; guardar otra regla no borra la anterior. Mantener prohibiciones y
   defaults comerciales; Claude valida este control de automatizacion.
8. **H: persistencia.** Fallo remoto al guardar regla devuelve error. Archivo
   temporal local no permite afirmar exito durable. Reintento y reinicio coherentes.

## Validacion requerida

Conservar5positivos y las variantes negativas con comportamiento observable. Las
sondas corren con fronteras ficticias; no sonHTTP/SDK/navegador/modelo real.
Agregar consumidor renderizado para editar/fallar/reintentar (PENDIENTE, no existe
recibo verde de esto). Claude compila/valida conjunto sobre un SHA congelado.
No trasladar build680/5278D4 a esta fuente nueva. Registrar resultado/SHA/limites.
No tocar cuentas/datos/cargos/mensajes reales ni fusionar documentos solos.

Bloque de navegacion, no certificado de aceptacion:

```comprobar
archivo: src/app/actions/centro-de-control.ts
usa: aprobarItemOK en src/app/(app)/centro-de-control/page.tsx
usa: darOrdenPorVozOTexto en src/app/(app)/centro-de-control/page.tsx
usa: getReglaParaTarea en src/lib/agentes/motor-agentes.ts
prueba: docs/evidencias/697-centro-control-sonda.cjs
prueba: docs/evidencias/698-reglas-y-web-sonda.cjs
prueba: docs/evidencias/699-consumidor-centro-sonda.cjs
```
