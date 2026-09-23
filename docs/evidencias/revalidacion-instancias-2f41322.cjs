// Two module instances with independent real mutexes, sharing one persistence mock.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let wrapper=fs.readFileSync(path.join(__dirname,'revalidacion-catalogos-2f41322.cjs'),'utf8');
wrapper=wrapper.replace('vm.runInNewContext(s,{require,process,console});', `
s=s.replace("const api=build([['src/app/actions/catalogo-fotos.ts'", "const createApi=()=>build([['src/app/actions/catalogo-fotos.ts'");
s=s.replace("'addCatalogoFoto');if(concurrent)", "'addCatalogoFoto');const api=createApi(),other=createApi();if(concurrent)");
s=s.replace("api({id:'a'}),api({id:'b'})", "api({id:'a'}),other({id:'b'})");
s=s.replace("const api=build([['src/app/actions/salones.ts'", "const createApi=()=>build([['src/app/actions/salones.ts'");
s=s.replace("'saveSalon');const inputs=", "'saveSalon');const api=createApi(),other=createApi();const inputs=");
s=s.replace("Promise.all(inputs.map(api))", "Promise.all([api(inputs[0]),other(inputs[1])])");
s=s.replace(/\\(async\\(\\)=>\\{for\\(const m of \\[.*?console.log\\(JSON.stringify/s, "(async()=>{await catalog(true);await salons(true);console.log(JSON.stringify");
vm.runInNewContext(s,{require,process,console});
`);
vm.runInNewContext(wrapper,{require,process,console,__dirname});

