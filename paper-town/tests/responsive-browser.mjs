import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launch,baseURL} from './browser-helper.mjs';
fs.mkdirSync('artifacts/responsive',{recursive:true});
const browser=await launch();
try {
 const page=await browser.newPage({deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${baseURL}/?debug=0&aspect=square`);
 await page.waitForFunction(()=>window.__planet);await page.evaluate(()=>__planet.pause(true));
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844],['landscape',844,390]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(600);
  const result=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,aspect:__planet.view.camera.aspect,scroll:document.documentElement.scrollWidth};});
  assert.equal(result.width,width);assert.equal(result.height,height);assert.equal(result.x,0);assert.equal(result.y,0);assert.equal(result.aspect,width/height);assert.equal(result.scroll,width);
  await page.locator('.environment-toggle').click();assert.ok(await page.locator('#time-slider').isVisible());await page.locator('.environment-close').click();
  await page.screenshot({path:`artifacts/responsive/${name}.png`});console.log(name,JSON.stringify(result));
 }
 assert.deepEqual(errors,[]);
} finally {await browser.close();}