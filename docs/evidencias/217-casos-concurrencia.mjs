try {
  reset();
  partyBefore=async()=>{
    partyBefore=null;
    signed=true;
    fiesta.contratoFirmaInfo={isSigned:true};
  };
  const signedDuringApproval=await approveService();
  check('signature-arrives-before-party-transaction-blocks-budget-change',
    signedDuringApproval.success===false&&budgetWrites===0&&budget.totalConDescuento===1000&&fiesta.clientServiceChangeRequests[0].status==='pendiente',
    snapshot(signedDuringApproval));

  reset();
  fiesta.clientMenuChangeRequests.push({...clone(fiesta.clientMenuChangeRequests[0]),id:'qa217-menu-B',adultosDelta:3,montoAdicional:120,nuevoTotalEstimado:1120});
  let reached,release;
  const rollbackReached=new Promise(resolve=>{reached=resolve;});
  const rollbackGate=new Promise(resolve=>{release=resolve;});
  let partyCalls=0;
  partyBefore=async()=>{partyCalls++;if(partyCalls===2){reached();await rollbackGate;}};
  writeFailure=true;
  const first=approveMenu();
  await Promise.race([rollbackReached,new Promise((_,reject)=>setTimeout(()=>reject(new Error('QA217_ROLLBACK_GATE_NOT_REACHED')),5000))]);
  writeFailure=false;
  const second=await actions.approveClientMenuChangeRequest(fiesta.id,'qa217-menu-B');
  release();
  const firstResult=await first;
  check('failed-menu-compensation-keeps-other-approved-menu-count',
    firstResult.success===false&&second.success&&fiesta.configuracion.invitadosEstimados===28&&budget.invitadosAdultos===28&&budget.invitadosCantidad===28&&budget.totalConDescuento===1120&&fiesta.clientMenuChangeRequests[0].status==='pendiente'&&fiesta.clientMenuChangeRequests[1].status==='aprobada',
    {firstResult,secondResult:second,...snapshot(second)});
} catch (error) {}
