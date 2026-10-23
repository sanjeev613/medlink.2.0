import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_ERROR:', error.message));
  page.on('requestfailed', request => console.error('NETWORK_ERROR:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  console.log('Logging in...');
  await page.evaluate(() => {
    const patientDemoChip = Array.from(document.querySelectorAll('.demo-chip')).find(el => el.textContent.includes('Patient'));
    if (patientDemoChip) patientDemoChip.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log('Switching to SOS view...');
  await page.evaluate(() => {
    const sosItem = Array.from(document.querySelectorAll('.sidebar-item')).find(el => el.textContent.includes('SOS Ambulance'));
    if (sosItem) sosItem.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking captureGPS button...');
  await page.evaluate(() => {
    const sosBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('SOS') || btn.classList.contains('sos-btn'));
    if (sosBtn) sosBtn.click();
  });

  console.log('Waiting 5 seconds for map to load/crash...');
  await new Promise(r => setTimeout(r, 5000));
  
  const rootHtml = await page.$eval('#root', el => el.innerHTML);
  if (!rootHtml || rootHtml.trim() === '') {
     console.error('ROOT_IS_EMPTY: React crashed to a blank screen!');
  } else {
     console.log('UI is still alive.');
  }

  await browser.close();
})();
