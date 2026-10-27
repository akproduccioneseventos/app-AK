/** @jest-environment node */
import crypto from 'crypto';
import fs from 'fs';
let cookieToken:string|undefined;
let users:Record<string,any>={};
let reads=0;
let barrier:Promise<void>|null=null;
let release:(()=>void)|null=null;
const copy=(x:any)=>JSON.parse(JSON.stringify(x));
jest.mock('next/headers',()=>({cookies:async()=>({get:(name:string)=>name==='ak_session'&&cookieToken?{value:cookieToken}:undefined,set:(name:string,value:string)=>{if(name==='ak_session')cookieToken=value;}})}));
jest.mock('@/lib/commercial/public-rate-limit',()=>({enforcePublicRateLimit:async()=>{}}));
jest.mock('@/lib/auth/diagnostico-acceso',()=>({diagnosticarAcceso:async()=>({})}));
jest.mock('@/app/actions/notifications',()=>({createNotification:async()=>({success:true})}));
jest.mock('@/lib/firebase/server',()=>({dbAdmin:{collection:(col:string)=>{
 const snap=(id:string)=>({id,exists:!!users[id],data:()=>users[id]?copy(users[id]):undefined,ref:{update:async(p:any)=>Object.assign(users[id],p)}});
 const collection:any={doc:(id:string)=>({get:async()=>col==='users'?snap(id):{exists:false,data:()=>undefined},update:async(p:any)=>{if(!users[id])throw Error('missing');Object.assign(users[id],copy(p));},delete:async()=>{delete users[id];},set:async()=>{}}),limit:()=>({get:async()=>({empty:Object.keys(users).length===0,docs:Object.keys(users).slice(0,1).map(snap)})}),where:(_key:string,_op:string,val:string)=>({limit:()=>({get:async()=>({empty:!Object.values(users).some((u:any)=>u.email===val),docs:Object.keys(users).filter(k=>users[k].email===val).map(snap)})})}),get:async()=>{const docs=Object.keys(users).map(id=>{const v=copy(users[id]);return {id,data:()=>copy(v)};});if(barrier){reads++;if(reads===2)release?.();await barrier;}return {docs,empty:docs.length===0};},add:async()=>({id:'fake'})};
 return collection;
}}}));
import { loginUser,updateUserModules,adminResetUserPassword } from '@/app/actions/auth';
import {createSignedSessionToken,verifySignedSessionToken} from '@/lib/auth/session-token';
import {requireSession,clearSessionCache} from '@/lib/auth/require-session';
const observations:any[]=[];
function user(email:string,perfil='dueno',version=1){return {email,role:perfil==='dueno'?'admin':'user',perfil,versionDeSesion:version,modules:['all'],passwordHash:crypto.createHash('sha256').update('FictionalPassword739').digest('hex'),securityQuestions:{}};}
async function ownerCookie(){cookieToken=await createSignedSessionToken({userId:'a',email:users.a.email,role:'admin',perfil:'dueno',versionDeSesion:1});}
beforeEach(()=>{clearSessionCache();cookieToken=undefined;reads=0;barrier=null;release=null;users={a:user('a@qa.invalid'),b:user('b@qa.invalid'),p:user('p@qa.invalid','personal')};delete process.env.APP_PASSWORD;});
afterAll(()=>{fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT!.replace('.json','-sesiones.json'),JSON.stringify(observations,null,2));});
test('control: login version1 da cookie aceptada',async()=>{const login=await loginUser('p@qa.invalid','FictionalPassword739');const next=await requireSession();observations.push({case:'login-v1',login,next});expect(login.success).toBe(true);expect(next.ok).toBe(true);});
test('login version2 debe quedar aceptado despues de ingresar clave correcta',async()=>{users.p.versionDeSesion=2;const login=await loginUser('p@qa.invalid','FictionalPassword739');const parsed=await verifySignedSessionToken(cookieToken!);const next=await requireSession();observations.push({case:'login-v2',login,cookie:parsed,next});expect(login.success).toBe(true);expect(next.ok).toBe(true);});
test('control: no se puede bajar al ultimo dueno',async()=>{delete users.b;await ownerCookie();const result=await updateUserModules('a',[],'user','personal');observations.push({case:'one-owner',result,owners:Object.values(users).filter((u:any)=>u.perfil==='dueno').length});expect(result.success).toBe(false);expect(users.a.perfil).toBe('dueno');});
test('dos bajas simultaneas deben conservar al menos un dueno',async()=>{await ownerCookie();barrier=new Promise(r=>{release=r;});const result=await Promise.all([updateUserModules('a',[],'user','personal'),updateUserModules('b',[],'user','personal')]);const owners=Object.values(users).filter((u:any)=>u.perfil==='dueno').length;observations.push({case:'two-owners-concurrent',result,owners});expect(owners).toBeGreaterThanOrEqual(1);});
test('cookie revocada no puede administrar claves aunque firma siga siendo valida',async()=>{await ownerCookie();users.a={...users.a,perfil:'personal',role:'user',versionDeSesion:2};clearSessionCache();const guard=await requireSession();const result=await adminResetUserPassword('p','AnotherFakePassword739');observations.push({case:'revoked-owner-admin-reset',guard,result,targetVersion:users.p.versionDeSesion});expect(guard.ok).toBe(false);expect(result.success).toBe(false);expect(users.p.versionDeSesion).toBe(1);});

