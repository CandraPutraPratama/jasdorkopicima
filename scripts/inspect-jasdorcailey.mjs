async function inspectJasdorcailey() {
  console.log('--- Inspecting jasdorcailey.developerngantuk.my.id ---');
  try {
    const res = await fetch('https://jasdorcailey.developerngantuk.my.id/fore');
    const html = await res.text();
    console.log('/fore status:', res.status, 'HTML length:', html.length);
    // Cari scripts di HTML
    const scriptSrcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
    console.log('Script sources:', scriptSrcs);

    // Cari API calls
    for (const src of scriptSrcs) {
      if (src.endsWith('.js')) {
        const fullUrl = src.startsWith('http') ? src : `https://jasdorcailey.developerngantuk.my.id${src}`;
        try {
          const jsRes = await fetch(fullUrl);
          const jsCode = await jsRes.text();
          console.log(`Fetched ${src} (${jsCode.length} bytes)`);
          const apiMatches = [...jsCode.matchAll(/\/api\/[a-zA-Z0-9_/.-]+/gi)].map((m) => m[0]);
          if (apiMatches.length) {
            console.log(`APIs in ${src}:`, [...new Set(apiMatches)]);
          }
          // Cari custom / options / addon
          if (jsCode.includes('option') || jsCode.includes('custom') || jsCode.includes('dairy') || jsCode.includes('milk')) {
            console.log(`Found option/custom/dairy/milk in ${src}!`);
          }
        } catch (e) {
          console.error(`Failed ${src}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error('Error jasdorcailey:', err.message);
  }
}

inspectJasdorcailey().catch(console.error);
