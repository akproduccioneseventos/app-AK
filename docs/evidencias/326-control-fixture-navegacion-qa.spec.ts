import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
import {esErrorDelArmazonAlRedirigir} from './helpers/errores-que-no-son-de-la-app';

const fiesta=crearFiestaDeEstaNoche({id:'e2e_control326_'+Date.now()});
test.beforeAll(()=>guardarFiesta(fiesta));test.afterAll(()=>borrarFiesta(fiesta.id));

test('fixture normal: portada, panel y fiesta real con sesion completa y registroFIS local',async({page,context,baseURL},info)=>{
  test.setTimeout(180000);await ponerSesionDelEquipo(context,baseURL);
  const registration=[] as string[],errors=[] as string[],results=[] as unknown[];
  await context.route('https://firebaseinstallations.googleapis.com/**',async route=>{
    const u=new URL(route.request().url());registration.push(u.pathname);
    const body=u.pathname.endsWith('authTokens:generate')?{token:'qa-fis-only',expiresIn:'604800s'}:{fid:'c'+'a'.repeat(21),refreshToken:'qa-fis-refresh-only',authToken:{token:'qa-fis-only',expiresIn:'604800s'}};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  page.on('pageerror',e=>{if(!esErrorDelArmazonAlRedirigir(e.message))errors.push(e.message);});
  for(const route of['/','/empresa/dashboard',`/fiestas/nueva?fiestaId=${fiesta.id}`]){
    const response=await page.goto(route,{waitUntil:'domcontentloaded'});expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toContainText(/AK|Fiesta|Panel/i,{timeout:30000});
    await page.waitForTimeout(1500);expect(new URL(page.url()).pathname).not.toBe('/login');
    if(route.includes('fiestaId='))await expect(page.locator('body')).toContainText('Fiesta de esta noche',{timeout:30000});
    const text=await page.locator('body').innerText();expect(text).not.toMatch(/No ten[eé]s permiso|No tiene permisos|Acceso denegado/i);
    results.push({route,final:new URL(page.url()).pathname,status:response?.status(),containsFixture:route.includes('fiestaId=')?text.includes('Fiesta de esta noche'):undefined});
  }
  await info.attach('control-fixture',{body:JSON.stringify({results,registration,errors,provider:'LOCAL DOUBLE FIS registration only, no realFirebase acceptance'}),contentType:'application/json'});
  expect(registration.length,'El doble tiene que haber recibido el registro: no aprobar porque el SDK nunca arranco').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
