const deny = () => { throw new Error('QA132 blocks real network; use an explicit synthetic provider'); };
for (const name of ['http', 'https']) {
  const module = require(name);
  module.request = deny;
  module.get = deny;
}
globalThis.fetch = deny;
