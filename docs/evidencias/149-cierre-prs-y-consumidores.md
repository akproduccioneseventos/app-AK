#149 - Estado de entregas y consumidores de proveedores

Contraste20/10/2026UTC, main7230f9d02b32805952a185f704a0208bd5d643e6.
Codex solo audita/prueba/documenta. Sin cambio de app, merge ni datos reales.

PR1330/1331/1332/1333/1334/1335 estan CERRADAS con mergedAt y mergeCommit
nulos. No llamarlas fusionadas, desplegadas ni aceptadas. PR1333 cerro
19/10/2026 15:49:20UTC en03cd87d59dcdd35ac26108d3d7fe979b6a4bf83b.
1324 borrador sigue abierta;1325/1326/1327/1328/1329 tambien abiertas.

El helper185 probado148 mantiene su evidencia4PASS en03cd; no se repitio.
La abierta1329b8491bda3f25aadc71f36f42d5878a47261bb1bf tiene blobhelper
71271f3c9f88c9d3920331b16002ff76658b2268; el de03cd corregido es
7f277ad774df476a6dd1c4f16988ea0462021f3f. No consta enmain ese archivo.
Esto no demuestra un fallo publicado de ese helper, nuevo en la propuesta.

## Sonda nueva: consumidores, no repeticion del helper

149-proveedor-consumidores.mjs extrae por TypeScript AST las funciones REALES
pideCambiarLaPlata y updateShoppingListStatus, con sus auxiliares. Resultado
2PASS/2FAIL, una familia de identidad con dos variantes de consumidor.

- Guardado parcial: sin cambiar pagos, A/B distintosID e igual nombre hace
  que el predicado diga que cambio plata. Nombres distintos controlPASS.
- Catering: cambiar solo pedidoB devuelve success:true pero persiste en el
  DOBLE de transaccion dos filasB200/B200 y eliminaA60.30. Debe quedarA/B.
  Nombres distintos controlPASS. El cuerpo de la accion es real; autenticacion,
  lectura y transaccion son dobles declarados. No sesion/SDK/pago real.

Ambos consumidores son identicos entre1329b849 y1333 03cd. El blobcatering
d8074f621ca5990858a4015deca548ec2b020e14 tambien es identico enmain7230.
Fuente exacta, hashes, entradas y resultados completos en149JSON. No editar
ese recibo ni convertir2FAIL en dosbugs financieros nuevos por contarlos.
Orden185 ampliada, no emitida otra. Claude lleva dinero/comida/permisos.
NO CONTRASTADO CON LA TANDA PRIVADA ACTUAL DE CLAUDE.

## Sonda nueva de puerta

Agente economico preparo149-checkin-cola.mjs; principal reviso fuente/script
y lo ejecuto serialmente despues de proveedores. Callback REAL1329b849
sincronizarCola extraido porAST:2PASS/1FAIL. Control secuencial retiraA;
ACK perdido conservaA. Se agregaB mientras esperaA, confirmaA y borraB sin
enviarlo. No se probaron dos sincronizadores simultaneos ni navegador/camara.
ServidorcheckInGuest ya registrado devuelve el existente; no afirmar ingresos
duplicados.186 devuelve181 aGemini, contrastar su tanda privada antes de tocar.
Main no tiene esta cola. Ver149-checkin-cola.json; exit0delprocesoNOesPASS:
el recibo diceFAIL y conserva1invariante violada, no modificar ese resultado.

## Reutilizacion y limites

No se reabren3D/agendaGoogle/DJ de135, clienteSDK141 ni cabecera178 de142.
No volver a confundir el recuento134 con un resultado posterior: una lectura
inicial del ayudante reabria viajes ya cerrados; fue contrastada/descartada.
Las14areas tienen evidencia parcial e inventario, no aceptacion exhaustiva de
todos los controles/roles/estados. No inventar porcentaje ni certificado global.

Fixes171/172/179/180/184 presentes1328ef0;14634PASSligeros se conservan.
Quedan viajes nativos de la fuente corregida y la accion/persistencia185.
La compilacion142 de17d no validaef0. No recompilar por cambios documentales.
RAM al empezar380460KiB y296548KiB luego: no build pesado ni detener procesos
ajenos. La sonda ligera usa Node128MiB y guardia256MiB, sin Jest/servidores.
Los19originales siguen pendientes del dueno; OAuth/modelo/voz/integraciones
reales, Hosting y hardware requieren su evidencia, no se sustituyen con mocks.
