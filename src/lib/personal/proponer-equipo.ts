import type { Empleado } from '@/types/empleado';
import type { FiestaEnPlanificacion, PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import type { Rol } from '@/types/rol';

export interface RequiredRoleItem {
  roleId: string;
  roleName: string;
  quantity: number;
  customSalary?: number;
}

export interface ProponerEquipoOpciones {
  fiestaActual: FiestaEnPlanificacion;
  todasLasFiestas: FiestaEnPlanificacion[];
  empleados: Empleado[];
  roles: Rol[];
  requiredRoles: RequiredRoleItem[];
  asignacionesActuales?: PersonalAsignadoDetalleStorage[];
}

/**
 * Propone la asignación de personal para una fiesta cumpliendo las reglas del dueño:
 * 1. Para cada rol necesario, busca un empleado habilitado para ese rol.
 * 2. Un empleado asignado a OTRA fiesta el mismo día NO puede ser asignado (cero solapamientos).
 * 3. Reparte el trabajo equitativamente entre los empleados disponibles para no sobrecargar siempre al mismo.
 * 4. Respeta el sueldo del rol o el sueldo personalizado si viene especificado.
 */
export function proponerEquipoParaFiesta(
  opciones: ProponerEquipoOpciones,
): PersonalAsignadoDetalleStorage[] {
  const { fiestaActual, todasLasFiestas, empleados, roles, requiredRoles } = opciones;
  // Lo que ya está asignado en esta fiesta NO se reemplaza: se conserva con su empleado y su
  // sueldo (puede haberse cargado a mano), y la propuesta sólo completa los lugares vacíos.
  const actuales = (opciones.asignacionesActuales ?? fiestaActual.personalAsignado ?? []) as PersonalAsignadoDetalleStorage[];
  const sinUsar = actuales.filter((a) => a.empleadoId);

  const fechaActualStr = (fiestaActual.configuracion?.fechaEvento || '').slice(0, 10);

  // 1. Identificar empleados ocupados en OTRA fiesta el mismo día
  const empleadosOcupadosEseDia = new Set<string>();
  const conteoHistoricoAsignaciones: Record<string, number> = {};

  // Inicializar conteo para todos los empleados
  for (const emp of empleados) {
    conteoHistoricoAsignaciones[emp.id] = 0;
  }

  for (const fiesta of todasLasFiestas) {
    if (fiesta.estado === 'Archivado') continue;
    const fiestaFechaStr = (fiesta.configuracion?.fechaEvento || '').slice(0, 10);

    const esMismoDia = Boolean(fechaActualStr && fiestaFechaStr && fechaActualStr === fiestaFechaStr);
    const esOtraFiesta = fiesta.id !== fiestaActual.id;

    for (const item of fiesta.personalAsignado || []) {
      if (item.empleadoId) {
        // Si es otra fiesta el mismo día, queda bloqueado para esta fecha
        if (esMismoDia && esOtraFiesta) {
          empleadosOcupadosEseDia.add(item.empleadoId);
        }
        // Conteo histórico global para equilibrar
        conteoHistoricoAsignaciones[item.empleadoId] =
          (conteoHistoricoAsignaciones[item.empleadoId] || 0) + 1;
      }
    }
  }

  // 2. Contador local de asignaciones en la fiesta actual
  const asignadosEnEstaFiesta: Record<string, number> = {};
  const propuesta: PersonalAsignadoDetalleStorage[] = [];
  for (const a of sinUsar) asignadosEnEstaFiesta[a.empleadoId] = (asignadosEnEstaFiesta[a.empleadoId] || 0) + 1;

  for (const req of requiredRoles) {
    const rolDef = roles.find((r) => r.id === req.roleId);
    const sueldo = req.customSalary ?? rolDef?.sueldoPorEvento ?? 0;

    for (let i = 0; i < req.quantity; i++) {
      const yaEstaba = sinUsar.findIndex((a) => a.rolId === req.roleId);
      if (yaEstaba !== -1) {
        propuesta.push(sinUsar[yaEstaba]);
        sinUsar.splice(yaEstaba, 1);
        continue;
      }
      // Filtrar empleados capacitados para este rol
      const candidatos = empleados.filter((emp) => {
        // Habilitado para este rol
        const tieneRol = emp.rolIds ? emp.rolIds.includes(req.roleId) : true;
        if (!tieneRol) return false;

        // No debe estar en otra fiesta ese día
        if (empleadosOcupadosEseDia.has(emp.id)) return false;

        // Máximo 2 roles en la misma fiesta
        const enEstaFiesta = asignadosEnEstaFiesta[emp.id] || 0;
        if (enEstaFiesta >= 2) return false;

        return true;
      });

      // Ordenar candidatos por:
      // a) Menor cantidad de roles en esta fiesta (preferir los que aún tienen 0)
      // b) Menor cantidad histórica de asignaciones (reparto equitativo)
      // c) Por id para determinismo
      candidatos.sort((a, b) => {
        const localA = asignadosEnEstaFiesta[a.id] || 0;
        const localB = asignadosEnEstaFiesta[b.id] || 0;
        if (localA !== localB) return localA - localB;

        const histA = conteoHistoricoAsignaciones[a.id] || 0;
        const histB = conteoHistoricoAsignaciones[b.id] || 0;
        if (histA !== histB) return histA - histB;

        return a.id.localeCompare(b.id);
      });

      const elegido = candidatos[0];
      if (elegido) {
        propuesta.push({
          empleadoId: elegido.id,
          rolId: req.roleId,
          eventSalary: sueldo,
        });
        asignadosEnEstaFiesta[elegido.id] = (asignadosEnEstaFiesta[elegido.id] || 0) + 1;
        conteoHistoricoAsignaciones[elegido.id] = (conteoHistoricoAsignaciones[elegido.id] || 0) + 1;
      } else {
        // No hay nadie libre para este puesto: queda vacante para completar manualmente
        propuesta.push({
          empleadoId: '',
          rolId: req.roleId,
          eventSalary: sueldo,
        });
      }
    }
  }

  // Los asignados que no encajan en ningún rol pedido (extras cargados a mano) también quedan.
  propuesta.push(...sinUsar);
  return propuesta;
}
