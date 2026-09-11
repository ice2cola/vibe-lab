import fs from 'node:fs';
import {chromium} from '@playwright/test';
export const baseURL=process.env.TEST_URL||'http://localhost:5191';
export async function launch(){
 for(const dir of ['artifacts/planet','artifacts/seasons','artifacts/responsive'])fs.mkdirSync(dir,{recursive:true});
 return chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
}
