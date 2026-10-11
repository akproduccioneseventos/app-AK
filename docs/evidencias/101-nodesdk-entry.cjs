const {NodeSDK}=require('@opentelemetry/sdk-node');
let constructed=false,error;
try{const sdk=new NodeSDK({autoDetectResources:false});constructed=!!sdk;}catch(e){error=e.message;}
module.exports={type:typeof NodeSDK,constructed,error};
