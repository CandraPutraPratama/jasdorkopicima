import fs from 'node:fs';

async function extractJasdorinFore() {
  const res = await fetch('https://www.jasdorin.com/t/fore', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();
  console.log('HTML Length:', html.length);
  fs.writeFileSync('scripts/jasdorin-t-fore.html', html, 'utf8');
  console.log('Saved scripts/jasdorin-t-fore.html');

  // Cari API calls atau links
  const apiMatches = [...html.matchAll(/\/api\/[a-zA-Z0-9_/.-]+/gi)].map((m) => m[0]);
  console.log('APIs in /t/fore:', [...new Set(apiMatches)]);

  // Cari RSC data
  const rscChunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)].map((m) => m[1]);
  console.log('RSC Chunks:', rscChunks.length);
  const fullRSC = rscChunks.join('');
  fs.writeFileSync('scripts/jasdorin-rsc.txt', fullRSC, 'utf8');
  console.log('Saved scripts/jasdorin-rsc.txt. Size:', fullRSC.length);
}

extractJasdorinFore().catch(console.error);
