async function inspectJasdorSites() {
  console.log('--- Inspecting jasdorforyou.my.id ---');
  try {
    const res = await fetch('https://jasdorforyou.my.id/?view=catalog&brand=fore', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    console.log('jasdorforyou HTML length:', html.length);

    // Cari API calls atau URLs di HTML
    const urls = [...html.matchAll(/https?:\/\/[^\s"'>]+/g)].map((m) => m[0]);
    const apiUrls = urls.filter((u) => u.includes('api') || u.includes('json') || u.includes('fore'));
    console.log('Sample matching URLs from jasdorforyou:', [...new Set(apiUrls)].slice(0, 20));

    // Cari x-data di Alpine.js
    const xDataMatches = [...html.matchAll(/x-data="([^"]+)"/g)].map((m) => m[1]);
    console.log('Alpine x-data values:', xDataMatches);

    // Cari script tag inline yang besar
    const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)];
    for (let i = 0; i < scripts.length; i++) {
      const code = scripts[i][1];
      if (code.includes('fore') || code.includes('catalog') || code.includes('products') || code.includes('options')) {
        console.log(`Script inline ${i} matches! Length: ${code.length}`);
        // Cek apakah ada objek JSON besar atau fetch
        const fetches = [...code.matchAll(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
        if (fetches.length) console.log(`Fetches in script ${i}:`, fetches);
      }
    }
  } catch (err) {
    console.error('Error jasdorforyou:', err.message);
  }

  console.log('\n--- Inspecting jasdorin.com ---');
  try {
    const res = await fetch('https://www.jasdorin.com/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    console.log('jasdorin HTML length:', html.length);

    // Cek route di Next.js script chunks
    const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    console.log('jasdorin script sources:', scriptSrcs.slice(0, 10));

    // Cek apakah ada API endpoint yang dipanggil
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      console.log('Found __NEXT_DATA__!');
    }
  } catch (err) {
    console.error('Error jasdorin:', err.message);
  }
}

inspectJasdorSites().catch(console.error);
