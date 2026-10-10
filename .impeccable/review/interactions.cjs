const { chromium } = require('C:/Users/vladi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:320,height:720},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/prototype/chronology/',{waitUntil:'networkidle'});
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:'.impeccable/review/chronology-small-mobile.png',fullPage:false});
await page.keyboard.press('Tab');
const firstFocus=await page.evaluate(()=>({text:document.activeElement.textContent.trim(),outline:getComputedStyle(document.activeElement).outlineStyle}));
await page.locator('a[data-target="smartpack"]').click();
await page.waitForTimeout(1000);
const hash=await page.evaluate(()=>location.hash);
const active=await page.locator('.timeline-item.is-active').getAttribute('data-target');
await page.locator('a[data-target="yougile"]').hover();
await page.waitForTimeout(400);
const detail=await page.locator('a[data-target="yougile"] .timeline-item-detail').evaluate(el=>({opacity:getComputedStyle(el).opacity,text:el.textContent}));
console.log(JSON.stringify({firstFocus,hash,active,detail},null,2));
await browser.close();
})();

