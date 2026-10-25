import{test,expect}from'@playwright/test';
import{crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta}from'./helpers/fiesta-de-prueba';
import{createRequire}from'node:module';
const req=createRequire(process.cwd()+'/package.json'),admin=req('firebase-admin/app'),fire=req('firebase-admin/firestore');
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw Error('Demo emulator required');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa624-'+process.pid),db=fire.getFirestore(app);
const fiesta=crearFiestaDeEstaNoche({id:'e2e_muro624_'+Date.now()}),guest=fiesta.invitados![0];
test.beforeAll(()=>guardarFiesta(fiesta));test.afterAll(async()=>{borrarFiesta(fiesta.id);await db.terminate();await admin.deleteApp(app);});
test('publicacion con foto valida persiste una vez y distingue pendiente de publicada',async({page,browser},info)=>{
 test.setTimeout(150000);
 await page.goto(`/evento/social/${fiesta.id}?guestId=${guest.id}&token=${guest.guestAccessToken}`,{waitUntil:'domcontentloaded'});
 const nombre=page.getByPlaceholder(/Ej: Sofía Pérez|Tu nombre/i).first();if(await nombre.isVisible().catch(()=>false)){await nombre.fill('QA624 Ficticia');await page.getByRole('button',{name:/Continuar|Entrar|Listo/i}).first().click();}
 await page.getByText(/Qué querés compartir/i).first().click();
 await page.locator('input[type=file]').first().setInputFiles('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria267-cierre/docs/evidencias/623-foto-ficticia.png');
 await expect(page.getByAltText('Vista previa')).toBeVisible({timeout:30000});
 const caption='QA624 persistencia '+info.project.name;await page.getByPlaceholder('¿Qué querés contar sobre este momento?').fill(caption);
 const publish=page.getByRole('button',{name:/^Publicar$/i});await expect(publish).toBeEnabled();
 await publish.click();const feedback=page.getByText(/Momento enviado|Momento publicado|No se pudo publicar|Esta foto no está permitida/i).first();
 await expect(feedback).toBeVisible({timeout:60000});const feedbackText=await feedback.innerText();
 let rows:any[]=[];await expect.poll(async()=>{const snap=await db.collection('social_gallery_posts').where('fiestaId','==',fiesta.id).get();rows=snap.docs.map((d:any)=>({id:d.id,...d.data()}));return rows.length;},{timeout:30000}).toBe(1);
 const post=rows[0];expect(post.imageUrl).toBeTruthy();
 await info.attach('qa624-persistencia',{contentType:'application/json',body:Buffer.from(JSON.stringify({id:post.id,fiestaId:post.fiestaId,status:post.moderationStatus,feedback:feedbackText,imagePresent:!!post.imageUrl,caption:post.dedication||post.caption}))});
 await page.reload({waitUntil:'domcontentloaded'});
 const again=await db.collection('social_gallery_posts').where('fiestaId','==',fiesta.id).get();expect(again.docs.map((d:any)=>d.id)).toEqual([post.id]);
 const anonymous=await browser.newContext();await anonymous.route('**/*',r=>{const u=new URL(r.request().url());return /^https?:$/.test(u.protocol)&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname)?r.abort('blockedbyclient'):r.continue();});
 try{const publicPage=await anonymous.newPage();await publicPage.goto(`/evento/social/${fiesta.id}`,{waitUntil:'domcontentloaded'});await expect(publicPage.locator('body')).toContainText(/Muro social/i);if(post.moderationStatus==='pending')await expect(publicPage.getByText(caption,{exact:true})).toHaveCount(0);}
 finally{await anonymous.close();}
 if(post.moderationStatus==='pending')expect(feedbackText,'Un pendiente no debe anunciarse publicado').not.toMatch(/Momento publicado/i);
});
