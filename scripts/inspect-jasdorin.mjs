async function inspectJasdorin() {
  console.log('--- Inspecting jasdorin.com Fore ---');
  // Coba fetch /fore
  try {
    const res = await fetch('https://www.jasdorin.com/fore', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    console.log('/fore status:', res.status, res.headers.get('content-type'));
    const html = await res.text();
    console.log('/fore HTML length:', html.length);
    // Cari JSON data di page
    const rscMatches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
    console.log('RSC chunks count:', rscMatches.length);

    // Cari keywords fore di HTML
    const foreOccurrences = [...html.matchAll(/fore[a-z0-9_-]*/gi)].map((m) => m[0]);
    console.log('Fore tokens count:', foreOccurrences.length);
    console.log('Sample tokens:', [...new Set(foreOccurrences)].slice(0, 20));

    // Cek apakah ada outlet atau menu
    if (html.includes('menu') || html.includes('outlet') || html.includes('produk')) {
      console.log('HTML contains menu/outlet keywords');
    }
  } catch (err) {
    console.error('Error fetching /fore:', err.message);
  }

  // Coba cek sitemap atau robots
  try {
    const sitemapRes = await fetch('https://www.jasdorin.com/sitemap.xml');
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      console.log('Sitemap URLs sample:', [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    }
  } catch (err) {
    console.error('Error sitemap:', err.message);
  }
}

inspectJasdorin().catch(console.error);
