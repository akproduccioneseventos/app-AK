# Orden 56: contraste de avisos en PR1206

Fecha: 2026-09-14. Rama examinada: feat/ordenes-55-56.
SHA: 0f03c998cc36922f754d6e06e21e8c22ea47a796. PR abierta y SHA reconfirmados.
Estado: tres defectos reproducidos TAMBIEN EN LA TANDA. No son arreglos realizados.

## Resultados

- P2 AV-01: sin preferencias guardadas, leerPreferenciasDeAvisos muestra crmUpdates.app=false,
  pero debeEnviarAvisoInterno devuelve true. Tareas tiene el mismo desacuerdo de valores
  predeterminados en el codigo. La prueba ejecutada fue CRM. Un interruptor apagado no
  representa la decision efectiva del despachador antes del primer guardado.
- P2 AV-02: enviarAvisoConPreferencia recibe destinatario target y categoria crmUpdates.
  Autoriza correctamente al destinatario, pero llama createNotification sin transmitir
  esos dos campos. Esta ultima consulta al emisor sender y deduce clientMessages del texto.
  Con sender desactivado y target habilitado, no crea nada y el wrapper devuelve enviado:true.
  Reproducido con las dos funciones reales, no con un createNotification simulado.
  enviarAviso tiene la misma perdida de campos en su camino app (lectura, no segunda sonda).
- P2 AV-03: guardarPreferenciasDeAvisos acepta {taskUpdates:null}, devuelve success:true y
  escribe una vez. Solo valida typeof object. La pantalla usa preferences[section.id].app/email,
  por lo que necesita categorias y canales validos, no nulos. Persistencia invalida reproducida;
  el fallo visual no se ejecuto en navegador.
- CONTROL: destinatario apagado devuelve enviado:false y cero creaciones: PASS.
- CONTROL: destinatario habilitado alcanza persistencia y devuelve notificacion: PASS.

Resultado ejecutado: 3 FAIL esperados que reproducen defectos, 2 PASS; salida 1.
No interpretar las sondas como una suite aprobada.

## Correcciones acotadas

Gemini implementa AV-01 y la validacion estructural AV-03. Para AV-02, Claude define/revisa
la identidad del destinatario y permisos; Gemini ajusta el contrato de resultado del wrapper
segun ese criterio. No ampliar permisos ni cambiar el feed compartido a privado sin decision.
Claude compila. Codex contrasta la evidencia del nuevo SHA.

1. Unificar valores predeterminados de lectura y despacho, incluidas categorias ausentes.
2. Conservar destinatario y categoria explicitos entre capas. Devolver estado diferenciado
   para creado, omitido y error; no usar success como sinonimo de enviado.
3. Validar las cinco categorias y sus booleanos antes de escribir. Rechazar null, arrays,
   strings y estructura incompleta; normalizar registros antiguos al leer sin romper la UI.
4. Agregar los tres casos a src/__tests__/los-avisos-respetan-lo-que-se-apago.test.ts.
   No reemplazar las pruebas que ya pasan. Cubrir tambien enviarAviso y dos usuarios.
5. Pendiente de cobertura adicional: migracion desde dos navegadores con ajustes viejos,
   fallo de lectura del servidor, destinatarios de push y email real. No son fallos certificados
   por estas sondas. Revisar antes de ampliar el alcance o afirmar integracion completa.

## Reproduccion y limites

Sonda: docs/evidencias/56-sondas-avisos.cjs.
Ejecutar con Node y TypeScript disponible: node docs/evidencias/56-sondas-avisos.cjs RUTA_REPO.
Opcional AUDIT_TYPESCRIPT apunta a TypeScript fuera del repo. Se ejecuto con Node24.19.0,
TypeScript5.9.3 y copia de cuatro archivos exactos del SHA indicado.
Extrae declaraciones AST reales; simula sesion, almacenamiento, Firestore, push y duplicados.
No hubo correos, push, datos reales, compilacion, navegador ni despliegue.
No se ejecuto la suite Vitest existente. No certifica todos los emisores ni todas las pantallas.
Graphify no disponible en el worktree desconectado; consulta puntual de fuentes remotas.
Consulta adicional a archivos de main 1255677f fallo; no se atribuye a main/publicado este
resultado. La orden se apoya exclusivamente en la rama pendiente verificada.
