# Revision principal del ayudante203

Fuente fa3b492b8f1d6a77433a92f4d63b665cfea3747c. El blob local del componente
ec415320eaebfcf6ef30c62fee7ab568721dd0f3 coincide con Git. Tres salidas ICS
reales capturadas desde ReactDOM conservan fechas/horas civiles y cruce de ano.
Aceptado ese alcance, no importacion nativa en un calendario externo.

La frase del ayudante 'defecto de interoperabilidad' NO se acepta como fallo
confirmado del programa importador ni como archivo ICS invalido. La
[RFC5545,3.3.5](https://www.rfc-editor.org/rfc/rfc5545#section-3.3.5) permite
horas flotantes; para un instante fijo recomienda UTC o referencia de zona.
Un archivo sin TZID ni Z tiene esa semantica flotante. Es un RIESGO/PROPUESTA
de interoperabilidad para invitados en otras zonas, no otra orden urgente ni
otro error sumado al contador sin comprobar el consumidor concreto.

El JSON original allPass:true se refiere a los tres casos civiles; el texto FAIL
del criterio de zona no es una cuarta prueba dinamica ejecutada. Se conservan
el informe, sonda y recibo originales sin editar para no ocultar esta distincion.
Incidente inicial URLSearchParams fue QA, no app. El ayudante fue cerrado.
