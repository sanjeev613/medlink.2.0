import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_ERROR:', error.message));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const patientDemoChip = Array.from(document.querySelectorAll('.demo-chip')).find(el => el.textContent.includes('Patient'));
    if (patientDemoChip) patientDemoChip.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const sosItem = Array.from(document.querySelectorAll('.sidebar-item')).find(el => el.textContent.includes('SOS Ambulance'));
    if (sosItem) sosItem.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('First click...');
  await page.evaluate(() => {
    const sosBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('SOS') || btn.classList.contains('sos-btn'));
    if (sosBtn) sosBtn.click();
  });
  await new Promise(r => setTimeout(r, 14000)); // wait for full arrival (approx 12s)
  
  const rootHtml = await page.$eval('#root', el => el.innerHTML);
  if (!rootHtml) console.error('CRASHED');
  
  console.log('Canceling request / Clicking again if possible...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Cancel Request'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    const sosBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('SOS') || btn.classList.contains('sos-btn'));
    if (sosBtn) sosBtn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  
  const rootHtml2 = await page.$eval('#root', el => el.innerHTML);
  if (!rootHtml2) console.error('CRASHED ON SECOND RUN');
  else console.log('UI ALIVE');

  await browser.close();
})();
