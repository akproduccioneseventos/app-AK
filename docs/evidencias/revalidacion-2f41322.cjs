// Reuse historical probes, injecting the new real calendar dependency and logger.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = fs.readFileSync(path.join(__dirname, 'revalidacion-659d696.cjs'), 'utf8');
let source = base.replace("const agenda=", "const diaCalendario=make('src/lib/reportes/rango-de-dias.ts',['HORAS_DE_DIFERENCIA_CON_GREENWICH','diaEnUruguay','diaCalendario'],{},'diaCalendario');\nconst agenda=");
source = source.replace('{requireAppSession:async()=>{},getFiestas:async()=>dates', '{diaCalendario,requireAppSession:async()=>{},getFiestas:async()=>dates');
source = source.replace('logger:{warn(){}}', 'logger:{warn(){},error(){}}');
source = source.replace('659d696e4807b3fcd543a53988c21c189cf3e806', '2f413228cf97dce5cef6f6bb818c504ec66cef74');
vm.runInNewContext(source, {require, process, console});

