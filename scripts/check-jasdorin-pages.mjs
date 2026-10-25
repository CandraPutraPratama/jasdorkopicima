async function checkJasdorinPages() {
  const res = await fetch('https://www.jasdorin.com/');
  const html = await res.text();
  // Cari semua link href di HTML
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  console.log('All hrefs on jasdorin homepage:', [...new Set(hrefs)]);

  // Cari webpack chunks
  const webpackScript = html.match(/src="(\/_next\/static\/chunks\/webpack-[^"]+)"/);
  if (webpackScript) {
    console.log('Webpack chunk:', webpackScript[1]);
  }
}

checkJasdorinPages().catch(console.error);
