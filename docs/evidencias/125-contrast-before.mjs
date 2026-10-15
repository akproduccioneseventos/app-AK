import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
assert.equal(process.env.COMMIT_SHA,'42a25a319fe06a9fec40e75e5b23c01addef8ce2');
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage();await page.goto('http://127.0.0.1:3302/entrada');
  await page.getByRole('button',{name:'Tótem LED',exact:true}).click();
  const input=page.getByLabel('Identificador del Tótem',{exact:true});await input.fill('qa125-totem');
  const observed=await input.evaluate(e=>({value:e.value,color:getComputedStyle(e).color,
    background:getComputedStyle(e).backgroundColor,theme:document.documentElement.className}));
  const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
  const luminance=s=>rgb(s).map(n=>{const x=n/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;})
    .reduce((sum,x,i)=>sum+x*[0.2126,0.7152,0.0722][i],0);
  const a=luminance(observed.color),b=luminance(observed.background);
  const contrast=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
  assert.equal(observed.value,'qa125-totem');
  fs.writeFileSync('docs/evidencias/125-contrast-before.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,
    observed,contrast,minimum:4.5,contrastPassed:contrast>=4.5,kind:'ACTUAL_COMPILED_BROWSER_NOT_CSS_MOCK'},null,2)+'\n');
  console.log(JSON.stringify({observed,contrast,contrastPassed:contrast>=4.5}));
} finally {await browser.close();}
