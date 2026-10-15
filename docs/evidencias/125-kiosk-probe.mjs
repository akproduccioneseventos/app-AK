import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, devices } from '@playwright/test';
import sharp from 'sharp';

const source='b520f7cee28546634e1c87391efd7a80e1a40f48';
assert.equal(process.env.COMMIT_SHA,source);
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
const browser=await chromium.launch({headless:true});
const cases=[];
try {
  for(const [name, options] of [['desktop',{viewport:{width:1280,height:900}}],['mobile',devices['Pixel 7']]]) {
    const context=await browser.newContext(options);
    const page=await context.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try {
      await page.goto('http://127.0.0.1:3302/entrada');
      await page.getByRole('heading',{name:'Configuración de Kiosco',exact:true}).waitFor();
      const select=page.getByLabel(/Seleccionar Evento \/ Fiesta/);
      await select.waitFor();
      assert.equal(await select.inputValue(),'qa125-fiesta');
      const group=page.getByRole('group',{name:/Rol del Dispositivo/});
      const buttons=group.getByRole('button');
      assert.equal(await buttons.count(),11);
      const roles=[];
      for(let index=0;index<11;index++) {
        const button=buttons.nth(index); await button.click();
        assert.equal(await button.getAttribute('aria-pressed'),'true');
        assert.equal(await group.locator('button[aria-pressed="true"]').count(),1);
        roles.push((await button.innerText()).trim());
      }
      cases.push({name:name+'-all11-role-selection-and-named-event',status:'PASS',roles,selectedEvent:'qa125-fiesta'});
      await group.getByRole('button',{name:'Tótem LED',exact:true}).click();
      const input=page.getByLabel('Identificador del Tótem',{exact:true});
      assert.equal(await input.inputValue(),'');
      await page.getByRole('button',{name:'Dejar el aparato listo',exact:true}).click();
      const alert=page.getByRole('alert').filter({hasText:/identificador real/}); await alert.waitFor();
      assert.match(await alert.innerText(),/identificador real/);
      assert.equal(new URL(page.url()).pathname,'/evento/barra');
      await input.fill('qa125-totem'); assert.equal(await input.inputValue(),'qa125-totem');
      const textStyle=await input.evaluate(e=>({color:getComputedStyle(e).color,
        background:getComputedStyle(e).backgroundColor,placeholder:getComputedStyle(e,'::placeholder').color}));
      const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{
        const x=n/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;
      }).reduce((sum,x,i)=>sum+x*[0.2126,0.7152,0.0722][i],0);
      const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+0.05)/(Math.min(luminance(a),luminance(b))+0.05);
      const textContrast=ratio(textStyle.color,textStyle.background);
      const placeholderContrast=ratio(textStyle.placeholder,textStyle.background);
      assert(textContrast>=4.5,JSON.stringify({textStyle,textContrast}));
      assert(placeholderContrast>=4.5,JSON.stringify({textStyle,placeholderContrast}));
      await input.scrollIntoViewIfNeeded();
      const png=await page.screenshot({path:'docs/evidencias/125-kiosk-'+name+'.png',fullPage:true});
      const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
      const colors=new Set();for(let i=0;i<data.length;i+=info.channels*37)colors.add(data.subarray(i,i+3).toString('hex'));
      assert(colors.size>16); assert.equal(errors.length,0,JSON.stringify(errors));
      cases.push({name:name+'-named-totem-error-announced-no-launch',status:'PASS',colors:colors.size,
        screenshot:'125-kiosk-'+name+'.png',physicalDeviceLaunched:false,pageErrors:errors,textStyle,textContrast,placeholderContrast});
      await page.goto('http://127.0.0.1:3301/settings/instalar-app');
      await page.getByRole('heading',{name:'AK Producciones en Android y PC',exact:true}).waitFor();
      assert.equal(await page.getByText('AK Producciones ya esta instalada en este dispositivo.',{exact:true}).count(),0);
      assert.equal(errors.length,0,JSON.stringify(errors));
      await page.screenshot({path:'docs/evidencias/125-pwa-page-'+name+'.png',fullPage:true});
      cases.push({name:name+'-install-page-loads-without-false-installed',status:'PASS',osInstallationTriggered:false});
    } finally { await context.close(); }
  }
  fs.writeFileSync('docs/evidencias/125-kiosk-native.json',JSON.stringify({applicationSourceSha:source,
    allPassed:true,cases,hardwareCertified:false,realLoginCertified:false,realOsPwaInstallCertified:false},null,2)+'\n');
  console.log(JSON.stringify({source,cases:cases.length,allPassed:true}));
} catch(error) {
  fs.writeFileSync('docs/evidencias/125-kiosk-native.json',JSON.stringify({applicationSourceSha:source,
    allPassed:false,cases,error:String(error)},null,2)+'\n');throw error;
} finally { await browser.close(); }
