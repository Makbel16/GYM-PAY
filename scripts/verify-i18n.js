const fs = require('fs');
const path = require('path');

const enContent = fs.readFileSync(path.join(__dirname, '../src/i18n/en.ts'), 'utf8');
const amContent = fs.readFileSync(path.join(__dirname, '../src/i18n/am.ts'), 'utf8');

function extractKeys(tsContent) {
  const matches = tsContent.match(/^\s*([a-zA-Z0-9_]+):/gm);
  if (!matches) return [];
  return matches.map(m => m.replace(/[:\s]/g, '')).sort();
}

const enKeys = extractKeys(enContent);
const amKeys = extractKeys(amContent);

console.log(`English keys count: ${enKeys.length}`);
console.log(`Amharic keys count: ${amKeys.length}`);

const missingInAm = enKeys.filter(k => !amKeys.includes(k));
const missingInEn = amKeys.filter(k => !enKeys.includes(k));

if (missingInAm.length > 0) {
  console.error('Keys in EN but missing in AM:', missingInAm);
}
if (missingInEn.length > 0) {
  console.error('Keys in AM but missing in EN:', missingInEn);
}

if (missingInAm.length === 0 && missingInEn.length === 0) {
  console.log('✔ English and Amharic dictionaries are 100% synchronized and complete!');
} else {
  process.exit(1);
}
