async function check() {
  const url = 'http://localhost:3000/api/outlets/fore-fore%20coffee%20cempaka%20putih/menu';
  const res = await fetch(url);
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Total menu groups returned:', data.menuGroups.length);
  for (const g of data.menuGroups) {
    console.log(`  - ${g.name} (${g.code}): ${g.products.length} item`);
  }
}

check().catch(console.error);
