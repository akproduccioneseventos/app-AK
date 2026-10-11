const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.basename(process.cwd()) !== 'ak-entorno-aislado-102' ||
    path.dirname(process.cwd()) !== path.join(os.tmpdir(),'ak-codex88') || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('QA102 demo only');
const { Query } = require('@google-cloud/firestore');
const get = Query.prototype.get;
Query.prototype.get = async function (...args) {
  if (this._queryOptions?.collectionId === 'fiestas' && fs.existsSync(path.join(process.cwd(),'.qa102-fail-fiesta-reads'))) {
    const record = { time:new Date().toISOString(),pid:process.pid,collection:'fiestas',filters:this._queryOptions.filters.length };
    fs.appendFileSync(path.join(process.cwd(),'qa102-read-faults.jsonl'),JSON.stringify(record)+'\n');
    console.error('[QA102] Controlled unavailable fiestas query',record);
    const error = new Error('QA102 isolated read unavailable'); error.code = 14; throw error;
  }
  return get.apply(this,args);
};
