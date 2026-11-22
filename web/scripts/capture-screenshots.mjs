/** Capture the published case and technical evidence at the configured Pages subpath. */
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir=process.env.SCREENSHOT_OUTPUT_DIR??fileURLToPath(new URL('../../docs/assets/',import.meta.url));
const base=(process.env.SCREENSHOT_BASE_URL??'http://127.0.0.1:3200').replace(/\/$/,'');
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1280,height:850},reducedMotion:'reduce'});
  await page.goto(base+'/');
  await expect(page.getByRole('heading',{name:'Can Willow mark Maya’s report as received?'})).toBeVisible();
  await page.getByRole('radio',{name:'Report B'}).check();
  await page.getByText('Inspect document details').click();
  await page.getByLabel('Request cited by the inbox document').fill('ServiceRequest/earlier-request');
  await page.getByRole('radio',{name:'Continue tracking the report'}).check();
  await page.getByRole('button',{name:'Check my review note'}).click();
  await expect(page.getByText('Both parts of your note are supported.')).toBeVisible();
  await mkdir(dir,{recursive:true});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:path.join(dir,'referral-study.jpg'),type:'jpeg',quality:87});
  await page.getByRole('radio',{name:'Pilot the interactive exercise'}).check();
  await page.getByRole('link',{name:'Trace this case and sponsor choice'}).click();
  await page.getByRole('button',{name:'C24 · Refiled to prior'}).click();
  await expect(page.getByText('Receipt supported',{exact:true})).toBeVisible();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:path.join(dir,'referral-trace.jpg'),type:'jpeg',quality:87});
} finally {await browser.close();}
