import fs from 'fs';
import path from 'path';
import { FORE_MENU_CACHE } from '../src/lib/fore-menu-data.ts';

const targetOrder = [
  'Favorit Choice',
  'Fore Signature',
  'Americano Series',
  'Coffee',
  'Non Coffee',
  'Fore Junior',
  'Refresher',
  'Tea',
  'Ice Blended',
  'FOREveryone 1L',
  'Fore Deli',
];

const existingGroups = FORE_MENU_CACHE.menuGroups;
const groupMap = new Map(existingGroups.map(g => [g.name, g]));

const reorderedGroups = [];
for (const name of targetOrder) {
  const g = groupMap.get(name);
  if (!g) {
    throw new Error(`Category "${name}" not found in existing groups!`);
  }
  reorderedGroups.push(g);
}

if (reorderedGroups.length !== existingGroups.length) {
  throw new Error(`Count mismatch: ${reorderedGroups.length} vs ${existingGroups.length}`);
}

const newMenuCacheJson = JSON.stringify({ menuGroups: reorderedGroups }, null, 2);

const filePath = path.resolve('src/lib/fore-menu-data.ts');
const originalCode = fs.readFileSync(filePath, 'utf8');

const startMarker = 'export const FORE_MENU_CACHE: { menuGroups: MenuGroup[] } = ';
const endMarker = 'export function getForeMenuForOutlet(';

const startIndex = originalCode.indexOf(startMarker);
const endIndex = originalCode.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find boundaries in fore-menu-data.ts');
}

const lastSemi = originalCode.lastIndexOf('};', endIndex);
if (lastSemi === -1 || lastSemi < startIndex) {
  throw new Error('Could not find closing }; of FORE_MENU_CACHE');
}

const updatedCode =
  originalCode.slice(0, startIndex + startMarker.length) +
  newMenuCacheJson +
  originalCode.slice(lastSemi + 1);

// Update comment at top
const finalCode = updatedCode.replace(
  /Kategori: [^\n]+/,
  'Kategori: Favorit Choice (2), Fore Signature (5), Americano Series (4), Coffee (12), Non Coffee (5), Fore Junior (4), Refresher (3), Tea (4), Ice Blended (4), FOREveryone 1L (14), Fore Deli (17).'
);

fs.writeFileSync(filePath, finalCode, 'utf8');
console.log('Successfully reordered FORE_MENU_CACHE according to user request:');
reorderedGroups.forEach((g, idx) => {
  console.log(`  ${idx + 1}. ${g.name} (${g.products.length} products)`);
});
