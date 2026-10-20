# 156-157 - Tres portales y enlaces de siete estaciones

Fuente congelada main894d01603e0e03cebc8f90a6ccf869ef86bbe1de.
Codex solo audita/prueba/documenta. No build, appedit, merge ni datos reales.

## 156: portales

33casos:30PASS/3FAIL, UNA causa funcional nueva P1 en portal del empleado.
La accion y sus guardias previas reales impiden al perfil personal consultar su
propia ficha antes de evaluar isOwnPortal. PorID y porcorreo falla getEmpleados;
al adaptar solo esa lectura, falla getFiestas/requireEquipo. El directorio y
listado generales deben seguir cerrados al personal. Verorden200/Claude.

No se cambia la decision historica "personal ve solo lo suyo". La regla escrita
correcta no demuestra que se pueda llegar a ella desde la pantalla real.
El consumidor verificado es PersonalWorkspacePage -> getEmployeeWorkspacePortal.
Los controles del dueno y denegaciones de perfiles/anonimo pasan. No se validan
sueldos/calendario del propio empleado: la fixture no tiene fiestas asignadas.

Proveedor: dos tokens, dos fiestas, mismo nombre. Pasan aislamiento de lectura,
token desconocido/inactivo/vencido, tarea ajena, estado invalido y llegada/tarea/
partida sin cambiar la otra fiesta. Funciones reales, almacenamiento en memoria;
no concurrencia, persistencia SDK ni llegadas fisicas.

Cliente: firmador/verificador HMAC y mapper reales, cookies/lecturas adaptadas.
Pasan claves cruzadas A/B, lectura solo de la fiesta autorizada, ausencia de
costos/sueldos/clave, programa interno excluido, rotacion/desactivacion inmediata,
firma alterada y cookie firmada vencida, busqueda de clave antigua/vacia.
La busqueda porclave usa el lector JSON compatible, no el query/indiceFirestore.

Incidencia QA156: la primera asercion exigia ausencia de personalAsignado,
pero el DTO entrega [] sin datos privados. Fue un falso positivo de la sonda,
no fuga ni bug de app. Se conservaron fuente/JSON iniciales; se corrigio solo
esa expectativa y la segunda corrida focal dio30PASS/3FAIL. No amplia nueva.

## 157: invitado -> estaciones

51PASS,0FAIL, fuente894d. Funciones reales de portal/DTO/configuracion/rutas y
tokens HMAC para fotocabina,360,espejo comun,firma,IA,Vogue ybuzon.

-Dos fiestas y dos invitados: claves cruzadas o identidad cambiada se rechazan.
-El DTO no devuelve contacto, notas internas, credenciales, costos ni personal;
  tampoco momentos internos del programa.
-Cada enlace conserva guestId y credencial con caracteres especiales sin partir
  el query. Token guest abre solo su modulo/fiesta, nunca control de operador.
-Pasaron firma alterada, vencimiento y rotacion de credencial de invitado.
-Modulo apagado/no contratado desaparece de los enlaces; el buzon contratado
  sigue separado de entretenimiento y desaparece al descontratarlo tambien.
-Video personal solo tras check-in y solo al invitado asignado; otro invitado
  presente no recibe ese video. getSignedUrl es un doble local, no firma real.

No se probaron camaras,impresoras,modelo IA,hardware360 ni pantallas de estaciones.
No son51pruebas de captura; aceptacion limitada a esos contratos de acceso y
pasaje de identidad. No HTTP/SDK ni bypass por sesion de app en token157.

## Reuso y limites comunes

Se recuperaron antecedentes con Luna acotado y se cerro el agente. El indice134
no demostraba estos cruces; no se infiere que nunca se hubieran auditado. El
antecedente132 de cliente es parcial y no sustituye estos dos eventos cruzados.
No se repitieron builds/suites amplias,171/184/186/198 ni pagos de proveedores153.
Quedan separados los pendientes de programadores, los limites externos y la
cobertura funcional exhaustiva no establecida. Estos84casos NO son toda la app.
