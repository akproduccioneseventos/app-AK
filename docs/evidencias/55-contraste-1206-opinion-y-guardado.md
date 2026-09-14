# Contraste vigente de decoracion: PR1206

Fecha: 2026-09-14. Codex audita; no programa la app ni compila.
PR1206: feat/ordenes-55-56, SHA 0f03c998cc36922f754d6e06e21e8c22ea47a796.
Main observado: 24218edc2715e830833d8d201d03e975088d8fbe.
No extrapolar a otra revision. Revalidar HEAD antes de corregir.

## Metodo y limites

La copia local original ya no existe; los antiguos worktrees conservan archivos pero
apuntan a un gitdir ausente. No se modificaron esos enlaces ni se borraron archivos.
Se leyeron AGENTS, ESTADO-ACTUAL, YA-RESUELTO y orden55 remotos. Graphify local no
tiene grafo utilizable en esta copia; se usaron rutas conocidas, diff remoto y AST.
Se recuperaron CUATRO fuentes del SHA de la PR, sin recompilar ni ejecutar la app.
TypeScript 5.9.3 se instalo solo en carpeta aislada de auditoria, fuera del repo.

Se reutilizo la sonda iniciada el 9/9, que habia quedado local y sin entregar.
Esta vuelta si se ejecuto contra la entrega vigente: 2 FAIL, 2 PASS y 1 observacion.
Cadena de acciones real por AST; sesiones y persistencia en memoria. Sin Firebase,
navegador, generacion paga ni datos reales. La autenticacion criptografica no se prueba.

## P1 DECO-14: opinion de cliente guardada, respuesta de error

enviarOpinionDecoracion -> updateDecoracion -> updateFiestaPartial acepta al cliente
con sesion de portal valida y persiste su opinion. Despues syncDecoGastosToModule
exige requireAppSession y termina con error. Resultado observado: una escritura,
opinion leGusta:true guardada y respuesta success:false.

Consumidor real: src/app/portal/[fiestaId]/decoracion/page.tsx:79.
Acciones: src/app/actions/fiesta/decoracion.actions.ts y fiesta.actions.ts.
Controles PASS: empleado puede guardar; quien no tiene acceso no escribe nada.

Responsable Claude: separar feedback autorizado del cliente de costos operativos.
Guardar solo campos permitidos de su fiesta. NO dar permisos contables al cliente
ni quitar la guardia de costos. Conservar sincronizacion al vaciar decoracion por
el equipo. Aceptacion: cliente envia y recarga su opinion; error real no anuncia
exito; otro evento se rechaza; presupuesto y costos no cambian por opinar.

## P1 DECO-15: respuesta vieja limpia edicion nueva

saveCanvas en src/app/(app)/fiestas/nueva/decoracion/page.tsx:760 guarda el snapshot
A y limpia canvasHasChanges al terminar, sin comprobar si ya existe B posterior.
La sonda envia mesa x10, representa nueva edicion x90 durante la espera y completa
A: queda marcado limpio aunque el snapshot enviado no contiene x90.
El efecto de autoguardado depende de la bandera y puede cancelar el timer de B.
La sonda prueba bandera/snapshot; la cancelacion completa de React es inspeccion,
no E2E ejecutado. No afirmar perdida observada de una fiesta real.

Responsable Gemini: versionar respuestas o serializar guardados, conservando cambios
posteriores hasta persistirlos. Prueba necesaria: A tarda, llega B, termina A, B sigue
pendiente y acaba guardado; recargar muestra x90. Repetir con fallo de A.

## Producto: no cambiar sin aprobacion

Cambiar estilo conserva opinionCliente antigua. Es observacion, no defecto contractual
nuevo aprobado. Proponer al dueno guardar opinion con su version y pedir otra si cambia
la propuesta publicada; no borrar historicos ni convertir opinion en firma/contrato.

## Lo que NO se pide rehacer

El registro y codigo actuales incluyen PNG real, filtrado de nota interna, captura
en portal, paleta corregida y limite de IA con turno. Se reconoce el trabajo presente,
no se certifica de nuevo mediante lectura. La prueba de PNG de la PR ya espera
download sin fallback: no repetir la devolucion antigua por ese punto.

La suite de orden55 aun no demuestra generacion exitosa: precarga una imagen y
verifica que aparezca. El caso del tope comprueba boton deshabilitado, no contador
de llamadas. Las notas se precargan; no se editan y guardan desde el formulario.
Pedir pruebas focalizadas de esas transiciones con IA simulada y usuario cliente
sin cookie de empleado. Son huecos de cobertura, no tres fallos nuevos de app.

## Repeticion

Usar checkout limpio del SHA indicado y TypeScript instalado fuera de produccion:

```powershell
node docs/evidencias/55-sondas-feedback-autoguardado.cjs RUTA_AL_MODULO_TYPESCRIPT RUTA_AL_CHECKOUT
```

No se fusiono ni se creo PR documental aparte. Esta evidencia se integra con la tanda
de correcciones. Publicacion de documento no equivale a ejecucion de Gemini/Claude.
