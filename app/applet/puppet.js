const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching puppeteer...');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    await page.goto('http://localhost:3000/swaddle-gami.html', {waitUntil: 'networkidle0'});
    console.log('Done!');
    await browser.close();
})();
