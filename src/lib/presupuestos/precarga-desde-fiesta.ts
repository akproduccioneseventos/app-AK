import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { PresupuestoFormData } from '@/types/presupuesto';
import { parseUruguayDate } from '@/lib/utils';

/**
 * Los datos de una fiesta que se pueden adelantar al formulario del presupuesto.
 *
 * Los enlaces "Crear presupuesto" de la ficha de la fiesta mandaban `?fiestaId=` y la pantalla no
 * lo leia: el presupuesto arrancaba en blanco y habia que volver a escribir cliente, fecha e
 * invitados. Solo se devuelven los campos que la fiesta realmente tiene.
 */
export function precargaDesdeFiesta(fiesta: FiestaEnPlanificacion): Partial<PresupuestoFormData> {
  const cfg = fiesta.configuracion;
  if (!cfg) return {};
  const campos: Partial<PresupuestoFormData> = {};

  const cliente = (cfg.clienteNombre || '').trim();
  if (cliente) campos.clienteNombre = cliente;
  const tipo = String(cfg.tipoCelebracion || '').trim();
  if (tipo) campos.eventoTipo = tipo;
  const dia = String(cfg.fechaEvento || '').split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dia)) campos.eventoFecha = parseUruguayDate(dia);
  if (cfg.horaInicio) campos.eventoHoraInicio = cfg.horaInicio;
  if (cfg.nombreLugar) campos.salonFiestas = cfg.nombreLugar;
  if (cfg.protagonista1Nombre) campos.protagonista1Nombre = cfg.protagonista1Nombre;
  if (cfg.protagonista2Nombre) campos.protagonista2Nombre = cfg.protagonista2Nombre;

  const adultos = Number(cfg.invitadosAdultos) || 0;
  const ninos = Number(cfg.invitadosNinos) || 0;
  const adolescentes = Number(cfg.invitadosAdolescentes) || 0;
  const desglose = adultos + ninos + adolescentes;
  if (desglose > 0) {
    campos.invitadosAdultos = adultos;
    campos.invitadosNinos = ninos;
    campos.invitadosAdolescentes = adolescentes;
    campos.invitadosCantidad = desglose;
  } else if (Number(cfg.invitadosEstimados) > 0) {
    campos.invitadosAdultos = Number(cfg.invitadosEstimados);
    campos.invitadosNinos = 0;
    campos.invitadosAdolescentes = 0;
    campos.invitadosCantidad = Number(cfg.invitadosEstimados);
  }
  return campos;
}

/** Nombre para mostrar de la fiesta ("Presupuesto para la fiesta X"). */
export function nombreDeLaFiesta(fiesta: FiestaEnPlanificacion): string {
  const cfg = fiesta.configuracion;
  return (cfg?.nombreEvento || cfg?.clienteNombre || 'esta fiesta').trim();
}
