import {test,expect} from '@playwright/test';

test('portada: tecnologia visible y plataforma360 responde a un clic real',async({page},testInfo)=>{
  test.setTimeout(180000);
  const networkFailures:unknown[]=[],jsErrors:unknown[]=[];
  page.on('requestfailed',request=>networkFailures.push({url:request.url().split('?')[0],error:request.failure()?.errorText}));
  page.on('pageerror',error=>jsErrors.push({message:error.message,stack:error.stack}));
  try{
    await page.goto('/',{waitUntil:'domcontentloaded'});
    const showcase=page.locator('#vidriera-tecnologica');
    await expect(showcase).toHaveCount(1,{timeout:60000});
    await showcase.evaluate(element=>element.scrollIntoView({block:'center'}));
    await expect(showcase).toContainText('Experiencias que hacen tu fiesta inolvidable',{timeout:30000});
    await expect(showcase).toContainText('Fotocabina Impresa',{timeout:30000});
    const button=showcase.getByRole('button',{name:/Plataforma 360/i});
    await expect(button).toBeVisible({timeout:30000});
    await button.evaluate(element=>element.scrollIntoView({block:'center'}));
    const point=await button.evaluate(element=>{
      const r=element.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y);
      return{x,y,reachable:x>=0&&y>=0&&x<innerWidth&&y<innerHeight&&Boolean(hit&&(hit===element||element.contains(hit)))};
    });
    expect(point.reachable,'El boton tiene que recibir un clic de verdad, sin force ni disparar eventos por codigo').toBe(true);
    // A moving showcase need not settle forever; click the visible, hit-tested point.
    await page.mouse.click(point.x,point.y);
    await expect(showcase).toContainText('Video Dinámico HD',{timeout:20000});
    await testInfo.attach('portada-despues-de-clic',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
  }finally{
    await testInfo.attach('qa-red-y-js',{body:JSON.stringify({networkFailures,jsErrors,captureAnimationsDisabledOnly:true}),contentType:'application/json'});
  }
});
