const { chromium } = require('C:/Users/vladi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const url = 'http://127.0.0.1:8765/prototype/chronology/';
  const results = [];
  for (const [name,width,height] of [['desktop',1440,900],['mobile',390,844],['small-mobile',320,720]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (name !== 'small-mobile') await page.screenshot({ path: `.impeccable/review/chronology-${name}.png`, fullPage: true });
    const metrics = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, fontLoaded: document.fonts.check('700 48px Geologica'), chapters: document.querySelectorAll('[data-chapter]').length, playheadBefore: getComputedStyle(document.querySelector('.timeline')).getPropertyValue('--playhead-position').trim() }));
    await page.locator('#yougile').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const active = await page.locator('.timeline-item.is-active').getAttribute('data-target');
    const period = await page.locator('#timeline-period').textContent();
    const playheadAfter = await page.locator('.timeline').evaluate(el => getComputedStyle(el).getPropertyValue('--playhead-position').trim());
    if (name === 'desktop') {
      await page.locator('a[data-target="smartpack"]').hover();
      metrics.hoverDetailVisible = await page.locator('a[data-target="smartpack"] .timeline-item-detail').evaluate(el => getComputedStyle(el).opacity);
    }
    results.push({ name, metrics, active, period, playheadAfter, errors });
    await page.close();
  }
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }});
  await noJs.goto(url);
  results.push({ noJsChapters: await noJs.locator('.chapter').count(), noJsContact: await noJs.locator('a[href="https://t.me/xperier"]').count() });
  await noJs.close();
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto(url);
  results.push({ reducedMotion: await reduced.locator('.timeline-playhead').evaluate(el => getComputedStyle(el).transitionDuration), scrollBehavior: await reduced.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior) });
  await reduced.close();
  await browser.close();
  console.log(JSON.stringify(results,null,2));
})();

