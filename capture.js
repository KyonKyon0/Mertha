const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:3000';

async function captureScreenshots() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 390, height: 844 });
  
  const outDir = path.join(__dirname, 'references', 'implementation');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  try {
    console.log('Capturing Landing Page After Rebuild...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(outDir, 'landing-after-rebuild.png'), fullPage: true });

    console.log('Done!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
