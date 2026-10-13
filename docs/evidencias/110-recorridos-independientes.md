# Auditoria110 - Recorridos independientes de las correcciones pendientes

12/10/2026. Organizador y visitante anonimo; PC1440x1000 / Pixel7.
HEAD probado2f6007be, main99faf4eb, fuente app compilada8fa5b56a.
PR1288 abierta; no fusion. Tanda privada Claude desconocida: contrastar orden156.

## Metodo y resultado

Browser real sobre Next de produccion local3300 (JSON) y3301 (SDK Firestore),
emulador demo8085. Sin .env/ADC ni cuentas reales. Datos QA110 ficticios y
copias locales restauradas por bytes; memoria/notificaciones propias retiradas.
Se reutilizan build/Jest/tipos106 de la misma fuente; no nueva compilacion ni
cambios de app o dependencias. Graphify y simbolos consultados puntualmente.
Un ayudante economico acoto recorridos aun sin evidencia y fue cerrado;
Codex reprodujo y contrasto los hallazgos. No certificacion de toda la app.

`110-resultado.json`, producido por `110-verificar-evidencia.mjs`, concilia
criterios finales y hashes. No suma descubrimientos, sondas incompletas o la misma
prueba reintentada como aprobaciones adicionales. PASS de recopilacion sobre una
observacion defectuosa se normaliza como FAIL de aceptacion.

## Comprobado sin repetir areas pendientes

- Proveedores: crear y recargar, rechazar duplicado, editar y recargar; al fallar
  guardar conserva dato persistido/formulario y muestra error. PC/movil.
- Plantilla maestra de reuniones: guardar y recargar; el formulario de reunion
  consume ese checklist en la solapa Guia y Checklist. PC/movil.
- Invitacion propia: crear, recargar y eliminar definitivamente. PC/movil.
- Control: evento/tarea correctos con enlaces relacionados; Preparacion abre
  efectivamente la fiesta correcta. El cierre post-fiesta guarda aprendizaje en
  los perfiles fiesta, fiestas_general y marketing y persiste tras recargar.
- Avisos reales no duplicados por repetir revision en las fiestas ficticias;
  NO implica que su contador sea correcto ni entrega real de push.
- Marketing: plantilla guarda copia exacta y se aplica tras recargar; checklist
  conserva hecho/responsable; descarga JSON real contiene ambos. PC/movil.
- Editores/publicacion: resultado final detallado en `110-editores.json`.
  La portada tiene revalidate300; no interpretar un primer HTML cacheado como
  fallo de guardado. Portal LED/catalogo se verifican como visitante sin cookie.
  Cuatro criterios finales pasan; portada cambia en65.993s PC y294.098s movil.

## Nueve defectos concretos, pendientes de correccion

1. Proveedor final borrado de Firestore reaparece desde JSON al recargar.
   `110-providers.json`, dos capturas provider-delete.
2. Borrado de plantilla base anuncia Plantilla Eliminada pero reaparece.
   `110-acciones.json`, dos capturas invitation.
3. Fallo de lectura comercial muestra Todo tranquilo.
4. Fallo de lectura post-fiesta muestra No hay fiestas recientes.
5. Fallo al ejecutar automatizaciones no informa el resultado fallido.
6. Fallo al crear avisos comerciales tampoco informa el resultado fallido.
   Los cuatro: `110-centro.json`, ocho capturas, una sola accion bloqueada por caso.
7. Torre de control oculta error real de lectura y presenta cero fiestas proximas.
8. Preparacion oculta esa lectura fallida y declara que no hay fiestas.
   `110-negocios.json`, cuatro capturas; fallos SDK en110-provider-faults.jsonl.
9. Revision repetida anuncia uno/dos avisos nuevos con cero documentos nuevos,
   por preferencias que silencian tareas. `110-counts.json` compara estado real.

Orden156 identifica archivo/simbolo/consumidor y propuesta de regresion PENDIENTE.
No reabrir152-155 ni cambiar decisiones comerciales/proteccion de datos.
Plantillas base: falta decision de dueno entre protegerlas u ocultarlas.

## Sondas descartadas y ajustes del auditor

- Descubrimiento inicial: selecciones main anidado ambiguas; reintento con
  selector acotado. Renderizar rutas no acepta sus botones.
- Guardado de proveedor en modo local bloqueado por guardia deliberada; se repitio
  por SDK real emulado. Esa guardia NO es bug de produccion.
- Checklist de reunion no se buscaba en su solapa; corregido el recorrido, paso.
- Interceptar todo POST bloqueaba AuthGuard; descartado y sustituido por Next
  action ID exacto. Prueba inicial detenida, no defecto de autenticacion.
- Fixture incompleto y expectativa de notas internas en perfil marketing eran
  errores de prueba; se uso el modelo existente y aprendizaje por titulo/tipo.
- Loader fixture inicial pedia esbuild ausente: sustituido por TypeScript existente
  solo en generador QA, sin instalar ni compilar la app.
- En marketing se esperaba nombre en una plantilla generica; comparacion corregida
  a copia realmente generada. Segundo click del mismo checklist lo destilda:
  movil prueba otra fila. No son perdidas de guardado.
- Una sonda de contador quedo colgada y fue cerrada; otra esperaba cierre total
  de stream HTTP aunque la accion ya terminaba. Final espera respuesta y boton
  habilitado y contrasta Firestore. No se transforma el timeout en fallo de app.
- Indicador Guardado oculta texto en movil y conserva icono/title; selector QA
  corregido. La comprobacion inicial incompleta no es bug de guardado movil.

JSON/logs iniciales se conservan, pero quedan fuera de la matriz aceptada.
Inventarios de descubrimiento110-recorridos-inicial/retry y log del emulador
se entregan comprimidos .gz sin perdida para evitar miles de lineas en el diff.

## Cierre del entorno

`110-entorno-detenido.json` conserva comandos y arboles de procesos propios.
3300/3301/8085 sin listeners al cierre; wrappers y emulador detenidos a proposito.
Exit1/4294967295 del cierre NO equivale a fallo de build ni aplicacion.
No se cerro ningun servicio de Claude/Gemini ni se modificaron sus archivos.

## Lo que NO queda certificado

No cada boton/variante de421rutas, roles completos, concurrencia de toda la app,
Hardware/Hosting Firebase con mismoSHA, originales19presupuestos, OAuth/modelos,
publicacion social, push/correo/pagos reales. No marcar14areas limpias por inventario.
Los casos sin evidencia final siguen en matriz109; los corregidos requieren
revalidacion contra el SHA nuevo. Esta entrega termina este lote independiente,
no afirma que no falte ninguna otra prueba de la aplicacion.
