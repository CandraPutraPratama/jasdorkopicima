import { getOutletsByBrand } from '../src/lib/outlet-service.ts';
import { isOutletClosed } from '../src/lib/orderability.ts';

async function check() {
  const outlets = await getOutletsByBrand('fore');
  console.log('Total Fore outlets:', outlets.length);
  const openList = [];
  const closedList = [];
  for (const o of outlets) {
    const closed = isOutletClosed(o);
    if (!closed) {
      openList.push(o);
    } else {
      closedList.push(o);
    }
  }
  console.log(`Open right now: ${openList.length}`);
  console.log(`Closed right now: ${closedList.length}`);
  if (openList.length > 0) {
    console.log('Open outlets:');
    for (const o of openList.slice(0, 5)) {
      console.log(`  - ${o.name} (${o.code}) [${o.openTime} - ${o.closeTime}]`);
    }
  } else {
    console.log('Sample closed outlets:');
    for (const o of closedList.slice(0, 5)) {
      console.log(`  - ${o.name} (${o.code}) [${o.openTime} - ${o.closeTime}]`);
    }
  }
}

check().catch(console.error);
