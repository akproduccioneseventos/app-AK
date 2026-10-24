import {test,expect} from '@playwright/test';

test('portada: un clic real selecciona360 y cambia el contacto comercial',async({page},testInfo)=>{
  test.setTimeout(180000);
  await page.addInitScript(()=>{
    (window as any).__qa306Clicks=[];
    document.addEventListener('click',event=>{
      const button=(event.target as Element|null)?.closest('button');
      if(button)(window as any).__qa306Clicks.push({text:button.textContent,trusted:event.isTrusted});
    },true);
  });
  try{
    await page.goto('/',{waitUntil:'domcontentloaded'});
    const showcase=page.locator('#vidriera-tecnologica');
    await expect(showcase).toHaveCount(1,{timeout:60000});
    await expect(showcase.getByRole('heading',{level:3,name:'Tótem Touch IA',exact:true})).toBeAttached({timeout:30000});
    const button=showcase.getByRole('button',{name:/Plataforma 360/i});
    await button.click({timeout:45000});
    const clicks=await page.evaluate(()=>(window as any).__qa306Clicks);
    await testInfo.attach('clic-real',{body:JSON.stringify(clicks),contentType:'application/json'});
    expect(clicks.at(-1)).toMatchObject({trusted:true});
    expect(clicks.at(-1).text).toMatch(/Plataforma 360/);
    await expect(showcase.getByRole('heading',{level:3,name:/Plataforma 360/i})).toBeVisible({timeout:30000});
    await expect(showcase).toContainText('Video Dinámico HD');
    await expect(showcase.getByRole('link',{name:/Quiero Plataforma 360/i})).toHaveAttribute('href',/Plataforma/);
    await testInfo.attach('estado-seleccionado',{body:JSON.stringify({heading:await showcase.locator('h3').allTextContents(),link:await showcase.getByRole('link',{name:/Quiero Plataforma 360/i}).getAttribute('href')}),contentType:'application/json'});
  }finally{
    await testInfo.attach('portada-final',{body:await page.screenshot({animations:'disabled',timeout:10000}).catch(()=>Buffer.alloc(0)),contentType:'image/png'});
  }
});
