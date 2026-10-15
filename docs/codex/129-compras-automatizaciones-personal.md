# Auditoria129 - tres recorridos nuevos, cinco fallos comprobados

Fuente de aplicacion: `ce1ac07d1bb16c24dd73e2d26ac55038028a2472`.
Main contrastado despues: `1a717203a1a58d4dbf6c5009b7b7cf2636b9e3a4`.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE, HEAD desconocido.
Codex solo audita; no arreglo app, no compilo ni fusiono.

## Recuento sin repetir

La amplia128 de769suites/4819tests aprobadas no se repitio: el nuevo main solo
agrego documentos. Comparacion de src/dependencias/configuracion sin delta.
Esto no convierte las sondas nuevas en verdes: no estaban en aquella pasada.
Orden165 ya esta en main con camino para Gemini; no se le creo otra igual.
PR1306 quedo integrada por Claude durante esta tanda via1307. No se sube a su
rama cerrada:129 nace de main1a7, y su propuesta documental queda en borrador.

Se ejecutaron en secuencia tres grupos, con14casos diferentes:8PASS/6FAIL.
Los6fallos corresponden a5defectos, no6. El caso de lote parcial repite la
causa del aviso fallido con otro escenario. La primera sonda de compras tuvo
3casos y se conserva como historial, NO se suma otra vez al total final.

| Area y recorrido | Resultado observado | Defectos nuevos |
| --- | --- | --- |
| comida/plata: compras, pago y correccion | 3PASS/2FAIL | recordatorio cerrado al desmarcar pagado; montoPagado=-500 aceptado |
| automaticos: boton y accion reales | 4PASS/3FAIL | lectura caida se toma por vacio; aviso fallido se toma por detectado sin advertencia |
| personal: llegada y respuesta perdida | 1PASS/1FAIL | servidor guarda20:00, UI de reintento muestra20:05; recarga vuelve a20:00 |

## Alcance real de las pruebas

- Compras ejecuta updateShoppingListStatus REAL; dobles de permisos, lectura y
  transaccion en memoria. Conserva otra tarea. Control de adelanto125.50 pasa.
- Automatizaciones usa pagina React REAL, hace clic en su boton REAL y llega a
  runSmartAutomations REAL. Solo se simulan fuentes de datos, auth, guardado de
  aviso y aprendizaje. No se simula una respuesta global de la accion: ahi es
  donde se comprobo que el fallo interno se ocultaba.
- Personal usa pagina, vista y accion de llegada REALES; se pierde la respuesta
  despues de guardar, se avanza cinco minutos y se repite el boton. La hora
  persistida NO cambia, pero el texto de pantalla si. Recarga con vista real
  confirma la diferencia. No es la vieja perdida de hora del servidor.
- Son pruebas de modulos/componentes con dobles, NO Next nativo ni Firestore
  real, ni prueba de geolocalizacion/hardware. No se hicieron acciones en
  produccion, cobros, envios, uploads o cuentas del negocio.

## Reproducir sin gasto externo

Desde la raiz, con dependencias existentes, sin build:

```powershell
node docs/evidencias/129-sondas-runner.mjs 129-compras-ampliado docs/evidencias/129-compras-reversion.test.ts
node docs/evidencias/129-sondas-runner.mjs 129-automatizaciones docs/evidencias/129-automatizaciones-reales.test.tsx
node docs/evidencias/129-sondas-runner.mjs 129-personal docs/evidencias/129-personal-llegada-reintento.test.tsx
```

El runner se niega si main o la copia cambian src/dependencias/configuracion
respecto de ce1. Solo una version documental equivalente puede reutilizar
estas sondas. Un parche futuro requiere gate actualizado, sin esconder los
resultados originales ni reemplazar la evidencia vieja por la nueva.
Proceso desde lista permitida sin claves heredadas; ADC centinela inexistente,
dobles explicitos en las fronteras. Guardia restituyo bytes,0cambios de fixture.
Cada ejecucion guarda SHA, argumentos, tiempos, salida y limpieza. Las nuevas
sondas viven bajo docs y no se suman silenciosamente al Jest normal de la app.

## Ayudantes economicos y descartes

Dos agentes gpt-6-luna/low, sin contexto completo, buscaron consumidores de
personal y automatizaciones por separado. No editaron ni ejecutaron acciones.
El principal verifico y reprodujo los hallazgos; ambos agentes se cerraron.
No se dio por cierto un candidato por haberlo encontrado un agente.

- Posible reemplazo de coordenadas en un reintento: visto en codigo, NO
  reproducido ni emitido como defecto. No confundir con el horario de UI, que
  SI se reprodujo. Si se desea cambiar esa politica, revisar primero su motivo.
- No se encontro flujo de salida de empleados en esta busqueda acotada:
  NO implica pantalla rota ni una nueva funcionalidad obligatoria.
- La rama documental tiene otro HEAD, pero los fuentes revisados coinciden
  byte a byte con ce1 y main1a7. Eso permite atribuir estos casos a esos mismos
  modulos; NO da equivalencia con una tanda privada desconocida.
- Avisos silenciados/duplicados son resultados validos, no errores. Sus dos
  controles pasaron. No deshacer la correccion de contador156.

## Lo que sigue sin poder certificarse

Orden166 deja una tanda unica para corregir estos cinco casos. Pendientes de
programacion/aceptacion, no arreglos. Mantener aparte los dos casos de165.
La documentacion sola no es un despliegue correctivo.

Para completar los recorridos internos faltantes se mantiene requisito114:
artefacto QA actual con datos ficticios y SHA verificable. El .next localb520
no corresponde a ce1. Codex no compilo otro ni uso datos reales para saltarlo.
No hay nuevos defectos atribuidos a OAuth, Hosting, servicios reales, originales
de19presupuestos o hardware por no disponer de esas pruebas.

El registro14areas NO se marca limpio: una prueba amplia aprobada, estas
sondas y un inventario421rutas no prueban cada boton/rol/sincronizacion.
No se declara auditoria funcional global terminada ni0errores.
