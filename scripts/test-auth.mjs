import puppeteer from 'puppeteer';

async function runTest() {
  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to /login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Type credentials
    console.log('Typing credentials...');
    await page.type('input[type="email"]', 'admin123@gmail.com');
    await page.type('input[type="password"]', 'Admin123');
    
    // Click submit
    console.log('Clicking submit...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to /
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check URL
    const url = page.url();
    if (url === 'http://localhost:3000/') {
      console.log('SUCCESS: Navigated to index page (Session created).');
    } else {
      console.error(`FAILED: Unexpected URL: ${url}`);
      process.exitCode = 1;
    }
    
    // Check cookies for sb- access token
    const cookies = await page.cookies();
    const hasSessionCookie = cookies.some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
    if (hasSessionCookie) {
      console.log('SUCCESS: Supabase auth cookie is set.');
    } else {
      console.error('FAILED: No Supabase auth cookie found.');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTest();
