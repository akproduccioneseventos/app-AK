# Orden200 - El empleado no puede abrir su propio portal

**NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.** Responsable Claude,
por permisos y sueldos. ID: AK-CODEX-156-PERSONAL-LECTURAS-PREVIAS. P1 funcional.
Pendiente de correccion; no implementado por Codex. Juntar con la tanda abierta.

Fuente reproducida:894d01603e0e03cebc8f90a6ccf869ef86bbe1de. Claude publico
16a9407c solo cambia docs/QA, sin appdiff. Contrastar nuevo HEAD antes de implementar.
En1337/45a0, getEmployeeWorkspacePortal usa getRoles en vez de leerRolesInterno,
pero sigue pidiendo primero getEmpleados ygetFiestas; ambos cuerpos son iguales
a main, igual usuarioDelEquipo. requireEquipo tiene otro recorte de salida.
Ver156-contraste.json: no se da equivalencia transitiva ni retest1337 por hecho.
La regla historica de193 "cada empleado ve solo lo suyo" SE CONSERVA: lo que
falla es llegar hasta esa comprobacion, no esa regla ni sus permisos generales.

## Reproduccion con consumidores reales

src/app/personal/[empleadoId]/page.tsx: PersonalWorkspacePage llama a
getEmployeeWorkspacePortal de src/app/actions/google-workspace.ts.

La sesion tiene perfil personal e ID del empleado A, o correo verificado de A.
Hay fichas ficticias A y B. Aunque no tenga fiestas asignadas, A debe poder ver
su propia ficha y el estado vacio que la pantalla ofrece.

getEmployeeWorkspacePortal empieza con Promise.all de getEmpleados,
leerRolesInterno,getFiestas yreadAccounts. El chequeo isOwnPortal viene DESPUES.

-getEmpleados REAL rechaza personal: "Tu perfil no tiene acceso a los datos del
  personal." Por eso no se llega a isOwnPortal ni se devuelve la ficha propia.
-Sustituyendo SOLO esa lectura por fichas ficticias, getFiestas REAL sigue
  rechazando personal en requireEquipo: "Tu usuario no tiene acceso a las fiestas."
-Dueno positivo pasa; otros perfiles sin permiso son rechazados. Las lecturas
  generales DEBEN seguir rechazando personal, y sus controles tambien pasan.

156-portales-cruzados-final.json:33casos,30PASS/3FAIL; tres aserciones del MISMO
bloqueo de portal propio, no tres bugs. Se ejecutaron cuerpos y guardias reales
con sesion/BD controladas, NO HTTP ni interfaz nativa. No hubo datos reales.

## Correccion acotada

-Resolver la identidad y el acceso propio antes de usar listados generales.
-Usar una lectura interna limitada al empleado autorizado y a sus asignaciones,
  conservando su propio sueldo y sin devolver el de otra persona.
-NO dar ORGANIZACION,SUELDOS u otros permisos generales a personal. NO abrir
  getEmpleados/getFiestas a ese perfil para hacer pasar el caso.
-No cambiar redaccion financiera de otros perfiles ni el criterio de identidad
  propia por ID/correo verificado existente. No usar correo enviado por pantalla.
-Probar el camino completo con ambas dependencias reales, no mockearlas como
  exitosas: propio porID y porcorreo; ajeno; anonimo; dueno; secretaria/operador.
  Agregar dos fiestas y dos personas con sueldos distintos para comprobar el
  dato propio y aislamiento. Ese ultimo criterio y retest UI estan PENDIENTES.

Historico: YA-RESUELTO del11/8 afirma solucionado el portal propio, y la prueba
release-security-boundaries solo busca texto de isOwnPortal. No cubre este fallo
de composicion con permisos de las lecturas actuales. No reabrir la politica.

```comprobar
archivo: src/app/actions/google-workspace.ts
usa: getEmployeeWorkspacePortal en src/app/personal/[empleadoId]/page.tsx
prueba: docs/evidencias/156-portales-cruzados.mjs
```
