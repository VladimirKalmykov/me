const { chromium } = require('C:/Users/vladi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
 const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const expected = ['prettifai','yougile','kaspersky','smartpack','infotech'];
 const results=[];
 for (const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:8765/prototype/chronology/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const structure=await page.evaluate(()=>({chapters:[...document.querySelectorAll('.chapter')].map(e=>e.id),nav:[...document.querySelectorAll('.timeline-item')].map(e=>e.dataset.target),years:[...document.querySelectorAll('.timeline-head span')].map(e=>e.textContent),barEnds:[...document.querySelectorAll('.timeline-item')].map(e=>[e.style.getPropertyValue('--from'),e.style.getPropertyValue('--to')]),nowAtLeft:Math.abs(document.querySelector('.now-marker').getBoundingClientRect().left-document.querySelector('.timeline-track').getBoundingClientRect().left)<2}));
  if (JSON.stringify(structure.chapters)!==JSON.stringify(expected)||JSON.stringify(structure.nav)!==JSON.stringify(expected)) throw Error('Reading order mismatch');
  await page.locator('#prettifai').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const firstActive=await page.locator('.timeline-item.is-active').getAttribute('data-target');
  await page.screenshot({path:`.impeccable/review/first-chapter-${name}.png`,fullPage:false});
  await page.locator('a[data-target="infotech"]').click();
  await page.waitForTimeout(100);
  const finalActive=await page.locator('.timeline-item.is-active').getAttribute('data-target');
  results.push({name,structure,firstActive,finalActive,hash:await page.evaluate(()=>location.hash)});
  await page.close();
 }
 await browser.close();
 console.log(JSON.stringify(results,null,2));
})();
