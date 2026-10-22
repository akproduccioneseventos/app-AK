import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base, testMatch:'**/ak207-*.spec.ts', testIgnore:['**/ak207-recorrido-de-pantallas.spec.ts'],
  workers:1,fullyParallel:false,retries:0,forbidOnly:true,globalTimeout:3*60*60*1000,
  reporter:[['line'],['json',{outputFile:process.env.AK_QA_RESULTS}]],webServer:undefined,
  use:{...base.use,trace:'retain-on-failure',video:'off',screenshot:'only-on-failure'},
  projects:base.projects?.map(project=>({...project,use:{...project.use,launchOptions:{...project.use?.launchOptions,args:[
    ...((project.use?.launchOptions as any)?.args||[]),'--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
    '--use-angle=swiftshader','--enable-unsafe-swiftshader',
  ]}}})),
});
