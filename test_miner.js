const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    await page.goto('http://localhost:8080/games/deep-miner/index.html', { waitUntil: 'networkidle2' });
    
    // wait for 2 seconds to see if it crashes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Simulating click on start button...");
    await page.mouse.click(200, 500); // Click the 'START DIGGING' button
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await browser.close();
})();
