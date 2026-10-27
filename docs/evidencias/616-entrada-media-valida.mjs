import{createRequire}from'node:module';import{transform604,observations604}from'./604-transformaciones-qa.mjs';
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
export{observations604};
export function transform616(file,text){
 let out=transform604(file,text);
 if(file.endsWith('89-la-barra-no-ofrece-lo-agotado.spec.ts'))out=out.replaceAll('test.setTimeout(90_000);','test.setTimeout(240_000);');
 if(file.endsWith('entertainment-stations.spec.ts')){
  const tree=ts.createSourceFile(file,out,ts.ScriptTarget.Latest,true),edits=[];
  function visit(n){
   if(ts.isVariableStatement(n)){
    const d=n.declarationList.declarations.find(d=>d.name.getText(tree)==='stream'&&d.initializer&&ts.isCallExpression(d.initializer)&&d.initializer.expression.getText(tree)==='canvas.captureStream');
    let p=n.parent,inside=false;while(p){if(ts.isCallExpression(p)&&p.expression.getText(tree)==='page.addInitScript')inside=true;p=p.parent;}
    if(d&&inside)edits.push({start:n.getStart(tree),end:n.end,text:n.getText(tree)+'const ac616=new AudioContext();const dest616=ac616.createMediaStreamDestination();const oscillator616=ac616.createOscillator();oscillator616.connect(dest616);oscillator616.start();await ac616.resume();for(const a of dest616.stream.getAudioTracks())stream.addTrack(a);const pump616=setInterval(()=>{const c=canvas.getContext("2d");c.fillStyle="#ffffff";c.fillRect((Date.now()/10)%550,80,20,20);},33);for(const t of stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(pump616);stop();ac616.close().catch(()=>{});};}'});
   }
   ts.forEachChild(n,visit);
  }visit(tree);if(edits.length!==1)throw Error('Exactly one synthetic live camera declaration expected');
  for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.text+out.slice(e.end);
  out=out.replace("test.skip(testInfo.project.name !== 'chromium-desktop', 'MediaRecorder coverage only needs Chromium desktop.');","test.setTimeout(180000);test.skip(testInfo.project.name !== 'chromium-desktop', 'MediaRecorder coverage only needs Chromium desktop.');");
 }
 return out;
}
