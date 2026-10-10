// Real action orchestration; provider, storage and nonexistent target are controlled.
import { sendPersistentMultiAgentMessage } from '@/app/actions/multiagent';
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({success:true,user:{role:'admin'}})) }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async()=>{}) }));
jest.mock('@/ai/flows/multiagent-flow', () => ({ runMultiAgent: jest.fn(async()=>({
  success:true,agentType:'fiesta',agentName:'Agente controlado',response:'Voy a crear la tarea.',
  action:{type:'create_task',data:{texto:'Tarea negativa A86'}},
})) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({getFiestaById:jest.fn(async()=>null)}));
jest.mock('@/lib/multiagent/diagnostics', () => ({}));
jest.mock('@/lib/multiagent/chat-store', () => ({ appendMultiAgentChatTurn:jest.fn(async()=>({id:'chat-ficticio-86'})) }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning:jest.fn(async()=>{}) }));
jest.mock('@/lib/notifications/create-notification', () => ({}));
test('no manda accion create_task a la UI cuando crear la tarea fallo', async()=>{
  const result = await sendPersistentMultiAgentMessage({message:'Crea la tarea',fiestaId:'e2e_inexistente_86',agentType:'fiesta'});
  expect(result.response).toContain('No pude guardar la tarea');
  // Widget maps create_task to the success toast, regardless of failure in response text.
  expect(result.action?.type).not.toBe('create_task');
});
