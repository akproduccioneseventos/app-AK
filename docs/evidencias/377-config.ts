import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.filter(p=>p.name==='chromium-desktop')});
