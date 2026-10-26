import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,globalTimeout:4*60*60*1000,projects:base.projects?.map(p=>({...p,grep:/ak207-/}))});
