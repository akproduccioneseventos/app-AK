const fs=require('node:fs');
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085') throw new Error('Demo boundary only');
const {Query}=require('@google-cloud/firestore'),get=Query.prototype.get;
Query.prototype.get=async function(...args) {
  if(this._queryOptions?.collectionId==='fiestas' && fs.existsSync('docs/evidencias/.110-fail-fiesta-reads')) {
    fs.appendFileSync('docs/evidencias/110-provider-faults.jsonl',JSON.stringify({time:new Date().toISOString(),pid:process.pid,collection:'fiestas',filters:this._queryOptions.filters.length})+'\n');
    const error=new Error('QA110 controlled emulator read failure');error.code=14;throw error;
  }
  return get.apply(this,args);
};
