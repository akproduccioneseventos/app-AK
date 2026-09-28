/**
 * El pedido al proveedor queda anotado y la app dice sola si llegó completo (28/09/2026).
 * Si llega de menos, sale un aviso en el centro de mando antes de la fiesta.
 */
import fs from 'fs';
import path from 'path';
import {
  anotarQueLlegoTodo,
  anotarRecibido,
  estadoDelPedido,
  registrarPedidoEnviado,
  renglonesDelPedido,
} from '@/lib/catering/seguimiento-del-pedido';
import { evaluarReglasParaFiesta } from '@/lib/automatizaciones-engine';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const lista = [
  { nombre: 'Harina', unit: 'kg', cantidadAComprar: 10, origenId: 'ins_harina' },
  { nombre: 'Queso', unit: 'kg', cantidadAComprar: 4, origenId: 'ins_queso' },
  { nombre: 'Sal', unit: 'kg', cantidadAComprar: 0, origenId: 'ins_sal' },
];

const pedido = () => registrarPedidoEnviado(undefined, 'Almacén', 'prov_1', renglonesDelPedido(lista), new Date('2026-09-28T12:00:00Z'));

describe('el seguimiento del pedido', () => {
  it('sólo pide lo que hay que comprar y queda marcado como pedido', () => {
    const estado = pedido();
    expect(estado.pedido).toBe(true);
    expect(estado.pedidoRenglones?.map((r) => r.nombre)).toEqual(['Harina', 'Queso']);
    expect(estadoDelPedido(estado).etapa).toBe('pedido');
  });

  it('dice qué faltó cuando llega de menos', () => {
    const estado = anotarRecibido(anotarRecibido(pedido(), 'ins_harina', 10), 'ins_queso', 3);
    const { etapa, faltantes } = estadoDelPedido(estado);
    expect(etapa).toBe('llego_incompleto');
    expect(faltantes).toEqual([{ nombre: 'Queso', unit: 'kg', faltan: 1 }]);
    expect(estado.entregadoParcial).toBe(false);
  });

  it('"Llegó todo" lo da por completo', () => {
    const estado = anotarQueLlegoTodo(pedido());
    expect(estadoDelPedido(estado).etapa).toBe('llego_completo');
    expect(estado.entregadoParcial).toBe(true);
  });

  it('un número negativo no cuenta como recibido', () => {
    const estado = anotarRecibido(pedido(), 'ins_harina', -5);
    expect(estado.recibidos?.ins_harina).toBe(0);
  });

  it('un pedido incompleto dispara el aviso antes de la fiesta', () => {
    const enDiezDias = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const fiesta = {
      id: 'f1',
      configuracion: { nombreEvento: 'Prueba', fechaEvento: enDiezDias },
      estadosCompra: [anotarRecibido(pedido(), 'ins_queso', 1)],
    } as unknown as FiestaEnPlanificacion;
    expect(evaluarReglasParaFiesta(fiesta).some((a) => a.id === 'pedido-incompleto_f1')).toBe(true);
    const completa = { ...fiesta, estadosCompra: [anotarQueLlegoTodo(pedido())] } as FiestaEnPlanificacion;
    expect(evaluarReglasParaFiesta(completa).some((a) => a.id === 'pedido-incompleto_f1')).toBe(false);
  });

  it('la lista de compras anota el pedido al mandarlo y muestra lo que llegó', () => {
    const pantalla = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx'), 'utf8');
    expect(pantalla).toMatch(/anotarPedidoEnviado\(providerId, providerName, items\)/);
    expect(pantalla).toMatch(/<RecepcionDelPedido/);
  });
});
