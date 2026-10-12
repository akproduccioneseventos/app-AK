# 155 - Cerrar permisos documentales y priorizar imagenes

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Destinatario: Claude (permisos/dinero/compilacion). Confirmar la entrega privada
antes de programar; no duplicar152-154. Una sola tanda, no fusion automatica.

## Version y clasificacion

PR1288, rama codex/auditoria-97-ia-contexto-20261011, HEAD43620d4c10ff38b8f77223905089a19d15002053.
Main99faf4eb061fa46341cfdde6f81b93b3bfb9c73c. Fuente compilada8fa5b56a2833938541a657dcd15ef88130d24b0e.
Los cinco handlers y perfiles son iguales a main. Reproduccion en candidato
aislado, NO comprobacion del despliegue. Codex no cambia codigo de produccion.

## P1 - Documentos de otros accesibles con cualquier perfil firmado

Cinco archivos comprobados, simbolo GET real en todos:
- src/app/api/employee-contracts/[filename]/route.ts
- src/app/api/contracts/[filename]/route.ts
- src/app/api/payment-proofs/[filename]/route.ts
- src/app/api/budgets/[filename]/route.ts
- src/app/api/salon-contracts/[filename]/route.ts

Todos verifican hasAppSession, luego sirven el archivo sin permiso de area ni
pertenencia. Con cinco PDFs ficticios y cookies firmadas del entorno de prueba:
dueno, secretaria, operador, personal, cliente e invitado reciben200 y los bytes
exactos. Anonimo recibe401. El hallazgo NO permite falsificar cookies productivas
ni prueba acceso anonimo: requiere sesion firmada de un perfil con menor permiso.

Veinte casos indebidos comprobados: operador/personal/cliente/invitado por cinco
archivos. Cada PDF es ajeno a esos perfiles, sin asociacion ni autorizacion individual.
Operador/personal son perfiles reales del equipo; cliente/invitado firmados son
controles sinteticos de defensa, no prueba de que hoy reciban cookie del equipo.
Secretaria se registra, pero no se considera que toda su descarga sea indebida:
contratos laborales pueden incluir sueldo; confirmar acceso SUELDOS vs contrato
sin sueldo segun la politica existente, no inventar que toda secretaria es dueno.

Control adicional: los mismos cinco perfiles restringidos reciben403 en
/api/backup/download. Por tanto el test no los esta convirtiendo en admin.
PC/Pixel7: operador pulsa el enlace real Descargar backup ahora y recibe403.
La pantalla ofrece una accion no disponible, friccion; NO fuga de backup.

Correccion requerida:
1. Aplicar permisos existentes: finanzas CONTABILIDAD; laborales SUELDOS o
   autorizacion individual estricta para el documento propio del empleado.
2. Verificar pertenencia al recurso si hay acceso publico/cliente/personal
   permitido. Conservar los enlaces oficiales con token; no abrir todos los
   archivos a cualquier cliente ni romper el acceso propio ya aprobado.
3. Si no hay relacion de propiedad verificable, rechazar antes de leer. No
   resolverlo escondiendo el enlace, haciendo dificil adivinar el nombre o
   confiando solo en filename/path.basename. Mantener defensa de traversal.
4. Revisar variantes de esta misma familia: firmante generico Storage y exports.
   Son riesgos a contrastar, NO fallos ejecutados con proveedor real en109.
5. Retest positivos dueno/secretaria permitida/acceso propio; negativos perfiles,
   otro empleado/fiesta, sin sesion, vencida, firma alterada y archivo inexistente.
   Probar el enlace real de CustomerDetailsPage/EditarEmpleadoPage, no solo mock.

Consumidores verificados: src/app/(app)/customers/[id]/page.tsx,
CustomerDetailsPage enlaza /api/contracts y /api/budgets (303/310);
src/app/(app)/empleados/[id]/editar/page.tsx, EditarEmpleadoPage enlaza
/api/employee-contracts (267). No se inventa consumidor para los otros dos.

## Triage de27 avisos, no27 exploits de AK

Ver docs/evidencias/109-seguridad-contraste.json.gz:27GHSAs con fuente oficial,
version instalada, rama parcheada, padres del lock y clasificacion de uso.
No se quitaron avisos ni modificaron dependencias para maquillar el contador.

Prioridad: sharp0.34.5/libvips8.17.3 procesa una imagen local por la ruta publica
/_next/image sin sesion (200/image/png/9528bytes). Tres avisos de memoria nativa:
GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c, GHSA-wq5f-xc86-pv6w.
Esto prueba que el procesador se usa, NO una explotacion. No ejecutar archivos
maliciosos en la web ni afirmar que todas las versiones GIF/HEIF/SVG se probaron.
Next15.5.27 admite sharp ^0.34.3 || ^0.35.4; evaluar35.5 o parche superior de
esa rama con engine real de AppHosting, binarios y prueba de formatos soportados.
No cambiar formatos admitidos ni apagar optimizacion sin aprobacion del dueno.

Otros24:9 de tooling/build (uno braces sin parche oficial en snapshot),4 de
telemetria desactivada por alias,11 cuyo modo/entrada vulnerable no aparece en
los consumidores inspeccionados. NO equivalen a24 falsos avisos eliminados.
Actualizar de manera compatible; no audit fix --force, downgradePWA ni migracion
Tailwind para reducir el contador. DOMPurify3.4.16, fast-uri3.1.8, grpc1.14.5 y
qs6.16.0 tienen ramas parcheadas documentadas; valorar el conjunto y probar.
postcss-selector-parser6.1.3 cubre solo el aviso antiguo, no todos; uuid requiere
compatibilidad de SDK, no override mayor ciego. Mantener telemetria apagada.

## Cobertura y evidencia

Inventario AST109:421rutas (373paginas/48handlers),4147controles declarados en
paginas y845 en144componentes. Son declaraciones, NO botones pulsados ni estados
aprobados.106rutas tienen referencia textual E2E;315 no la tienen por ese metodo,
lo cual NO significa315sin probar. Pruebas dinamicas/helpers/registros anteriores
requieren conciliacion por caso ySHA. Ninguna area entera se marca limpia.
La conciliacion de imports con106Jest firmado por hashes deja11rutas con referencia
unitaria directa,325con dependencia probada y73sin referencia automatica E2E/unitaria.
Conjuntos solapados; NO porcentaje de cobertura funcional. Ver109-matriz-conciliada.json.gz.

Las sondas de documentos y controles de backup tienen bytes/estado y restauracion
de archivos; el primer fallo de fixture/cookie esta conservado y NO cuenta como
error de login de la app. No repetir las4139Jest/build8fa solo por este informe.
Al corregir produccion, Claude valida el delta y una verificacion conjunta final.

El bloque siguiente es aceptacion PENDIENTE de la nueva correccion, no describe
un import ya existente en employee-contracts. La funcion y los archivos existen;
las pruebas nuevas propuestas no se presentan como ejecutadas.

```comprobar
archivo: src/lib/auth/require-session.ts
usa: requirePermiso en src/app/api/employee-contracts/[filename]/route.ts
usa: requirePermiso en src/app/api/budgets/[filename]/route.ts
usa: requirePermiso en src/app/api/storage/signed-url/route.ts
prueba: src/__tests__/los-documentos-de-plata-piden-permiso.test.ts
```
