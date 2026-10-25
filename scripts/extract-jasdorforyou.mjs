import fs from 'node:fs';

async function extractJasdorforyouData() {
  const res = await fetch('https://jasdorforyou.my.id/?view=catalog&brand=fore', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();

  const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)];
  for (let i = 0; i < scripts.length; i++) {
    const code = scripts[i][1];
    if (code.includes('storefrontApp')) {
      console.log(`Found storefrontApp in script ${i}! Saving to disk...`);
      fs.writeFileSync('scripts/jasdorforyou-storefrontApp.js', code, 'utf8');
      console.log('Saved scripts/jasdorforyou-storefrontApp.js. Size:', code.length);
      break;
    }
  }
}

extractJasdorforyouData().catch(console.error);
