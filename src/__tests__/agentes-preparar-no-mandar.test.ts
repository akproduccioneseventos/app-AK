import fs from 'fs';
import path from 'path';

const read = (relPath: string) => fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

describe('Regla de Oro: Los agentes preparan, nunca mandan ni cobran solos', () => {
  it('el motor de agentes deja mensajes en estado pendiente en la bandeja de salida, nunca enviados', () => {
    const motor = read('src/lib/agentes/motor-agentes.ts');

    // Debe asignar status: 'pendiente'
    expect(motor).toContain("status: 'pendiente'");
    // No debe marcar mensajes nuevos como 'enviado' o 'sent'
    expect(motor).not.toMatch(/status:\s*['"]enviado['"]/);
    expect(motor).not.toMatch(/status:\s*['"]sent['"]/);
  });

  it('las acciones de CRM del multiagente exigen confirmación explícita para leads y presupuestos', () => {
    const flow = read('src/ai/flows/multiagent-flow.ts');
    const actions = read('src/lib/multiagent/assistant-crm-actions.ts');

    expect(flow).toContain('requiresConfirmation: true');
    expect(actions).toContain('prepareAssistantLeadProposal');
    expect(actions).toContain('prepareAssistantBudgetProposal');
    expect(actions).toContain('prepareWhatsAppMessage');
  });

  it('el encargado y el flujo multiagente no contienen funciones de borrado destructivo ni cobro autónomo', () => {
    const flow = read('src/ai/flows/multiagent-flow.ts');
    const encargado = read('src/lib/multiagent/encargado.ts');

    // No deben ejecutar llamadas de cobro directo a pasarelas ni borrado masivo
    expect(flow).not.toContain('deleteDatabase(');
    expect(flow).not.toContain('chargeCreditCard(');
    expect(encargado).not.toContain('deleteDatabase(');
    expect(encargado).not.toContain('chargeCreditCard(');
  });

  it('la puerta de tareas programadas prohíbe el envío autónomo hacia clientes', () => {
    const puerta = read('src/lib/automatico/puerta-de-las-tareas.ts');

    expect(puerta).toContain('preparar si, mandar no');
  });
});
