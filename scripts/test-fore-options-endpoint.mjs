async function run() {
  const tests = [
    { name: 'Americano', code: 'FORE_AMERICANO' },
    { name: 'Buttercream Latte', code: 'FORE_BUTTERCREAM_LATTE' },
    { name: 'Beef Mentai Sandwich', code: 'FORE_BEEF_MENTAI_SANDWICH' },
    { name: 'Aren Latte 1L', code: 'FORE_AREN_LATTE_1L' },
  ];

  const outlet = 'fore-fore coffee cempaka putih';

  for (const t of tests) {
    const url = `http://localhost:3000/api/outlets/${encodeURIComponent(outlet)}/products/${encodeURIComponent(t.code)}/options`;
    console.log(`\n=== Testing: ${t.name} ===`);
    console.log(`URL: ${url}`);
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    if (!res.ok) {
      console.error(`Error: ${await res.text()}`);
      continue;
    }
    const data = await res.json();
    const opt = data.options;
    console.log(`Dimensions: ${opt.dimensions.map(d => `${d.name} (${d.values.map(v => v.name).join(', ')})`).join(' | ') || 'None'}`);
    console.log(`Notes: ${opt.notes.map(n => `${n.name} (${n.options.length} pilihan)`).join(', ') || 'None'}`);
    console.log(`Addons: total ${opt.addons.length} items`);
    const dairies = opt.addons.filter(a => a.group === 'dairy');
    const espressos = opt.addons.filter(a => a.group === 'espresso');
    const syrups = opt.addons.filter(a => a.group === 'syrup');
    const toppings = opt.addons.filter(a => a.group === 'topping');
    console.log(`  - Dairy: ${dairies.map(d => `${d.name} (+${d.price})`).join(', ') || 'None'}`);
    console.log(`  - Espresso: ${espressos.map(e => `${e.name} (+${e.price})`).join(', ') || 'None'}`);
    console.log(`  - Syrup: ${syrups.map(s => `${s.name} (+${s.price})`).join(', ') || 'None'}`);
    console.log(`  - Topping: ${toppings.map(t => `${t.name} (+${t.price})`).join(', ') || 'None'}`);
  }
}

run().catch(console.error);
