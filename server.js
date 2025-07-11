const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve homepage
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Capture screenshot
app.post('/capture', async (_req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const localFilePath = `file://${path.join(__dirname, 'public', 'index.html')}`;
    await page.goto(localFilePath, { waitUntil: 'networkidle2' });

    // Wait for image to load
    await page.waitForSelector('#infographicImage', { visible: true, timeout: 5000 });

    const element = await page.$('#infographicImage');
    let imageBuffer;

    if (element) {
      imageBuffer = await element.screenshot({ type: 'png' });
    } else {
      console.warn('Element not found. Capturing full page as fallback.');
      imageBuffer = await page.screenshot({ fullPage: true, type: 'png' });
    }

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="screenshot.png"'
    });
    res.send(imageBuffer);

  } catch (err) {
    console.error('Screenshot capture failed:', err);
    res.status(500).send('Screenshot failed.');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
