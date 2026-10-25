async function findJasdorinRoutes() {
  const chunks = [
    'https://www.jasdorin.com/_next/static/chunks/app/(public)/layout-d5c637bcbc689ed6.js',
    'https://www.jasdorin.com/_next/static/chunks/1935-a47f49901724e6b3.js',
    'https://www.jasdorin.com/_next/static/chunks/8064-6ec04a1ee4d97ed3.js',
  ];

  for (const url of chunks) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(`Chunk ${url.split('/').pop()} size: ${text.length}`);
      // Cari kata fore
      const foreMatches = [...text.matchAll(/fore[a-zA-Z0-9_/.-]*/gi)].map((m) => m[0]);
      if (foreMatches.length) {
        console.log(`Fore matches in ${url.split('/').pop()}:`, [...new Set(foreMatches)].slice(0, 30));
      }
      // Cari API endpoints
      const apiMatches = [...text.matchAll(/\/api\/[a-zA-Z0-9_/.-]+/gi)].map((m) => m[0]);
      if (apiMatches.length) {
        console.log(`API endpoints in ${url.split('/').pop()}:`, [...new Set(apiMatches)].slice(0, 30));
      }
    } catch (err) {
      console.error('Error fetching chunk:', err.message);
    }
  }
}

findJasdorinRoutes().catch(console.error);
