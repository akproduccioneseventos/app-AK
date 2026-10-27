const fail = () => { throw new Error('QA725: egreso de red real bloqueado'); };
for (const name of ['http', 'https']) {
  const mod = require(name);
  mod.request = fail;
  mod.get = fail;
}
const net = require('net');
net.connect = fail;
net.createConnection = fail;
global.fetch = fail;
