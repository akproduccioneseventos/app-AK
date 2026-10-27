# Orden242 - Dos causas concretas de barra

Area barra. B1Gemini, B2Claude (permisos). Claude compila/valida/fusiona; Codex
solo audita. Una tanda, no fusionar documentacion sola ni otra carta paralela.

Fuente c0add57f6237f666db97e7e902ef75f6c8d97479. Blobs relevantes iguales en
PR1368-0929 y ramaClaude publicada bf0ba6c3. NO CONTRASTADO CON CAMBIOS PRIVADOS
NO PUBLICADOS, incluida nueva carta/menores que se esta programando. Contrastar
HEAD real primero y agregar estos criterios a esa entrega si ya tiene arreglo.

## B1 Gemini - AK-CODEX-717-CAIPIRINHA-FILTRO

getDrinkTags no clasifica Caipirinha default (Cachaca) como Con alcohol; visibleDrinks
la excluye de esa categoria. Sonda717:1FAIL/4PASS. No borrar el trago ni cambiar
receta/stock/foto/id para taparlo. Usar la clasificacion fiable de la carta nueva
si existe; no reglas de texto ambiguas como control de menores.

Criterios: Caipirinha figura en Con alcohol; controlRon conserva comportamiento;
sin alcohol real no se convierte en alcohol por coincidencias de nombre; no perder
metadatos al pasar maestro -> fiesta -> DTOpublico -> totem/portal. Categoria
desconocida no se certifica sin alcohol. Agregar regresion al consumidor real.
No sumar este hallazgo como una nueva funcionalidad de filtro ausente: filtro YAexiste.

## B2 Claude - AK-CODEX-719-PERFIL-INVALIDO-BARRA

Con sesion firmada de QA, perfil explicito desconocido +roleadmin accede a guardia
y panel privado. 719 confirma2FAIL/5PASS sin mock de verifySession. 718 inicial
conserva variantes y sus limites; NO usar sus errores de mocks como defectos de app.

Aplicar rechazo seguro de perfil explicito invalido donde corresponde sin romper
admin/user legado que realmente carecen del campo perfil. Respetar perfil valido
restringido aunque tenga roleadmin. Revisar alcance compartido de perfilDe/puede
antes de modificarlo: Codex no autoriza elevar permisos ni cambiar negocio.
Conservar operador SOLOenfiestaasignada, secretaria/dueño segun permisos vigentes.
No corregirlo solo escondiendo boton o modificando fixture/token de prueba.

Criterios: invalidofirmado denegado sin datos/escrituras; valido restringido+admin
denegado; firma alterada/ausente denegadas; dueño valido y adminlegadoSINperfil pasan;
operadorasignado pasa y noasignado no. Verificar cinco acciones ademas del helper.
No afirmar ataque anonimo, cuenta real comprometida ni stock alterado: NO probados.

## Validacion y entrega

- Preservar55pruebas existentes716; no weakening para nueva carta/recetas.
- Corregir y retestear717/719;718 puede completarse con sus fronteras bien modeladas
  sin borrar resultados previos. Pruebas de nueva carta/menores dependen de suSHA.
- Menores: cumplir decision del dueño, validar servidor/DTO/seleccion/reintento/cola
  offline y grupo mixto. No decidir edad por nombre/foto ni kidsCount del grupo.
  No dar por hechas estas guardas por existir un boton; mostrar resultados observados.
- Claude compila conjunto congelado y registraSHA/entorno/tipos/lint/acentos/Jest/build.
  Datos ficticios, ningun servicio/cuenta/cargo/stock reales. Codex no fusiona.
- Actualizar YA/ESTADO y dejar aCodex solo el delta para retest; esta area sigue
  CON HALLAZGOS hasta verificar correccion. Claude mantiene contador.

Los archivos de sonda siguientes existen y fueron ejecutados sobre fuente indicada:
717falla porB1,719falla porB2. No son pruebas aprobadas de la futura correccion.

```comprobar
archivo: src/lib/barra-tecnologica.ts
usa: getDrinkTags en src/app/evento/barra/[fiestaId]/page.tsx
usa: requireEventPermission en src/app/actions/fiesta/barra-tecnologica.actions.ts
prueba: docs/evidencias/717-barra-filtro-carta-sonda.cjs
prueba: docs/evidencias/719-barra-sesion-firmada.test.ts
```
