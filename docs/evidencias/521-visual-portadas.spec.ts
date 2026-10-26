import {expect,test} from '@playwright/test';

test('portadas publicas: captura visible y ancho util en PC y celular',async({page},info)=>{
  test.setTimeout(240_000);
  const routes=['/','/simulador','/tecnologia','/blog','/evento/barra/fiesta-demo/listo'];
  for(let i=0;i<routes.length;i++){
    const response=await page.goto(routes[i],{waitUntil:'domcontentloaded'});
    expect(response?.status(),routes[i]).toBe(200);
    await expect(page.locator('h1,h2').first()).toBeVisible({timeout:30000});
    const image=await page.screenshot({fullPage:false});
    await info.attach(`portada-${i+1}`,{body:image,contentType:'image/png'});
    const dimensions=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth,title:document.title,path:location.pathname}));
    await info.attach(`dimensiones-${i+1}`,{body:JSON.stringify(dimensions),contentType:'application/json'});
    expect(dimensions.scroll,`Desborde de ${routes[i]}`).toBeLessThanOrEqual(dimensions.width+1);
  }
});
